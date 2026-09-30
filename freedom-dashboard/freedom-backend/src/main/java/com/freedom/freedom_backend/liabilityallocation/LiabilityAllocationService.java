package com.freedom.freedom_backend.liabilityallocation;

import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class LiabilityAllocationService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final JdbcTemplate jdbc;
    private final MoneyLedgerService ledger;

    public LiabilityAllocationService(JdbcTemplate jdbc, MoneyLedgerService ledger) {
        this.jdbc = jdbc;
        this.ledger = ledger;
    }

    @Transactional(readOnly = true)
    public LiabilityAllocationSummaryResponse getSummary(Long liabilityId, User user) {
        requireLiability(liabilityId, user.getId());
        return buildSummary(liabilityId, user.getId());
    }

    @Transactional(readOnly = true)
    public LiabilityAllocationOverviewResponse getOverview(User user) {
        Long uid = user.getId();
        List<LiabilityPortfolioAllocationResponse> allocations = jdbc.query("""
                SELECT la.liability_id,
                       l.name AS liability_name,
                       l.image_url,
                       l.image_position,
                       l.original_amount,
                       l.remaining_amount,
                       la.asset_id,
                       la.asset_name_snapshot,
                       la.amount
                FROM liability_allocations la
                JOIN liabilities l
                  ON l.id = la.liability_id
                 AND l.user_id = la.user_id
                WHERE la.user_id = ?
                  AND la.amount > 0
                ORDER BY l.name, la.amount DESC, la.id
                """,
                (rs, rowNum) -> new LiabilityPortfolioAllocationResponse(
                        rs.getLong("liability_id"),
                        rs.getString("liability_name"),
                        rs.getString("image_url"),
                        rs.getString("image_position"),
                        rs.getBigDecimal("original_amount"),
                        rs.getBigDecimal("remaining_amount"),
                        (Long) rs.getObject("asset_id"),
                        rs.getString("asset_name_snapshot"),
                        rs.getBigDecimal("amount")
                ),
                uid
        );

        BigDecimal total = allocations.stream()
                .map(LiabilityPortfolioAllocationResponse::amount)
                .reduce(ZERO, BigDecimal::add);

        return new LiabilityAllocationOverviewResponse(total, allocations);
    }

    public LiabilityAllocationSummaryResponse allocate(
            Long liabilityId,
            LiabilityAllocationRequest request,
            User user
    ) {
        Long uid = user.getId();
        LiabilityRow liability = requireLiability(liabilityId, uid);
        AssetRow asset = requireAsset(request.assetId(), uid);
        BigDecimal amount = request.amount();

        BigDecimal alreadyAllocated = totalAllocatedForLiability(liabilityId, uid);
        BigDecimal stillNeeded = liability.remainingAmount().subtract(alreadyAllocated).max(ZERO);

        if (amount.compareTo(stillNeeded) > 0) {
            throw new IllegalArgumentException("Kwota przekracza niepokrytą część zobowiązania.");
        }

        BigDecimal available = ledger.available(asset.id(), user);
        if (amount.compareTo(available) > 0) {
            throw new IllegalArgumentException("Aktywo nie ma tylu wolnych środków. Część kapitału jest już zarezerwowana.");
        }

        int updated = jdbc.update("""
                UPDATE liability_allocations
                SET amount = amount + ?,
                    asset_name_snapshot = ?,
                    updated_at = NOW()
                WHERE user_id = ?
                  AND liability_id = ?
                  AND asset_id = ?
                """,
                amount, asset.name(), uid, liabilityId, asset.id()
        );

        if (updated == 0) {
            jdbc.update("""
                    INSERT INTO liability_allocations(
                        user_id, liability_id, asset_id, asset_name_snapshot, amount
                    ) VALUES (?, ?, ?, ?, ?)
                    """,
                    uid, liabilityId, asset.id(), asset.name(), amount
            );
        }

        return buildSummary(liabilityId, uid);
    }

    public LiabilityAllocationSummaryResponse release(
            Long liabilityId,
            Long assetId,
            BigDecimal amount,
            User user
    ) {
        Long uid = user.getId();
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Kwota musi być większa od zera.");
        }
        requireLiability(liabilityId, uid);

        List<LiabilityAllocationItemResponse> rows = jdbc.query("""
                SELECT id, liability_id, asset_id, asset_name_snapshot, amount
                FROM liability_allocations
                WHERE user_id = ?
                  AND liability_id = ?
                  AND asset_id = ?
                """,
                (rs, rowNum) -> new LiabilityAllocationItemResponse(
                        rs.getLong("id"),
                        rs.getLong("liability_id"),
                        (Long) rs.getObject("asset_id"),
                        rs.getString("asset_name_snapshot"),
                        rs.getBigDecimal("amount")
                ),
                uid, liabilityId, assetId
        );

        if (rows.isEmpty()) throw new IllegalArgumentException("Brak takiej rezerwy na zobowiązanie.");
        LiabilityAllocationItemResponse row = rows.getFirst();
        if (amount.compareTo(row.amount()) > 0) {
            throw new IllegalArgumentException("Nie można zwolnić więcej niż przypisano.");
        }

        jdbc.update(
                "UPDATE liability_allocations SET amount=amount-?, updated_at=NOW() WHERE id=?",
                amount, row.id()
        );
        jdbc.update("DELETE FROM liability_allocations WHERE id=? AND amount=0", row.id());

        return buildSummary(liabilityId, uid);
    }

    private LiabilityAllocationSummaryResponse buildSummary(Long liabilityId, Long uid) {
        LiabilityRow liability = requireLiability(liabilityId, uid);
        List<LiabilityAllocationItemResponse> allocations = jdbc.query("""
                SELECT id, liability_id, asset_id, asset_name_snapshot, amount
                FROM liability_allocations
                WHERE user_id = ?
                  AND liability_id = ?
                  AND amount > 0
                ORDER BY amount DESC, id
                """,
                (rs, rowNum) -> new LiabilityAllocationItemResponse(
                        rs.getLong("id"),
                        rs.getLong("liability_id"),
                        (Long) rs.getObject("asset_id"),
                        rs.getString("asset_name_snapshot"),
                        rs.getBigDecimal("amount")
                ),
                uid, liabilityId
        );

        BigDecimal allocated = allocations.stream()
                .map(LiabilityAllocationItemResponse::amount)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal effectiveRemaining = liability.remainingAmount().subtract(allocated).max(ZERO);

        return new LiabilityAllocationSummaryResponse(
                liabilityId,
                liability.remainingAmount(),
                allocated,
                effectiveRemaining,
                allocations
        );
    }

    private BigDecimal totalAllocatedForLiability(Long liabilityId, Long uid) {
        BigDecimal value = jdbc.queryForObject(
                "SELECT COALESCE(SUM(amount),0) FROM liability_allocations WHERE user_id=? AND liability_id=?",
                BigDecimal.class,
                uid, liabilityId
        );
        return value == null ? ZERO : value;
    }

    private LiabilityRow requireLiability(Long liabilityId, Long uid) {
        List<LiabilityRow> rows = jdbc.query("""
                SELECT id, remaining_amount
                FROM liabilities
                WHERE id = ? AND user_id = ?
                """,
                (rs, rowNum) -> new LiabilityRow(
                        rs.getLong("id"),
                        rs.getBigDecimal("remaining_amount")
                ),
                liabilityId, uid
        );
        if (rows.isEmpty()) throw new IllegalArgumentException("Zobowiązanie nie istnieje lub nie należy do użytkownika.");
        return rows.getFirst();
    }

    private AssetRow requireAsset(Long assetId, Long uid) {
        List<AssetRow> rows = jdbc.query("""
                SELECT id, name
                FROM assets
                WHERE id = ? AND user_id = ?
                """,
                (rs, rowNum) -> new AssetRow(rs.getLong("id"), rs.getString("name")),
                assetId, uid
        );
        if (rows.isEmpty()) throw new IllegalArgumentException("Aktywo nie istnieje lub nie należy do użytkownika.");
        return rows.getFirst();
    }

    private record LiabilityRow(Long id, BigDecimal remainingAmount) {}
    private record AssetRow(Long id, String name) {}
}
