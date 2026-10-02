package com.freedom.freedom_backend.goalallocation;

import com.freedom.freedom_backend.user.User;
import com.freedom.freedom_backend.goal.GoalStatus;
import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class GoalAllocationService {

    private final JdbcTemplate jdbc;
    private final MoneyLedgerService ledger;

    public GoalAllocationService(
            JdbcTemplate jdbc,
            MoneyLedgerService ledger
    ) {
        this.jdbc = jdbc;
        this.ledger = ledger;
    }

    @Transactional(readOnly = true)
    public GoalAllocationSummaryResponse getSummary(
            Long goalId,
            User user
    ) {
        requireGoal(goalId, user.getId());
        return buildSummary(goalId, user.getId());
    }

    public GoalAllocationSummaryResponse allocate(
            Long goalId,
            GoalAllocationRequest request,
            User user
    ) {
        Long userId = user.getId();

        GoalRow goal = requireGoal(
                goalId,
                userId
        );

        if (goal.status() == GoalStatus.COMPLETED) {
            throw new IllegalArgumentException("Nie można dodawać środków do zakończonego celu.");
        }

        AssetRow target = requireAsset(
                request.targetAssetId(),
                userId
        );

        BigDecimal amount = request.amount();

        BigDecimal remaining =
                goal.targetAmount()
                        .subtract(goal.currentAmount());

        if (amount.compareTo(remaining) > 0) {
            throw new IllegalArgumentException(
                    "Kwota przekracza brakującą wartość celu."
            );
        }

        if (
                request.mode()
                        == GoalAllocationMode.ALLOCATE_EXISTING
        ) {
            BigDecimal available = ledger.available(target.id(), user);

            if (amount.compareTo(available) > 0) {
                throw new IllegalArgumentException(
                        "Aktywo nie ma tylu wolnych środków. Część kapitału jest już zarezerwowana."
                );
            }
        } else {
            if (request.sourceAssetId() == null) {
                throw new IllegalArgumentException(
                        "Transfer wymaga sourceAssetId."
                );
            }

            if (
                    request.sourceAssetId()
                            .equals(request.targetAssetId())
            ) {
                throw new IllegalArgumentException(
                        "Źródło i cel transferu muszą być różnymi aktywami."
                );
            }

            AssetRow source = requireAsset(
                    request.sourceAssetId(),
                    userId
            );

            ledger.transfer(source.id(), target.id(), amount, user);
        }

        upsertAllocation(
                goalId,
                target,
                amount,
                userId
        );

        jdbc.update(
                """
                INSERT INTO goal_contributions (
                    user_id,
                    goal_id,
                    amount,
                    mode,
                    source_asset_id,
                    target_asset_id
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                userId,
                goalId,
                amount,
                request.mode().name(),
                request.sourceAssetId(),
                request.targetAssetId()
        );

        // Progress = capital still reserved + capital already spent on the goal.
        // Spending must not make the progress bar go backwards.
        recomputeGoalProgress(goalId, userId);

        return buildSummary(
                goalId,
                userId
        );
    }

    @Transactional(readOnly = true)
    public MoneyFlowOverviewResponse getOverview(User user) {
        Long uid=user.getId();
        List<PortfolioAllocationResponse> rows=jdbc.query("""
            SELECT ga.goal_id,g.name goal_name,ga.asset_id,ga.asset_name_snapshot,ga.amount
            FROM goal_allocations ga JOIN goals g ON g.id=ga.goal_id
            WHERE ga.user_id=? AND ga.amount>0 ORDER BY g.name,ga.amount DESC
            """,(rs,n)->new PortfolioAllocationResponse(rs.getLong("goal_id"),rs.getString("goal_name"),
                nullableLong(rs,"asset_id"),rs.getString("asset_name_snapshot"),rs.getBigDecimal("amount")),uid);
        BigDecimal total=rows.stream().map(PortfolioAllocationResponse::amount).reduce(BigDecimal.ZERO,BigDecimal::add);
        List<Long> executed=jdbc.query("SELECT id FROM goals WHERE user_id=? AND status='COMPLETED'",
                (rs,n)->rs.getLong("id"),uid);
        return new MoneyFlowOverviewResponse(total,rows,executed);
    }

    /**
     * Kept only for API compatibility with older frontends. Goal completion is
     * no longer a hidden money-destruction event. Record real expenses linked to
     * the goal and then use /api/goals/{id}/complete.
     */
    @Deprecated
    public MoneyFlowOverviewResponse executeGoal(Long goalId, User user) {
        throw new IllegalArgumentException(
                "Ten endpoint jest przestarzały. Zarejestruj wydatek z celu, a następnie zakończ cel."
        );
    }

    public GoalAllocationSummaryResponse release(Long goalId, Long assetId, BigDecimal amount, User user) {
        Long uid = user.getId();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("Kwota musi być większa od zera.");
        requireGoal(goalId, uid);
        List<GoalAllocationItemResponse> rows = jdbc.query("""
            SELECT id,goal_id,asset_id,asset_name_snapshot,amount FROM goal_allocations
            WHERE user_id=? AND goal_id=? AND asset_id=?
            """,(rs,n)->new GoalAllocationItemResponse(rs.getLong("id"),rs.getLong("goal_id"),nullableLong(rs,"asset_id"),rs.getString("asset_name_snapshot"),rs.getBigDecimal("amount")),uid,goalId,assetId);
        if(rows.isEmpty()) throw new IllegalArgumentException("Brak takiej alokacji.");
        GoalAllocationItemResponse row=rows.getFirst();
        if(amount.compareTo(row.amount())>0) throw new IllegalArgumentException("Nie można cofnąć więcej niż przypisano.");
        jdbc.update("UPDATE goal_allocations SET amount=amount-?,updated_at=NOW() WHERE id=?",amount,row.id());
        jdbc.update("DELETE FROM goal_allocations WHERE id=? AND amount=0",row.id());
        jdbc.update("INSERT INTO goal_allocation_releases(user_id,goal_id,asset_id,asset_name_snapshot,amount) VALUES(?,?,?,?,?)",uid,goalId,assetId,row.assetName(),amount);
        recomputeGoalProgress(goalId, uid);
        return buildSummary(goalId,uid);
    }

    private void upsertAllocation(
            Long goalId,
            AssetRow asset,
            BigDecimal amount,
            Long userId
    ) {
        Integer updated = jdbc.update(
                """
                UPDATE goal_allocations
                SET amount = amount + ?,
                    asset_name_snapshot = ?,
                    updated_at = NOW()
                WHERE user_id = ?
                  AND goal_id = ?
                  AND asset_id = ?
                """,
                amount,
                asset.name(),
                userId,
                goalId,
                asset.id()
        );

        if (updated == 0) {
            jdbc.update(
                    """
                    INSERT INTO goal_allocations (
                        user_id,
                        goal_id,
                        asset_id,
                        asset_name_snapshot,
                        amount
                    )
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    userId,
                    goalId,
                    asset.id(),
                    asset.name(),
                    amount
            );
        }
    }

    private GoalRow requireGoal(
            Long goalId,
            Long userId
    ) {
        List<GoalRow> rows = jdbc.query(
                """
                SELECT id,
                       current_amount,
                       target_amount,
                       status
                FROM goals
                WHERE id = ?
                  AND user_id = ?
                """,
                (rs, rowNum) -> new GoalRow(
                        rs.getLong("id"),
                        rs.getBigDecimal("current_amount"),
                        rs.getBigDecimal("target_amount"),
                        GoalStatus.valueOf(rs.getString("status"))
                ),
                goalId,
                userId
        );

        if (rows.isEmpty()) {
            throw new IllegalArgumentException(
                    "Cel nie istnieje lub nie należy do użytkownika."
            );
        }

        return rows.getFirst();
    }

    private AssetRow requireAsset(
            Long assetId,
            Long userId
    ) {
        List<AssetRow> rows = jdbc.query(
                """
                SELECT id,
                       name,
                       value
                FROM assets
                WHERE id = ?
                  AND user_id = ?
                """,
                (rs, rowNum) -> new AssetRow(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getBigDecimal("value")
                ),
                assetId,
                userId
        );

        if (rows.isEmpty()) {
            throw new IllegalArgumentException(
                    "Aktywo nie istnieje lub nie należy do użytkownika."
            );
        }

        return rows.getFirst();
    }

    private GoalAllocationSummaryResponse buildSummary(
            Long goalId,
            Long userId
    ) {
        GoalRow goal = requireGoal(
                goalId,
                userId
        );

        List<GoalAllocationItemResponse> allocations =
                jdbc.query(
                        """
                        SELECT id,
                               goal_id,
                               asset_id,
                               asset_name_snapshot,
                               amount
                        FROM goal_allocations
                        WHERE user_id = ?
                          AND goal_id = ?
                        ORDER BY amount DESC, id ASC
                        """,
                        (rs, rowNum) ->
                                new GoalAllocationItemResponse(
                                        rs.getLong("id"),
                                        rs.getLong("goal_id"),
                                        nullableLong(rs, "asset_id"),
                                        rs.getString("asset_name_snapshot"),
                                        rs.getBigDecimal("amount")
                                ),
                        userId,
                        goalId
                );

        List<GoalContributionResponse> contributions =
                jdbc.query(
                        """
                        SELECT id,
                               goal_id,
                               amount,
                               mode,
                               source_asset_id,
                               target_asset_id,
                               created_at
                        FROM goal_contributions
                        WHERE user_id = ?
                          AND goal_id = ?
                        ORDER BY created_at DESC, id DESC
                        LIMIT 25
                        """,
                        (rs, rowNum) ->
                                new GoalContributionResponse(
                                        rs.getLong("id"),
                                        rs.getLong("goal_id"),
                                        rs.getBigDecimal("amount"),
                                        GoalAllocationMode.valueOf(
                                                rs.getString("mode")
                                        ),
                                        nullableLong(
                                                rs,
                                                "source_asset_id"
                                        ),
                                        rs.getLong("target_asset_id"),
                                        rs.getTimestamp("created_at")
                                                .toInstant()
                                ),
                        userId,
                        goalId
                );

        return new GoalAllocationSummaryResponse(
                goalId,
                goal.currentAmount(),
                allocations,
                contributions
        );
    }

    private void recomputeGoalProgress(Long goalId, Long userId) {
        GoalRow goal = requireGoal(goalId, userId);
        if (goal.status() == GoalStatus.COMPLETED) {
            return;
        }

        BigDecimal reserved = jdbc.queryForObject(
                "SELECT COALESCE(SUM(amount),0) FROM goal_allocations WHERE user_id=? AND goal_id=?",
                BigDecimal.class, userId, goalId
        );
        BigDecimal spent = jdbc.queryForObject(
                "SELECT COALESCE(SUM(amount),0) FROM goal_spendings WHERE user_id=? AND goal_id=?",
                BigDecimal.class, userId, goalId
        );

        reserved = reserved == null ? BigDecimal.ZERO : reserved;
        spent = spent == null ? BigDecimal.ZERO : spent;
        BigDecimal covered = reserved.add(spent);
        GoalStatus next = covered.compareTo(goal.targetAmount()) >= 0
                ? GoalStatus.FUNDED
                : GoalStatus.ACTIVE;

        jdbc.update(
                "UPDATE goals SET current_amount=?,status=?,completed_at=NULL WHERE id=? AND user_id=?",
                covered, next.name(), goalId, userId
        );
    }

    private Long nullableLong(
            ResultSet rs,
            String column
    ) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull()
                ? null
                : value;
    }

    private record GoalRow(
            Long id,
            BigDecimal currentAmount,
            BigDecimal targetAmount,
            GoalStatus status
    ) {
    }

    private record AssetRow(
            Long id,
            String name,
            BigDecimal value
    ) {
    }
}
