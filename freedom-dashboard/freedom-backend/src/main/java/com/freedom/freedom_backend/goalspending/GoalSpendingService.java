package com.freedom.freedom_backend.goalspending;

import com.freedom.freedom_backend.goal.GoalStatus;
import com.freedom.freedom_backend.goalallocation.GoalPortfolioReservationService;
import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameterValue;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Types;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class GoalSpendingService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final JdbcTemplate jdbc;
    private final GoalPortfolioReservationService portfolioReservations;

    public GoalSpendingService(JdbcTemplate jdbc, GoalPortfolioReservationService portfolioReservations) {
        this.jdbc = jdbc;
        this.portfolioReservations = portfolioReservations;
    }

    @Transactional(readOnly = true)
    public List<SpendableGoalResponse> getSpendableGoals(
            Long assetId,
            Long transactionId,
            User user
    ) {
        Long uid = user.getId();
        requireAsset(assetId, uid);

        List<EditedSpendingRow> editedRows = transactionId == null
                ? List.of()
                : jdbc.query(
                        """
                        SELECT goal_id,asset_id,amount
                        FROM goal_spendings
                        WHERE user_id=? AND transaction_id=?
                        """,
                        (rs, rowNum) -> new EditedSpendingRow(
                                rs.getLong("goal_id"),
                                (Long) rs.getObject("asset_id"),
                                rs.getBigDecimal("amount")
                        ),
                        uid, transactionId
                );

        List<GoalSpendableRow> goals;
        if (transactionId != null) {
            // Editing is also a reconciliation workflow. A historical expense may be
            // attached to ANY active/funded goal, even when that goal was funded from
            // another asset or did not have a reservation at the time of the expense.
            goals = jdbc.query(
                    """
                    SELECT id,name,status,color,image_url,target_amount
                    FROM goals
                    WHERE user_id=? AND status IN ('ACTIVE','FUNDED')
                    ORDER BY name
                    """,
                    (rs, rowNum) -> new GoalSpendableRow(
                            rs.getLong("id"),
                            rs.getString("name"),
                            GoalStatus.valueOf(rs.getString("status")),
                            rs.getString("color"),
                            rs.getString("image_url"),
                            rs.getBigDecimal("target_amount")
                    ),
                    uid
            );
        } else {
            Set<Long> goalIds = new LinkedHashSet<>(jdbc.query(
                    """
                    SELECT DISTINCT goal_id
                    FROM goal_allocations
                    WHERE user_id=? AND asset_id=? AND amount>0
                    """,
                    (rs, rowNum) -> rs.getLong("goal_id"),
                    uid, assetId
            ));
            portfolioReservations.reservationsForAsset(assetId, uid)
                    .forEach(row -> goalIds.add(row.goalId()));

            goals = new ArrayList<>();
            for (Long goalId : goalIds) {
                List<GoalSpendableRow> rows = jdbc.query(
                        """
                        SELECT id,name,status,color,image_url,target_amount
                        FROM goals
                        WHERE id=? AND user_id=? AND status IN ('ACTIVE','FUNDED')
                        """,
                        (rs, rowNum) -> new GoalSpendableRow(
                                rs.getLong("id"),
                                rs.getString("name"),
                                GoalStatus.valueOf(rs.getString("status")),
                                rs.getString("color"),
                                rs.getString("image_url"),
                                rs.getBigDecimal("target_amount")
                        ),
                        goalId, uid
                );
                if (!rows.isEmpty()) goals.add(rows.getFirst());
            }
        }

        List<SpendableGoalResponse> result = new ArrayList<>();
        for (GoalSpendableRow goal : goals) {
            Long goalId = goal.id();
            BigDecimal explicitTotal = value(
                    "SELECT COALESCE(SUM(amount),0) FROM goal_allocations WHERE user_id=? AND goal_id=?",
                    uid, goalId);
            BigDecimal explicitOnAsset = jdbc.queryForObject(
                    "SELECT COALESCE(SUM(amount),0) FROM goal_allocations WHERE user_id=? AND goal_id=? AND asset_id=?",
                    BigDecimal.class, uid, goalId, assetId);
            explicitOnAsset = explicitOnAsset == null ? ZERO : explicitOnAsset;

            List<GoalPortfolioReservationService.DynamicAssetReservation> dynamicRows =
                    portfolioReservations.reservationsForGoal(goalId, uid);
            BigDecimal dynamicTotal = dynamicRows.stream()
                    .map(GoalPortfolioReservationService.DynamicAssetReservation::amount)
                    .reduce(ZERO, BigDecimal::add);
            BigDecimal dynamicOnAsset = dynamicRows.stream()
                    .filter(row -> row.assetId().equals(assetId))
                    .map(GoalPortfolioReservationService.DynamicAssetReservation::amount)
                    .reduce(ZERO, BigDecimal::add);

            ReservationRestore restore = transactionId == null
                    ? new ReservationRestore(ZERO, ZERO)
                    : reservationRestoreForEdit(transactionId, goalId, assetId, uid, editedRows);

            BigDecimal actualReserved = explicitTotal.add(dynamicTotal);
            BigDecimal totalReservedForEdit = actualReserved.add(restore.total());
            BigDecimal reservedOnAsset = explicitOnAsset.add(dynamicOnAsset).add(restore.onAsset());

            // Creating a new expense remains strict: the selected source asset must
            // actually contain a reservation for the goal. Editing deliberately lists
            // every live goal so old/imported expenses can be reconciled afterwards.
            if (transactionId == null && reservedOnAsset.signum() <= 0) continue;

            BigDecimal spent = spentAmount(goalId, uid);
            BigDecimal covered = actualReserved.add(spent);
            GoalStatus status = covered.compareTo(goal.targetAmount()) >= 0
                    ? GoalStatus.FUNDED
                    : GoalStatus.ACTIVE;

            result.add(new SpendableGoalResponse(
                    goal.id(),
                    goal.name(),
                    status,
                    goal.color(),
                    goal.imageUrl(),
                    goal.targetAmount(),
                    covered,
                    totalReservedForEdit,
                    reservedOnAsset,
                    spent
            ));
        }

        result.sort(Comparator
                .comparing((SpendableGoalResponse row) -> row.status() == GoalStatus.FUNDED ? 0 : 1)
                .thenComparing(SpendableGoalResponse::name));
        return result;
    }

    @Transactional(readOnly = true)
    public List<SpendableGoalResponse> getSpendableGoals(Long assetId, User user) {
        return getSpendableGoals(assetId, null, user);
    }

    /**
     * Normal "spend from goal" flow used when a new expense is created. The
     * reservation must live on the same asset that physically pays the expense.
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

        List<AllocationRow> explicitRows = jdbc.query(
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
                uid, goalId, assetId
        );
        AllocationRow allocation = explicitRows.isEmpty() ? null : explicitRows.getFirst();
        BigDecimal explicitAvailable = allocation == null ? ZERO : allocation.amount();
        BigDecimal dynamicAvailable = portfolioReservations.reservationsForGoal(goalId, uid).stream()
                .filter(row -> row.assetId().equals(assetId))
                .map(GoalPortfolioReservationService.DynamicAssetReservation::amount)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal available = explicitAvailable.add(dynamicAvailable);
        if (amount.compareTo(available) > 0) {
            throw new IllegalArgumentException(
                    "Na tym aktywie cel ma zarezerwowane tylko "
                            + available.stripTrailingZeros().toPlainString()
                            + " zł."
            );
        }

        jdbc.update("DELETE FROM goal_spending_sources WHERE user_id=? AND transaction_id=?", uid, transactionId);

        BigDecimal explicitUsed = amount.min(explicitAvailable);
        if (allocation != null && explicitUsed.signum() > 0) {
            jdbc.update(
                    "UPDATE goal_allocations SET amount=amount-?,updated_at=NOW() WHERE id=?",
                    explicitUsed,
                    allocation.id()
            );
            jdbc.update("DELETE FROM goal_allocations WHERE id=? AND amount=0", allocation.id());
        }

        String snapshotName = allocation != null ? allocation.assetName() : assetName(assetId, uid, "Aktywo");
        insertGoalSpending(uid, goalId, transactionId, assetId, snapshotName, amount);

        if (explicitUsed.signum() > 0) {
            insertSpendingSource(uid, goalId, transactionId, assetId, snapshotName, "EXPLICIT", explicitUsed);
        }
        BigDecimal dynamicUsed = amount.subtract(explicitUsed);
        if (dynamicUsed.signum() > 0) {
            insertSpendingSource(uid, goalId, transactionId, assetId,
                    assetName(assetId, uid, snapshotName), "PORTFOLIO_DYNAMIC", dynamicUsed);
        }

        recomputeGoal(goalId, uid);
    }

    /**
     * Reconciles an already existing/imported expense with a goal. Unlike a new
     * "spend from goal" transaction, this may consume reservations from other
     * assets. If the goal had no (or not enough) reservation, the uncovered part
     * is still counted as historical spending towards the goal.
     */
    public void consumeReservationForEditedExpense(
            Long goalId,
            Long transactionId,
            Long expenseAssetId,
            BigDecimal amount,
            User user
    ) {
        ensurePositive(amount);
        Long uid = user.getId();
        requireAsset(expenseAssetId, uid);

        GoalRow goal = requireGoal(goalId, uid);
        if (goal.status() == GoalStatus.COMPLETED) {
            throw new IllegalArgumentException("Nie można przypisać wydatku do zakończonego celu.");
        }

        // Snapshot dynamic reservations BEFORE explicit allocations are reduced.
        // Otherwise freeing an explicit allocation could artificially increase the
        // dynamic portfolio reservation during this same reconciliation.
        List<GoalPortfolioReservationService.DynamicAssetReservation> dynamicRows =
                new ArrayList<>(portfolioReservations.reservationsForGoal(goalId, uid));
        dynamicRows.sort(Comparator
                .comparing((GoalPortfolioReservationService.DynamicAssetReservation row) ->
                        row.assetId().equals(expenseAssetId) ? 0 : 1)
                .thenComparing(GoalPortfolioReservationService.DynamicAssetReservation::assetId));

        List<AllocationRow> explicitRows = jdbc.query(
                """
                SELECT id,asset_id,asset_name_snapshot,amount
                FROM goal_allocations
                WHERE user_id=? AND goal_id=? AND amount>0
                ORDER BY CASE WHEN asset_id=? THEN 0 ELSE 1 END, id
                """,
                (rs, n) -> new AllocationRow(
                        rs.getLong("id"),
                        (Long) rs.getObject("asset_id"),
                        rs.getString("asset_name_snapshot"),
                        rs.getBigDecimal("amount")
                ),
                uid, goalId, expenseAssetId
        );

        jdbc.update("DELETE FROM goal_spending_sources WHERE user_id=? AND transaction_id=?", uid, transactionId);

        BigDecimal remaining = amount;
        List<SpendingSourceDraft> sources = new ArrayList<>();

        for (AllocationRow row : explicitRows) {
            if (remaining.signum() <= 0) break;
            BigDecimal used = remaining.min(row.amount());
            if (used.signum() <= 0) continue;

            jdbc.update(
                    "UPDATE goal_allocations SET amount=amount-?,updated_at=NOW() WHERE id=?",
                    used,
                    row.id()
            );
            jdbc.update("DELETE FROM goal_allocations WHERE id=? AND amount=0", row.id());
            sources.add(new SpendingSourceDraft(
                    row.assetId(), row.assetName(), "EXPLICIT", used
            ));
            remaining = remaining.subtract(used);
        }

        for (GoalPortfolioReservationService.DynamicAssetReservation row : dynamicRows) {
            if (remaining.signum() <= 0) break;
            BigDecimal used = remaining.min(row.amount());
            if (used.signum() <= 0) continue;
            sources.add(new SpendingSourceDraft(
                    row.assetId(), row.assetName(), "PORTFOLIO_DYNAMIC", used
            ));
            remaining = remaining.subtract(used);
        }

        // The spending row describes the real expense; source breakdown rows only
        // describe which goal reservations were released to reconcile it.
        insertGoalSpending(
                uid,
                goalId,
                transactionId,
                expenseAssetId,
                assetName(expenseAssetId, uid, "Aktywo"),
                amount
        );
        for (SpendingSourceDraft source : sources) {
            insertSpendingSource(
                    uid,
                    goalId,
                    transactionId,
                    source.assetId(),
                    source.assetName(),
                    source.sourceType(),
                    source.amount()
            );
        }
        if (remaining.signum() > 0) {
            insertSpendingSource(
                    uid,
                    goalId,
                    transactionId,
                    expenseAssetId,
                    assetName(expenseAssetId, uid, "Aktywo"),
                    "HISTORICAL_UNFUNDED",
                    remaining
            );
        }

        recomputeGoal(goalId, uid);
    }

    /**
     * Restores the goal reservation when an expense is deleted or edited.
     * For newer reconciled expenses the exact source split is restored. Legacy
     * rows fall back to the old single-asset behavior.
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

        if (rows.isEmpty()) return;

        SpendingRow spending = rows.getFirst();
        GoalRow goal = requireGoal(spending.goalId(), uid);
        if (goal.status() == GoalStatus.COMPLETED) {
            throw new IllegalArgumentException(
                    "Nie można cofnąć wydatku przypisanego do zakończonego celu."
            );
        }

        List<SpendingSourceRow> sources = jdbc.query(
                """
                SELECT asset_id,asset_name_snapshot,source_type,amount
                FROM goal_spending_sources
                WHERE user_id=? AND transaction_id=? AND goal_id=?
                ORDER BY id
                """,
                (rs, n) -> new SpendingSourceRow(
                        (Long) rs.getObject("asset_id"),
                        rs.getString("asset_name_snapshot"),
                        rs.getString("source_type"),
                        rs.getBigDecimal("amount")
                ),
                uid, transactionId, spending.goalId()
        );

        if (sources.isEmpty()) {
            // Legacy spending created before V57: reservation source and expense
            // source were the same asset.
            Long assetId = spending.assetId();
            if (assetId == null || !assetExists(assetId, uid)) {
                assetId = systemCashId(uid);
            }
            if (!portfolioReservations.isAssetInsideGoalPortfolio(spending.goalId(), assetId, uid)) {
                upsertAllocation(
                        spending.goalId(),
                        assetId,
                        assetName(assetId, uid, spending.assetName()),
                        spending.amount(),
                        uid
                );
            }
        } else {
            for (SpendingSourceRow source : sources) {
                if ("HISTORICAL_UNFUNDED".equals(source.sourceType())) {
                    // This part never consumed a reservation, so there is nothing
                    // to restore when the historical link is removed.
                    continue;
                }

                Long sourceAssetId = source.assetId();
                if (sourceAssetId == null || !assetExists(sourceAssetId, uid)) {
                    sourceAssetId = systemCashId(uid);
                }

                if ("PORTFOLIO_DYNAMIC".equals(source.sourceType())
                        && portfolioReservations.isAssetInsideGoalPortfolio(
                                spending.goalId(), sourceAssetId, uid)) {
                    // Deleting the spending row below automatically grows the
                    // dynamic reservation again, so no explicit allocation is needed.
                    continue;
                }

                upsertAllocation(
                        spending.goalId(),
                        sourceAssetId,
                        assetName(sourceAssetId, uid, source.assetName()),
                        source.amount(),
                        uid
                );
            }
        }

        jdbc.update("DELETE FROM goal_spending_sources WHERE user_id=? AND transaction_id=?", uid, transactionId);
        jdbc.update("DELETE FROM goal_spendings WHERE user_id=? AND transaction_id=?", uid, transactionId);
        recomputeGoal(spending.goalId(), uid);
    }

    private ReservationRestore reservationRestoreForEdit(
            Long transactionId,
            Long goalId,
            Long assetId,
            Long uid,
            List<EditedSpendingRow> editedRows
    ) {
        List<SpendingSourceRow> sources = jdbc.query(
                """
                SELECT asset_id,asset_name_snapshot,source_type,amount
                FROM goal_spending_sources
                WHERE user_id=? AND transaction_id=? AND goal_id=?
                ORDER BY id
                """,
                (rs, n) -> new SpendingSourceRow(
                        (Long) rs.getObject("asset_id"),
                        rs.getString("asset_name_snapshot"),
                        rs.getString("source_type"),
                        rs.getBigDecimal("amount")
                ),
                uid, transactionId, goalId
        );
        if (!sources.isEmpty()) {
            BigDecimal total = sources.stream()
                    .filter(row -> !"HISTORICAL_UNFUNDED".equals(row.sourceType()))
                    .map(SpendingSourceRow::amount)
                    .reduce(ZERO, BigDecimal::add);
            BigDecimal onAsset = sources.stream()
                    .filter(row -> !"HISTORICAL_UNFUNDED".equals(row.sourceType()))
                    .filter(row -> row.assetId() != null && row.assetId().equals(assetId))
                    .map(SpendingSourceRow::amount)
                    .reduce(ZERO, BigDecimal::add);
            return new ReservationRestore(total, onAsset);
        }

        // Legacy goal spending had no source breakdown. In that model the whole
        // spending amount came from the transaction asset reservation.
        BigDecimal total = editedRows.stream()
                .filter(row -> row.goalId().equals(goalId))
                .map(EditedSpendingRow::amount)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal onAsset = editedRows.stream()
                .filter(row -> row.goalId().equals(goalId))
                .filter(row -> row.assetId() != null && row.assetId().equals(assetId))
                .map(EditedSpendingRow::amount)
                .reduce(ZERO, BigDecimal::add);
        return new ReservationRestore(total, onAsset);
    }

    private void insertGoalSpending(
            Long uid,
            Long goalId,
            Long transactionId,
            Long assetId,
            String assetName,
            BigDecimal amount
    ) {
        jdbc.update(
                """
                INSERT INTO goal_spendings(
                    user_id,goal_id,transaction_id,asset_id,asset_name_snapshot,amount
                ) VALUES(?,?,?,?,?,?)
                """,
                uid, goalId, transactionId, assetId, assetName, amount
        );
    }

    private void insertSpendingSource(
            Long uid,
            Long goalId,
            Long transactionId,
            Long assetId,
            String assetName,
            String sourceType,
            BigDecimal amount
    ) {
        if (amount == null || amount.signum() <= 0) return;
        jdbc.update(
                """
                INSERT INTO goal_spending_sources(
                    user_id,transaction_id,goal_id,asset_id,asset_name_snapshot,source_type,amount
                ) VALUES(?,?,?,?,?,?,?)
                """,
                uid, transactionId, goalId, assetId, assetName, sourceType, amount
        );
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
        BigDecimal dynamicReserved = portfolioReservations.reservedForGoal(goalId, uid);
        if (request.mode() == GoalCompletionMode.TRANSFER_TO_GOAL && dynamicReserved.signum() > 0) {
            throw new IllegalArgumentException(
                    "Cel ma dynamicznie przypisany cały portfel. Zakończ go z uwolnieniem rezerwy albo najpierw odłącz portfel."
            );
        }
        BigDecimal spent = spentAmount(goalId, uid);

        BigDecimal released = ZERO;
        BigDecimal transferred = ZERO;
        Long targetGoalId = null;

        jdbc.update("DELETE FROM goal_completion_allocation_snapshots WHERE user_id=? AND goal_id=?", uid, goalId);
        jdbc.update("DELETE FROM goal_completion_portfolio_snapshots WHERE user_id=? AND goal_id=?", uid, goalId);
        var dynamicLink = portfolioReservations.linkForGoal(goalId, uid);
        if (dynamicLink.isPresent()) {
            var link = dynamicLink.get();
            jdbc.update(
                    """
                    INSERT INTO goal_completion_portfolio_snapshots(
                        user_id,goal_id,portfolio_id,portfolio_name_snapshot
                    ) VALUES(?,?,?,?)
                    """,
                    uid, goalId, link.portfolioId(), link.portfolioName()
            );
        }
        for (AllocationRow allocation : allocations) {
            jdbc.update(
                    """
                    INSERT INTO goal_completion_allocation_snapshots(
                        user_id,goal_id,asset_id,asset_name_snapshot,amount
                    ) VALUES(?,?,?,?,?)
                    """,
                    uid,
                    goalId,
                    allocation.assetId(),
                    allocation.assetName(),
                    allocation.amount()
            );
        }

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

        jdbc.update("DELETE FROM goal_portfolio_allocations WHERE user_id=? AND goal_id=?", uid, goalId);

        Instant completedAt = Instant.now();
        SqlParameterValue completedAtParameter = new SqlParameterValue(
                Types.TIMESTAMP_WITH_TIMEZONE,
                completedAt.atOffset(java.time.ZoneOffset.UTC)
        );

        jdbc.update(
                "UPDATE goals SET current_amount=?,status='COMPLETED',completed_at=? WHERE id=? AND user_id=?",
                goal.currentAmount(),
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

    public void undoCompletion(Long goalId, User user) {
        Long uid = user.getId();
        GoalRow goal = requireGoal(goalId, uid);

        if (goal.status() != GoalStatus.COMPLETED) {
            throw new IllegalArgumentException("Tylko zakończony cel można przywrócić.");
        }

        List<CompletionEventRow> events = jdbc.query(
                """
                SELECT mode,target_goal_id,released_amount,transferred_amount
                FROM goal_completion_events
                WHERE user_id=? AND goal_id=?
                """,
                (rs, n) -> new CompletionEventRow(
                        GoalCompletionMode.valueOf(rs.getString("mode")),
                        (Long) rs.getObject("target_goal_id"),
                        rs.getBigDecimal("released_amount"),
                        rs.getBigDecimal("transferred_amount")
                ),
                uid,
                goalId
        );

        if (events.isEmpty()) {
            throw new IllegalArgumentException("Brak danych potrzebnych do cofnięcia zakończenia tego celu.");
        }

        CompletionEventRow event = events.getFirst();
        List<CompletionPortfolioRow> portfolioSnapshots = jdbc.query(
                """
                SELECT portfolio_id,portfolio_name_snapshot
                FROM goal_completion_portfolio_snapshots
                WHERE user_id=? AND goal_id=?
                """,
                (rs, n) -> new CompletionPortfolioRow(
                        (Long) rs.getObject("portfolio_id"),
                        rs.getString("portfolio_name_snapshot")
                ),
                uid, goalId
        );
        CompletionPortfolioRow portfolioSnapshot = portfolioSnapshots.isEmpty() ? null : portfolioSnapshots.getFirst();
        if (portfolioSnapshot != null) {
            if (portfolioSnapshot.portfolioId() == null) {
                throw new IllegalArgumentException(
                        "Nie można cofnąć zakończenia, ponieważ wcześniej przypisany portfel „"
                                + portfolioSnapshot.portfolioName() + "” został usunięty."
                );
            }
            Integer goalConflict = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM goal_portfolio_allocations WHERE user_id=? AND portfolio_id=?",
                    Integer.class, uid, portfolioSnapshot.portfolioId());
            Integer liabilityConflict = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM liability_portfolio_allocations WHERE user_id=? AND portfolio_id=?",
                    Integer.class, uid, portfolioSnapshot.portfolioId());
            if ((goalConflict != null && goalConflict > 0) || (liabilityConflict != null && liabilityConflict > 0)) {
                throw new IllegalArgumentException(
                        "Nie można cofnąć zakończenia, bo wcześniej przypisany portfel jest już używany przez inny cel lub zobowiązanie."
                );
            }
        }

        List<CompletionAllocationRow> snapshots = jdbc.query(
                """
                SELECT asset_id,asset_name_snapshot,amount
                FROM goal_completion_allocation_snapshots
                WHERE user_id=? AND goal_id=?
                ORDER BY id
                """,
                (rs, n) -> new CompletionAllocationRow(
                        (Long) rs.getObject("asset_id"),
                        rs.getString("asset_name_snapshot"),
                        rs.getBigDecimal("amount")
                ),
                uid,
                goalId
        );

        BigDecimal amountToRestore = event.releasedAmount().add(event.transferredAmount());
        if (snapshots.isEmpty() && amountToRestore.signum() > 0) {
            if (event.mode() == GoalCompletionMode.RELEASE) {
                Long cashId = systemCashId(uid);
                snapshots = List.of(new CompletionAllocationRow(
                        cashId,
                        assetName(cashId, uid, "Gotówka systemowa"),
                        event.releasedAmount()
                ));
            } else {
                throw new IllegalArgumentException(
                        "Tego starszego transferu nie można bezpiecznie cofnąć, bo nie zapisano struktury aktywów."
                );
            }
        }

        if (event.mode() == GoalCompletionMode.TRANSFER_TO_GOAL && event.transferredAmount().signum() > 0) {
            if (event.targetGoalId() == null) {
                throw new IllegalArgumentException("Brak celu docelowego poprzedniego transferu.");
            }

            GoalRow target = requireGoal(event.targetGoalId(), uid);
            if (target.status() == GoalStatus.COMPLETED) {
                throw new IllegalArgumentException(
                        "Nie można cofnąć zakończenia, ponieważ cel docelowy transferu został już zakończony."
                );
            }

            for (CompletionAllocationRow snapshot : snapshots) {
                if (snapshot.assetId() == null) {
                    throw new IllegalArgumentException("Nie można odwrócić transferu środków Legacy / nieprzypisanych.");
                }
                AllocationRow targetAllocation = requireAllocation(target.id(), snapshot.assetId(), uid);
                if (targetAllocation.amount().compareTo(snapshot.amount()) < 0) {
                    throw new IllegalArgumentException(
                            "Nie można cofnąć zakończenia, bo część przeniesionych środków została już wykorzystana w celu docelowym."
                    );
                }
            }

            for (CompletionAllocationRow snapshot : snapshots) {
                jdbc.update(
                        "UPDATE goal_allocations SET amount=amount-?,updated_at=NOW() WHERE user_id=? AND goal_id=? AND asset_id=?",
                        snapshot.amount(),
                        uid,
                        target.id(),
                        snapshot.assetId()
                );
                jdbc.update(
                        "DELETE FROM goal_allocations WHERE user_id=? AND goal_id=? AND asset_id=? AND amount=0",
                        uid,
                        target.id(),
                        snapshot.assetId()
                );
            }
            recomputeGoal(target.id(), uid);
        }

        for (CompletionAllocationRow snapshot : snapshots) {
            restoreAllocation(goalId, snapshot, uid);
        }

        jdbc.update(
                "UPDATE goals SET status='ACTIVE',completed_at=NULL WHERE id=? AND user_id=?",
                goalId,
                uid
        );
        if (portfolioSnapshot != null && portfolioSnapshot.portfolioId() != null) {
            jdbc.update(
                    "INSERT INTO goal_portfolio_allocations(user_id,goal_id,portfolio_id) VALUES(?,?,?)",
                    uid, goalId, portfolioSnapshot.portfolioId()
            );
        }
        recomputeGoal(goalId, uid);

        jdbc.update("DELETE FROM goal_completion_events WHERE user_id=? AND goal_id=?", uid, goalId);
        jdbc.update("DELETE FROM goal_completion_allocation_snapshots WHERE user_id=? AND goal_id=?", uid, goalId);
        jdbc.update("DELETE FROM goal_completion_portfolio_snapshots WHERE user_id=? AND goal_id=?", uid, goalId);
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

    private void restoreAllocation(Long goalId, CompletionAllocationRow snapshot, Long uid) {
        if (snapshot.assetId() != null) {
            Long assetId = snapshot.assetId();
            String assetName = assetExists(assetId, uid)
                    ? assetName(assetId, uid, snapshot.assetName())
                    : snapshot.assetName();

            if (assetExists(assetId, uid)) {
                upsertAllocation(goalId, assetId, assetName, snapshot.amount(), uid);
                return;
            }
        }

        jdbc.update(
                """
                INSERT INTO goal_allocations(user_id,goal_id,asset_id,asset_name_snapshot,amount)
                VALUES(?,?,?,?,?)
                """,
                uid,
                goalId,
                null,
                snapshot.assetName(),
                snapshot.amount()
        );
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
        GoalRow row = rows.getFirst();
        if (row.status() == GoalStatus.COMPLETED) return row;
        BigDecimal current = reservedAmount(row.id(), uid).add(spentAmount(row.id(), uid));
        GoalStatus status = current.compareTo(row.targetAmount()) >= 0 ? GoalStatus.FUNDED : GoalStatus.ACTIVE;
        return new GoalRow(row.id(), row.targetAmount(), current, status);
    }

    private BigDecimal reservedAmount(Long goalId, Long uid) {
        BigDecimal result = jdbc.queryForObject(
                "SELECT COALESCE(SUM(amount),0) FROM goal_allocations WHERE user_id=? AND goal_id=?",
                BigDecimal.class,
                uid,
                goalId
        );
        return (result == null ? ZERO : result)
                .add(portfolioReservations.reservedForGoal(goalId, uid));
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

    private BigDecimal value(String sql, Long userId, Long goalId) {
        BigDecimal value = jdbc.queryForObject(sql, BigDecimal.class, userId, goalId);
        return value == null ? ZERO : value;
    }

    private static void ensurePositive(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Kwota musi być większa od zera.");
        }
    }

    private record GoalSpendableRow(
            Long id,
            String name,
            GoalStatus status,
            String color,
            String imageUrl,
            BigDecimal targetAmount
    ) {}

    private record EditedSpendingRow(
            Long goalId,
            Long assetId,
            BigDecimal amount
    ) {}

    private record ReservationRestore(
            BigDecimal total,
            BigDecimal onAsset
    ) {}

    private record SpendingSourceDraft(
            Long assetId,
            String assetName,
            String sourceType,
            BigDecimal amount
    ) {}

    private record SpendingSourceRow(
            Long assetId,
            String assetName,
            String sourceType,
            BigDecimal amount
    ) {}

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

    private record CompletionEventRow(
            GoalCompletionMode mode,
            Long targetGoalId,
            BigDecimal releasedAmount,
            BigDecimal transferredAmount
    ) {
    }

    private record CompletionAllocationRow(
            Long assetId,
            String assetName,
            BigDecimal amount
    ) {
    }

    private record CompletionPortfolioRow(
            Long portfolioId,
            String portfolioName
    ) {}

    private record SpendingRow(
            Long id,
            Long goalId,
            Long assetId,
            String assetName,
            BigDecimal amount
    ) {
    }
}
