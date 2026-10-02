package com.freedom.freedom_backend.goalspending;

import com.freedom.freedom_backend.goal.GoalStatus;
import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameterValue;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Types;
import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class GoalSpendingService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final JdbcTemplate jdbc;

    public GoalSpendingService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<SpendableGoalResponse> getSpendableGoals(Long assetId, User user) {
        requireAsset(assetId, user.getId());

        return jdbc.query(
                """
                SELECT g.id,
                       g.name,
                       g.status,
                       g.color,
                       g.image_url,
                       g.target_amount,
                       g.current_amount,
                       ga.amount AS reserved_on_asset,
                       COALESCE((
                           SELECT SUM(ga2.amount)
                           FROM goal_allocations ga2
                           WHERE ga2.user_id = g.user_id
                             AND ga2.goal_id = g.id
                       ), 0) AS total_reserved,
                       COALESCE((
                           SELECT SUM(gs.amount)
                           FROM goal_spendings gs
                           WHERE gs.user_id = g.user_id
                             AND gs.goal_id = g.id
                       ), 0) AS spent_amount
                FROM goals g
                JOIN goal_allocations ga
                  ON ga.goal_id = g.id
                 AND ga.user_id = g.user_id
                 AND ga.asset_id = ?
                 AND ga.amount > 0
                WHERE g.user_id = ?
                  AND g.status IN ('ACTIVE', 'FUNDED')
                ORDER BY CASE g.status WHEN 'FUNDED' THEN 0 ELSE 1 END,
                         g.name
                """,
                (rs, rowNum) -> new SpendableGoalResponse(
                        rs.getLong("id"),
                        rs.getString("name"),
                        GoalStatus.valueOf(rs.getString("status")),
                        rs.getString("color"),
                        rs.getString("image_url"),
                        rs.getBigDecimal("target_amount"),
                        rs.getBigDecimal("current_amount"),
                        rs.getBigDecimal("total_reserved"),
                        rs.getBigDecimal("reserved_on_asset"),
                        rs.getBigDecimal("spent_amount")
                ),
                assetId,
                user.getId()
        );
    }

    /**
     * Converts a fragment of an existing goal reservation into real spending.
     * This does NOT touch the asset value. TransactionService subsequently calls
     * MoneyLedgerService.recordExpense(), which performs the physical debit.
     * Because the reservation is reduced first, exactly that amount becomes
     * available to the expense without allowing unrelated reserved money to leak.
     */
    public void consumeReservation(
            Long goalId,
            Long transactionId,
            Long assetId,
            BigDecimal amount,
            User user
    ) {
        ensurePositive(amount);
        Long uid = user.getId();

        GoalRow goal = requireGoal(goalId, uid);
        if (goal.status() == GoalStatus.COMPLETED) {
            throw new IllegalArgumentException("Nie można księgować wydatku do zakończonego celu.");
        }

        AllocationRow allocation = requireAllocation(goalId, assetId, uid);
        if (amount.compareTo(allocation.amount()) > 0) {
            throw new IllegalArgumentException(
                    "Na tym aktywie cel ma zarezerwowane tylko "
                            + allocation.amount().stripTrailingZeros().toPlainString()
                            + " zł."
            );
        }

        jdbc.update(
                "UPDATE goal_allocations SET amount=amount-?,updated_at=NOW() WHERE id=?",
                amount,
                allocation.id()
        );
        jdbc.update("DELETE FROM goal_allocations WHERE id=? AND amount=0", allocation.id());

        jdbc.update(
                """
                INSERT INTO goal_spendings(
                    user_id,
                    goal_id,
                    transaction_id,
                    asset_id,
                    asset_name_snapshot,
                    amount
                ) VALUES(?,?,?,?,?,?)
                """,
                uid,
                goalId,
                transactionId,
                assetId,
                allocation.assetName(),
                amount
        );

        recomputeGoal(goalId, uid);
    }

    /**
     * Restores the goal reservation when an expense is deleted or edited.
     * TransactionService first reverses the expense in the ledger, so the asset
     * physically contains the money again before it becomes reserved again.
     */
    public void reverseSpending(Long transactionId, User user) {
        Long uid = user.getId();
        List<SpendingRow> rows = jdbc.query(
                """
                SELECT id,goal_id,asset_id,asset_name_snapshot,amount
                FROM goal_spendings
                WHERE user_id=? AND transaction_id=?
                """,
                (rs, n) -> new SpendingRow(
                        rs.getLong("id"),
                        rs.getLong("goal_id"),
                        (Long) rs.getObject("asset_id"),
                        rs.getString("asset_name_snapshot"),
                        rs.getBigDecimal("amount")
                ),
                uid,
                transactionId
        );

        if (rows.isEmpty()) {
            return;
        }

        SpendingRow spending = rows.getFirst();
        GoalRow goal = requireGoal(spending.goalId(), uid);

        if (goal.status() == GoalStatus.COMPLETED) {
            throw new IllegalArgumentException(
                    "Nie można cofnąć wydatku przypisanego do zakończonego celu."
            );
        }

        Long assetId = spending.assetId();
        if (assetId == null || !assetExists(assetId, uid)) {
            assetId = systemCashId(uid);
        }

        upsertAllocation(
                spending.goalId(),
                assetId,
                assetName(assetId, uid, spending.assetName()),
                spending.amount(),
                uid
        );

        jdbc.update("DELETE FROM goal_spendings WHERE id=?", spending.id());
        recomputeGoal(spending.goalId(), uid);
    }

    public GoalCompletionResponse completeGoal(
            Long goalId,
            GoalCompletionRequest request,
            User user
    ) {
        Long uid = user.getId();
        GoalRow goal = requireGoal(goalId, uid);

        if (goal.status() == GoalStatus.COMPLETED) {
            throw new IllegalArgumentException("Cel jest już zakończony.");
        }
        if (goal.currentAmount().signum() <= 0) {
            throw new IllegalArgumentException("Nie można zakończyć celu bez żadnego postępu.");
        }

        List<AllocationRow> allocations = allocations(goalId, uid);
        BigDecimal reserved = allocations.stream()
                .map(AllocationRow::amount)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal spent = spentAmount(goalId, uid);

        BigDecimal released = ZERO;
        BigDecimal transferred = ZERO;
        Long targetGoalId = null;

        if (request.mode() == GoalCompletionMode.TRANSFER_TO_GOAL) {
            if (request.targetGoalId() == null) {
                throw new IllegalArgumentException("Wybierz cel, do którego przenieść pozostałe środki.");
            }
            if (request.targetGoalId().equals(goalId)) {
                throw new IllegalArgumentException("Nie można przenieść środków do tego samego celu.");
            }

            GoalRow target = requireGoal(request.targetGoalId(), uid);
            if (target.status() == GoalStatus.COMPLETED) {
                throw new IllegalArgumentException("Nie można przenieść środków do zakończonego celu.");
            }

            BigDecimal targetRemaining = target.targetAmount()
                    .subtract(target.currentAmount())
                    .max(ZERO);

            if (reserved.compareTo(targetRemaining) > 0) {
                throw new IllegalArgumentException(
                        "Cel docelowy ma za mało wolnego limitu. Pozostała rezerwa: "
                                + reserved.stripTrailingZeros().toPlainString()
                                + " zł, wolny limit celu: "
                                + targetRemaining.stripTrailingZeros().toPlainString()
                                + " zł."
                );
            }

            for (AllocationRow allocation : allocations) {
                if (allocation.assetId() == null) {
                    throw new IllegalArgumentException(
                            "Pozostały kapitał Legacy / nieprzypisany nie może zostać automatycznie przeniesiony. Najpierw przypisz go do aktywa."
                    );
                }
                upsertAllocation(
                        target.id(),
                        allocation.assetId(),
                        allocation.assetName(),
                        allocation.amount(),
                        uid
                );
            }

            jdbc.update("DELETE FROM goal_allocations WHERE user_id=? AND goal_id=?", uid, goalId);
            recomputeGoal(target.id(), uid);
            transferred = reserved;
            targetGoalId = target.id();
        } else {
            jdbc.update("DELETE FROM goal_allocations WHERE user_id=? AND goal_id=?", uid, goalId);
            released = reserved;
        }

        Instant completedAt = Instant.now();
        SqlParameterValue completedAtParameter = new SqlParameterValue(
                Types.TIMESTAMP_WITH_TIMEZONE,
                completedAt.atOffset(java.time.ZoneOffset.UTC)
        );

        jdbc.update(
                "UPDATE goals SET status='COMPLETED',completed_at=? WHERE id=? AND user_id=?",
                completedAtParameter,
                goalId,
                uid
        );

        jdbc.update(
                """
                INSERT INTO goal_completion_events(
                    user_id,goal_id,mode,target_goal_id,released_amount,transferred_amount,completed_at
                ) VALUES(?,?,?,?,?,?,?)
                ON CONFLICT(goal_id) DO UPDATE SET
                    mode=EXCLUDED.mode,
                    target_goal_id=EXCLUDED.target_goal_id,
                    released_amount=EXCLUDED.released_amount,
                    transferred_amount=EXCLUDED.transferred_amount,
                    completed_at=EXCLUDED.completed_at
                """,
                uid,
                goalId,
                request.mode().name(),
                targetGoalId,
                released,
                transferred,
                completedAtParameter
        );

        return new GoalCompletionResponse(
                goalId,
                GoalStatus.COMPLETED,
                spent,
                released,
                transferred,
                targetGoalId,
                completedAt
        );
    }

    public void recomputeGoal(Long goalId, Long uid) {
        GoalRow goal = requireGoal(goalId, uid);
        if (goal.status() == GoalStatus.COMPLETED) {
            return;
        }

        BigDecimal reserved = reservedAmount(goalId, uid);
        BigDecimal spent = spentAmount(goalId, uid);
        BigDecimal covered = reserved.add(spent);
        GoalStatus next = covered.compareTo(goal.targetAmount()) >= 0
                ? GoalStatus.FUNDED
                : GoalStatus.ACTIVE;

        jdbc.update(
                "UPDATE goals SET current_amount=?,status=?,completed_at=NULL WHERE id=? AND user_id=?",
                covered,
                next.name(),
                goalId,
                uid
        );
    }

    private void upsertAllocation(
            Long goalId,
            Long assetId,
            String assetName,
            BigDecimal amount,
            Long uid
    ) {
        int updated = jdbc.update(
                """
                UPDATE goal_allocations
                SET amount=amount+?,asset_name_snapshot=?,updated_at=NOW()
                WHERE user_id=? AND goal_id=? AND asset_id=?
                """,
                amount,
                assetName,
                uid,
                goalId,
                assetId
        );

        if (updated == 0) {
            jdbc.update(
                    """
                    INSERT INTO goal_allocations(user_id,goal_id,asset_id,asset_name_snapshot,amount)
                    VALUES(?,?,?,?,?)
                    """,
                    uid,
                    goalId,
                    assetId,
                    assetName,
                    amount
            );
        }
    }

    private List<AllocationRow> allocations(Long goalId, Long uid) {
        return jdbc.query(
                """
                SELECT id,asset_id,asset_name_snapshot,amount
                FROM goal_allocations
                WHERE user_id=? AND goal_id=? AND amount>0
                ORDER BY id
                """,
                (rs, n) -> new AllocationRow(
                        rs.getLong("id"),
                        (Long) rs.getObject("asset_id"),
                        rs.getString("asset_name_snapshot"),
                        rs.getBigDecimal("amount")
                ),
                uid,
                goalId
        );
    }

    private AllocationRow requireAllocation(Long goalId, Long assetId, Long uid) {
        List<AllocationRow> rows = jdbc.query(
                """
                SELECT id,asset_id,asset_name_snapshot,amount
                FROM goal_allocations
                WHERE user_id=? AND goal_id=? AND asset_id=? AND amount>0
                """,
                (rs, n) -> new AllocationRow(
                        rs.getLong("id"),
                        (Long) rs.getObject("asset_id"),
                        rs.getString("asset_name_snapshot"),
                        rs.getBigDecimal("amount")
                ),
                uid,
                goalId,
                assetId
        );
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Ten cel nie ma środków zarezerwowanych w wybranym aktywie.");
        }
        return rows.getFirst();
    }

    private GoalRow requireGoal(Long goalId, Long uid) {
        List<GoalRow> rows = jdbc.query(
                "SELECT id,target_amount,current_amount,status FROM goals WHERE id=? AND user_id=?",
                (rs, n) -> new GoalRow(
                        rs.getLong("id"),
                        rs.getBigDecimal("target_amount"),
                        rs.getBigDecimal("current_amount"),
                        GoalStatus.valueOf(rs.getString("status"))
                ),
                goalId,
                uid
        );
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Cel nie istnieje lub nie należy do użytkownika.");
        }
        return rows.getFirst();
    }

    private BigDecimal reservedAmount(Long goalId, Long uid) {
        BigDecimal result = jdbc.queryForObject(
                "SELECT COALESCE(SUM(amount),0) FROM goal_allocations WHERE user_id=? AND goal_id=?",
                BigDecimal.class,
                uid,
                goalId
        );
        return result == null ? ZERO : result;
    }

    private BigDecimal spentAmount(Long goalId, Long uid) {
        BigDecimal result = jdbc.queryForObject(
                "SELECT COALESCE(SUM(amount),0) FROM goal_spendings WHERE user_id=? AND goal_id=?",
                BigDecimal.class,
                uid,
                goalId
        );
        return result == null ? ZERO : result;
    }

    private void requireAsset(Long assetId, Long uid) {
        if (assetId == null || !assetExists(assetId, uid)) {
            throw new IllegalArgumentException("Aktywo nie istnieje lub nie należy do użytkownika.");
        }
    }

    private boolean assetExists(Long assetId, Long uid) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM assets WHERE id=? AND user_id=?",
                Integer.class,
                assetId,
                uid
        );
        return count != null && count > 0;
    }

    private Long systemCashId(Long uid) {
        return jdbc.queryForObject(
                "SELECT id FROM assets WHERE user_id=? AND system_cash=TRUE",
                Long.class,
                uid
        );
    }

    private String assetName(Long assetId, Long uid, String fallback) {
        List<String> names = jdbc.query(
                "SELECT name FROM assets WHERE id=? AND user_id=?",
                (rs, n) -> rs.getString(1),
                assetId,
                uid
        );
        return names.isEmpty() ? fallback : names.getFirst();
    }

    private static void ensurePositive(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Kwota musi być większa od zera.");
        }
    }

    private record GoalRow(
            Long id,
            BigDecimal targetAmount,
            BigDecimal currentAmount,
            GoalStatus status
    ) {
    }

    private record AllocationRow(
            Long id,
            Long assetId,
            String assetName,
            BigDecimal amount
    ) {
    }

    private record SpendingRow(
            Long id,
            Long goalId,
            Long assetId,
            String assetName,
            BigDecimal amount
    ) {
    }
}
