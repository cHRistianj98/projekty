package com.freedom.freedom_backend.liabilityallocation;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class LiabilityPortfolioReservationService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final JdbcTemplate jdbc;

    public LiabilityPortfolioReservationService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public BigDecimal reservedForAsset(Long assetId, Long userId) {
        List<AssetPortfolioRow> assets = jdbc.query("""
                SELECT a.id, a.portfolio_id
                FROM assets a
                WHERE a.id=? AND a.user_id=?
                """,
                (rs, rowNum) -> new AssetPortfolioRow(rs.getLong("id"), rs.getLong("portfolio_id")),
                assetId, userId
        );
        if (assets.isEmpty()) return ZERO;

        Optional<PortfolioLink> link = linkForPortfolio(assets.getFirst().portfolioId(), userId);
        if (link.isEmpty()) return ZERO;

        return dynamicReservations(link.get()).stream()
                .filter(row -> row.assetId().equals(assetId))
                .map(DynamicAssetReservation::amount)
                .findFirst()
                .orElse(ZERO);
    }

    public BigDecimal reservedForPortfolio(Long portfolioId, Long userId) {
        return linkForPortfolio(portfolioId, userId)
                .map(this::dynamicReservations)
                .orElseGet(List::of)
                .stream()
                .map(DynamicAssetReservation::amount)
                .reduce(ZERO, BigDecimal::add);
    }

    public List<DynamicAssetReservation> reservationsForLiability(Long liabilityId, Long userId) {
        return linkForLiability(liabilityId, userId)
                .map(this::dynamicReservations)
                .orElseGet(List::of);
    }

    public List<DynamicAssetReservation> reservationsForUser(Long userId) {
        List<PortfolioLink> links = jdbc.query("""
                SELECT lpa.id,
                       lpa.user_id,
                       lpa.liability_id,
                       lpa.portfolio_id,
                       p.name AS portfolio_name,
                       l.remaining_amount
                FROM liability_portfolio_allocations lpa
                JOIN portfolios p ON p.id=lpa.portfolio_id AND p.user_id=lpa.user_id
                JOIN liabilities l ON l.id=lpa.liability_id AND l.user_id=lpa.user_id
                WHERE lpa.user_id=?
                ORDER BY lpa.id
                """,
                (rs, rowNum) -> new PortfolioLink(
                        rs.getLong("id"),
                        rs.getLong("user_id"),
                        rs.getLong("liability_id"),
                        rs.getLong("portfolio_id"),
                        rs.getString("portfolio_name"),
                        rs.getBigDecimal("remaining_amount")
                ),
                userId
        );

        List<DynamicAssetReservation> result = new ArrayList<>();
        for (PortfolioLink link : links) result.addAll(dynamicReservations(link));
        return result;
    }

    public Optional<PortfolioLink> linkForLiability(Long liabilityId, Long userId) {
        List<PortfolioLink> rows = jdbc.query("""
                SELECT lpa.id,
                       lpa.user_id,
                       lpa.liability_id,
                       lpa.portfolio_id,
                       p.name AS portfolio_name,
                       l.remaining_amount
                FROM liability_portfolio_allocations lpa
                JOIN portfolios p ON p.id=lpa.portfolio_id AND p.user_id=lpa.user_id
                JOIN liabilities l ON l.id=lpa.liability_id AND l.user_id=lpa.user_id
                WHERE lpa.user_id=? AND lpa.liability_id=?
                """,
                (rs, rowNum) -> new PortfolioLink(
                        rs.getLong("id"),
                        rs.getLong("user_id"),
                        rs.getLong("liability_id"),
                        rs.getLong("portfolio_id"),
                        rs.getString("portfolio_name"),
                        rs.getBigDecimal("remaining_amount")
                ),
                userId, liabilityId
        );
        return rows.stream().findFirst();
    }

    public Optional<PortfolioLink> linkForPortfolio(Long portfolioId, Long userId) {
        List<PortfolioLink> rows = jdbc.query("""
                SELECT lpa.id,
                       lpa.user_id,
                       lpa.liability_id,
                       lpa.portfolio_id,
                       p.name AS portfolio_name,
                       l.remaining_amount
                FROM liability_portfolio_allocations lpa
                JOIN portfolios p ON p.id=lpa.portfolio_id AND p.user_id=lpa.user_id
                JOIN liabilities l ON l.id=lpa.liability_id AND l.user_id=lpa.user_id
                WHERE lpa.user_id=? AND lpa.portfolio_id=?
                """,
                (rs, rowNum) -> new PortfolioLink(
                        rs.getLong("id"),
                        rs.getLong("user_id"),
                        rs.getLong("liability_id"),
                        rs.getLong("portfolio_id"),
                        rs.getString("portfolio_name"),
                        rs.getBigDecimal("remaining_amount")
                ),
                userId, portfolioId
        );
        return rows.stream().findFirst();
    }

    private List<DynamicAssetReservation> dynamicReservations(PortfolioLink link) {
        BigDecimal explicitForLiability = value("""
                SELECT COALESCE(SUM(amount),0)
                FROM liability_allocations
                WHERE user_id=? AND liability_id=?
                """, link.userId(), link.liabilityId());

        BigDecimal headroom = link.remainingAmount().subtract(explicitForLiability).max(ZERO);
        if (headroom.signum() <= 0) return List.of();

        List<FreeAsset> assets = jdbc.query("""
                SELECT a.id,
                       a.name,
                       GREATEST(
                           a.value
                           - COALESCE((SELECT SUM(ga.amount) FROM goal_allocations ga WHERE ga.user_id=a.user_id AND ga.asset_id=a.id),0)
                           - COALESCE((SELECT SUM(la.amount) FROM liability_allocations la WHERE la.user_id=a.user_id AND la.asset_id=a.id),0),
                           0
                       ) AS free_amount
                FROM assets a
                WHERE a.user_id=? AND a.portfolio_id=?
                ORDER BY a.id
                """,
                (rs, rowNum) -> new FreeAsset(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getBigDecimal("free_amount")
                ),
                link.userId(), link.portfolioId()
        );

        List<DynamicAssetReservation> result = new ArrayList<>();
        BigDecimal remaining = headroom;
        for (FreeAsset asset : assets) {
            if (remaining.signum() <= 0) break;
            BigDecimal amount = asset.freeAmount().min(remaining);
            if (amount.signum() > 0) {
                result.add(new DynamicAssetReservation(
                        link.linkId(),
                        link.liabilityId(),
                        link.portfolioId(),
                        link.portfolioName(),
                        asset.id(),
                        asset.name(),
                        amount
                ));
                remaining = remaining.subtract(amount);
            }
        }
        return result;
    }

    private BigDecimal value(String sql, Long userId, Long liabilityId) {
        BigDecimal result = jdbc.queryForObject(sql, BigDecimal.class, userId, liabilityId);
        return result == null ? ZERO : result;
    }

    public record PortfolioLink(
            Long linkId,
            Long userId,
            Long liabilityId,
            Long portfolioId,
            String portfolioName,
            BigDecimal remainingAmount
    ) {}

    public record DynamicAssetReservation(
            Long linkId,
            Long liabilityId,
            Long portfolioId,
            String portfolioName,
            Long assetId,
            String assetName,
            BigDecimal amount
    ) {}

    private record AssetPortfolioRow(Long id, Long portfolioId) {}
    private record FreeAsset(Long id, String name, BigDecimal freeAmount) {}
}
