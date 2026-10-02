package com.freedom.freedom_backend.ledger;

import com.freedom.freedom_backend.user.User;
import com.freedom.freedom_backend.goalspending.GoalSpendingService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class MoneyLedgerService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private final JdbcTemplate jdbc;
    private final GoalSpendingService goalSpending;

    public MoneyLedgerService(JdbcTemplate jdbc, GoalSpendingService goalSpending) {
        this.jdbc = jdbc;
        this.goalSpending = goalSpending;
    }

    public Long resolveAsset(Long requestedAssetId, User user) {
        if (requestedAssetId != null) {
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM assets WHERE id=? AND user_id=?",
                    Integer.class, requestedAssetId, user.getId());
            if (count != null && count > 0) return requestedAssetId;
            throw new IllegalArgumentException("Wybrane aktywo nie istnieje.");
        }
        Long id = jdbc.queryForObject(
                "SELECT id FROM assets WHERE user_id=? AND system_cash=TRUE",
                Long.class, user.getId());
        if (id == null) throw new IllegalArgumentException("Brak systemowej Gotówki.");
        return id;
    }

    public BigDecimal available(Long assetId, User user) {
        BigDecimal value = assetValue(assetId, user.getId());
        return value.subtract(totalReserved(assetId, user.getId()));
    }

    public BigDecimal reserved(Long assetId, User user) {
        assetValue(assetId, user.getId());
        return totalReserved(assetId, user.getId());
    }

    public void recordIncome(Long transactionId, Long assetId, BigDecimal amount, User user) {
        ensurePositive(amount);
        Long lotId = jdbc.queryForObject(
                "INSERT INTO money_lots(user_id,origin_type,origin_transaction_id,origin_asset_id,original_amount) VALUES(?,'INCOME',?,?,?) RETURNING id",
                Long.class, user.getId(), transactionId, assetId, amount);
        addPosition(user.getId(), lotId, assetId, amount);
        changeAssetValue(assetId, user.getId(), amount);
        movement(user.getId(), lotId, "INCOME", null, assetId, transactionId, amount);
    }

    public void recordExpense(Long transactionId, Long assetId, BigDecimal amount, User user) {
        ensurePositive(amount);
        reconcileAsset(assetId, user.getId());
        if (amount.compareTo(available(assetId, user)) > 0) {
            throw new IllegalArgumentException("Za mało wolnych środków w wybranym aktywie.");
        }
        BigDecimal remaining = amount;
        for (Position row : positions(assetId, user.getId(), null)) {
            if (remaining.signum() == 0) break;
            BigDecimal used = row.amount().min(remaining);
            subtractPosition(row.id(), used);
            jdbc.update("INSERT INTO transaction_lot_usages(user_id,transaction_id,lot_id,asset_id,amount) VALUES(?,?,?,?,?)",
                    user.getId(), transactionId, row.lotId(), assetId, used);
            movement(user.getId(), row.lotId(), "EXPENSE", assetId, null, transactionId, used);
            remaining = remaining.subtract(used);
        }
        if (remaining.signum() != 0) throw new IllegalStateException("Ledger nie pokrywa salda aktywa.");
        changeAssetValue(assetId, user.getId(), amount.negate());
    }

    public void recordExpenseFromImportSource(Long transactionId, Long assetId, BigDecimal amount,
                                              User user, String importSource) {
        ensurePositive(amount);
        reconcileAsset(assetId, user.getId());
        if (amount.compareTo(available(assetId, user)) > 0) {
            throw new IllegalArgumentException("Za mało wolnych środków w wybranym aktywie.");
        }

        List<Position> sourcePositions = importedSourcePositions(assetId, user.getId(), importSource);
        BigDecimal sourceAvailable = sourcePositions.stream()
                .map(Position::amount)
                .reduce(ZERO, BigDecimal::add);
        if (amount.compareTo(sourceAvailable) > 0) {
            throw new IllegalArgumentException(
                    "Backup zawiera więcej nowych wydatków niż dostępnych środków pochodzących z wcześniejszych i nowych importów Finanse."
            );
        }

        BigDecimal remaining = amount;
        for (Position row : sourcePositions) {
            if (remaining.signum() == 0) break;
            BigDecimal used = row.amount().min(remaining);
            subtractPosition(row.id(), used);
            jdbc.update("INSERT INTO transaction_lot_usages(user_id,transaction_id,lot_id,asset_id,amount) VALUES(?,?,?,?,?)",
                    user.getId(), transactionId, row.lotId(), assetId, used);
            movement(user.getId(), row.lotId(), "EXPENSE", assetId, null, transactionId, used);
            remaining = remaining.subtract(used);
        }
        if (remaining.signum() != 0) throw new IllegalStateException("Ledger importu nie pokrywa wydatku.");
        changeAssetValue(assetId, user.getId(), amount.negate());
    }

    public void reverseExpense(Long transactionId, Long fallbackAssetId, BigDecimal amount, User user) {
        List<Usage> usages = jdbc.query(
                "SELECT lot_id,asset_id,amount FROM transaction_lot_usages WHERE user_id=? AND transaction_id=? ORDER BY id",
                (rs, n) -> new Usage(rs.getLong("lot_id"), (Long) rs.getObject("asset_id"), rs.getBigDecimal("amount")),
                user.getId(), transactionId);
        if (usages.isEmpty()) {
            Long assetId = fallbackAssetId != null ? fallbackAssetId : resolveAsset(null, user);
            creditAdjustment(assetId, amount, user.getId(), "LEGACY_EXPENSE_REVERSAL", transactionId);
            return;
        }
        for (Usage usage : usages) {
            Long assetId = usage.assetId() != null ? usage.assetId() : fallbackAssetId;
            if (assetId == null) assetId = resolveAsset(null, user);
            addPosition(user.getId(), usage.lotId(), assetId, usage.amount());
            changeAssetValue(assetId, user.getId(), usage.amount());
            movement(user.getId(), usage.lotId(), "EXPENSE_REVERSAL", null, assetId, transactionId, usage.amount());
        }
        jdbc.update("DELETE FROM transaction_lot_usages WHERE user_id=? AND transaction_id=?", user.getId(), transactionId);
    }

    /**
     * Reverses an income. If money from this income has already been spent, the
     * existing expense is re-sourced from other free capital where possible.
     * If there is not enough other capital, dependent expenses are reversed and
     * deleted so no asset can become negative.
     */
    public List<Long> reverseIncome(Long transactionId, Long fallbackAssetId, BigDecimal amount, User user) {
        Long uid = user.getId();
        List<Long> lots = jdbc.query(
                "SELECT id FROM money_lots WHERE user_id=? AND origin_transaction_id=? AND origin_type='INCOME' ORDER BY id",
                (rs, n) -> rs.getLong(1), uid, transactionId);

        if (lots.isEmpty()) {
            withdrawLegacy(amount, uid);
            return List.of();
        }

        BigDecimal current = sumPositions(lots, uid);
        BigDecimal spent = amount.subtract(current).max(ZERO);
        List<Long> cascaded = new ArrayList<>();

        if (spent.signum() > 0) {
            BigDecimal otherFree = totalFreeExcludingLots(uid, lots);
            if (otherFree.compareTo(spent) >= 0) {
                resourceExpenseUsagesAwayFromLots(uid, lots, transactionId);
            } else {
                List<Long> dependentExpenses = dependentExpenseIds(uid, lots);
                for (Long expenseId : dependentExpenses) {
                    ExpenseRow expense = expenseRow(expenseId, uid);
                    reverseExpense(expense.id(), expense.assetId(), expense.amount(), user);
                    goalSpending.reverseSpending(expense.id(), user);
                    jdbc.update("DELETE FROM transactions WHERE id=? AND user_id=?", expense.id(), uid);
                    cascaded.add(expense.id());
                }

                // A source can also have been consumed by a non-transaction event
                // (for example a completed goal). In that case re-source only the
                // still-missing fragment from other currently free capital.
                BigDecimal restoredSource = sumPositions(lots, uid);
                BigDecimal stillMissing = amount.subtract(restoredSource).max(ZERO);
                if (stillMissing.signum() > 0) {
                    debitAcrossAssets(uid, stillMissing, lots, "INCOME_RESOURCE", transactionId);
                }
            }
        }

        // After optional cascading, every remaining fragment of the income lot is
        // physically removed from whichever assets currently hold it.
        for (Long lotId : lots) {
            List<Position> rows = positionsForLot(lotId, uid);
            for (Position row : rows) {
                if (row.amount().signum() <= 0) continue;
                changeAssetValue(row.assetId(), uid, row.amount().negate());
                movement(uid, lotId, "INCOME_REVERSAL", row.assetId(), null, transactionId, row.amount());
                jdbc.update("DELETE FROM money_positions WHERE id=?", row.id());
                clampReservations(row.assetId(), uid);
            }
        }
        jdbc.update("DELETE FROM money_lots WHERE user_id=? AND origin_transaction_id=? AND origin_type='INCOME'", uid, transactionId);
        return cascaded;
    }

    public void transfer(Long sourceAssetId, Long targetAssetId, BigDecimal amount, User user) {
        ensurePositive(amount);
        Long uid = user.getId();
        reconcileAsset(sourceAssetId, uid);
        reconcileAsset(targetAssetId, uid);
        if (amount.compareTo(available(sourceAssetId, user)) > 0) {
            throw new IllegalArgumentException("Za mało wolnych środków w aktywie źródłowym.");
        }
        BigDecimal remaining = amount;
        for (Position row : positions(sourceAssetId, uid, null)) {
            if (remaining.signum() == 0) break;
            BigDecimal moved = row.amount().min(remaining);
            subtractPosition(row.id(), moved);
            addPosition(uid, row.lotId(), targetAssetId, moved);
            movement(uid, row.lotId(), "TRANSFER", sourceAssetId, targetAssetId, null, moved);
            remaining = remaining.subtract(moved);
        }
        if (remaining.signum() != 0) throw new IllegalStateException("Ledger nie pokrywa salda aktywa źródłowego.");
        changeAssetValue(sourceAssetId, uid, amount.negate());
        changeAssetValue(targetAssetId, uid, amount);
    }

    public void consumeAssetValue(Long assetId, BigDecimal amount, User user, String movementType) {
        ensurePositive(amount);
        reconcileAsset(assetId, user.getId());
        if (amount.compareTo(assetValue(assetId, user.getId())) > 0) {
            throw new IllegalArgumentException("Za mało środków w aktywie.");
        }
        consumePositionsOnly(assetId, amount, user.getId(), movementType, null);
        changeAssetValue(assetId, user.getId(), amount.negate());
    }

    public void recordAssetCreation(Long assetId, BigDecimal amount, User user) {
        if (amount == null || amount.signum() <= 0) return;
        Long lotId = jdbc.queryForObject(
                "INSERT INTO money_lots(user_id,origin_type,origin_asset_id,original_amount) VALUES(?,'ASSET_OPENING_BALANCE',?,?) RETURNING id",
                Long.class, user.getId(), assetId, amount);
        addPosition(user.getId(), lotId, assetId, amount);
        movement(user.getId(), lotId, "ASSET_OPENING_BALANCE", null, assetId, null, amount);
    }

    public void recordValuation(Long assetId, BigDecimal before, BigDecimal after, User user) {
        BigDecimal delta = after.subtract(before);
        if (delta.signum() > 0) {
            Long lotId = jdbc.queryForObject(
                    "INSERT INTO money_lots(user_id,origin_type,origin_asset_id,original_amount) VALUES(?,'MARKET_GAIN',?,?) RETURNING id",
                    Long.class, user.getId(), assetId, delta);
            addPosition(user.getId(), lotId, assetId, delta);
            movement(user.getId(), lotId, "MARKET_GAIN", null, assetId, null, delta);
        } else if (delta.signum() < 0) {
            consumePositionsOnly(assetId, delta.abs(), user.getId(), "MARKET_LOSS", null);
        }
    }

    public void consumeAssetBeforeDelete(Long assetId, User user) {
        reconcileAsset(assetId, user.getId());
        BigDecimal value = assetValue(assetId, user.getId());
        if (value.signum() > 0) consumePositionsOnly(assetId, value, user.getId(), "ASSET_REMOVAL", null);
    }

    private void withdrawLegacy(BigDecimal amount, Long uid) {
        BigDecimal total = jdbc.queryForObject("SELECT COALESCE(SUM(value),0) FROM assets WHERE user_id=?", BigDecimal.class, uid);
        if (total == null || total.compareTo(amount) < 0) {
            throw new IllegalArgumentException("Nie można usunąć starego przychodu: obecny majątek nie pokrywa jego kwoty.");
        }
        debitAcrossAssets(uid, amount, List.of(), "LEGACY_INCOME_REVERSAL", null);
    }

    private void resourceExpenseUsagesAwayFromLots(Long uid, List<Long> sourceLots, Long incomeTransactionId) {
        if (sourceLots.isEmpty()) return;
        String marks = String.join(",", sourceLots.stream().map(x -> "?").toList());
        List<Object> args = new ArrayList<>();
        args.add(uid);
        args.addAll(sourceLots);
        List<UsageRow> usages = jdbc.query(
                "SELECT id,transaction_id,amount FROM transaction_lot_usages WHERE user_id=? AND lot_id IN (" + marks + ") ORDER BY id",
                (rs,n)->new UsageRow(rs.getLong("id"),rs.getLong("transaction_id"),rs.getBigDecimal("amount")),
                args.toArray());

        for (UsageRow usage : usages) {
            BigDecimal remaining = usage.amount();
            List<Long> assetIds = jdbc.query("SELECT id FROM assets WHERE user_id=? ORDER BY system_cash DESC,id", (rs,n)->rs.getLong(1), uid);
            for (Long assetId : assetIds) {
                if (remaining.signum() == 0) break;
                reconcileAsset(assetId, uid);
                BigDecimal allocated = totalReserved(assetId, uid);
                BigDecimal sourceHeldHere = positions(assetId, uid, null).stream()
                        .filter(p -> sourceLots.contains(p.lotId()))
                        .map(Position::amount).reduce(ZERO, BigDecimal::add);
                BigDecimal freeOther = assetValue(assetId, uid)
                        .subtract(allocated == null ? ZERO : allocated)
                        .subtract(sourceHeldHere);
                if (freeOther.signum() <= 0) continue;

                BigDecimal target = freeOther.min(remaining);
                BigDecimal left = target;
                for (Position p : positions(assetId, uid, sourceLots)) {
                    if (left.signum() == 0) break;
                    BigDecimal used = p.amount().min(left);
                    subtractPosition(p.id(), used);
                    changeAssetValue(assetId, uid, used.negate());
                    jdbc.update("INSERT INTO transaction_lot_usages(user_id,transaction_id,lot_id,asset_id,amount) VALUES(?,?,?,?,?)",
                            uid, usage.transactionId(), p.lotId(), assetId, used);
                    movement(uid, p.lotId(), "INCOME_RESOURCE", assetId, null, incomeTransactionId, used);
                    left = left.subtract(used);
                    remaining = remaining.subtract(used);
                }
            }
            if (remaining.signum() != 0) throw new IllegalArgumentException("Brak środków do przepięcia pochodzenia wydatku.");
            jdbc.update("DELETE FROM transaction_lot_usages WHERE id=?", usage.id());
        }
    }

    private void debitAcrossAssets(Long uid, BigDecimal amount, List<Long> excludedLots, String type, Long txId) {
        BigDecimal remaining = amount;
        List<Long> assetIds = jdbc.query("SELECT id FROM assets WHERE user_id=? ORDER BY system_cash DESC,id", (rs,n)->rs.getLong(1), uid);
        for (Long assetId : assetIds) {
            if (remaining.signum() == 0) break;
            reconcileAsset(assetId, uid);
            BigDecimal allocated = totalReserved(assetId, uid);
            BigDecimal free = assetValue(assetId, uid).subtract(allocated == null ? ZERO : allocated);
            if (free.signum() <= 0) continue;
            BigDecimal take = free.min(remaining);
            BigDecimal left = take;
            for (Position p : positions(assetId, uid, excludedLots)) {
                if (left.signum() == 0) break;
                BigDecimal used = p.amount().min(left);
                subtractPosition(p.id(), used);
                movement(uid, p.lotId(), type, assetId, null, txId, used);
                left = left.subtract(used);
            }
            BigDecimal actually = take.subtract(left);
            if (actually.signum() > 0) {
                changeAssetValue(assetId, uid, actually.negate());
                remaining = remaining.subtract(actually);
            }
        }
        if (remaining.signum() != 0) throw new IllegalArgumentException("Brak wystarczających wolnych środków do cofnięcia operacji.");
    }

    private void consumePositionsOnly(Long assetId, BigDecimal amount, Long uid, String movementType, Long txId) {
        reconcileAsset(assetId, uid);
        BigDecimal remaining = amount;
        for (Position row : positions(assetId, uid, null)) {
            if (remaining.signum() == 0) break;
            BigDecimal used = row.amount().min(remaining);
            subtractPosition(row.id(), used);
            movement(uid, row.lotId(), movementType, assetId, null, txId, used);
            remaining = remaining.subtract(used);
        }
        if (remaining.signum() != 0) throw new IllegalStateException("Ledger nie pokrywa salda aktywa.");
    }

    private void creditAdjustment(Long assetId, BigDecimal amount, Long uid, String originType, Long txId) {
        Long lotId = jdbc.queryForObject(
                "INSERT INTO money_lots(user_id,origin_type,origin_transaction_id,origin_asset_id,original_amount) VALUES(?,?,?,?,?) RETURNING id",
                Long.class, uid, originType, txId, assetId, amount);
        addPosition(uid, lotId, assetId, amount);
        changeAssetValue(assetId, uid, amount);
        movement(uid, lotId, originType, null, assetId, txId, amount);
    }

    private void reconcileAsset(Long assetId, Long uid) {
        BigDecimal value = assetValue(assetId, uid);
        BigDecimal tracked = jdbc.queryForObject("SELECT COALESCE(SUM(amount),0) FROM money_positions WHERE user_id=? AND asset_id=?", BigDecimal.class, uid, assetId);
        tracked = tracked == null ? ZERO : tracked;
        BigDecimal diff = value.subtract(tracked);
        if (diff.signum() > 0) {
            Long lotId = jdbc.queryForObject(
                    "INSERT INTO money_lots(user_id,origin_type,origin_asset_id,original_amount) VALUES(?,'RECONCILIATION',?,?) RETURNING id",
                    Long.class, uid, assetId, diff);
            addPosition(uid, lotId, assetId, diff);
        } else if (diff.signum() < 0) {
            BigDecimal remaining = diff.abs();
            for (Position row : positions(assetId, uid, null)) {
                if (remaining.signum() == 0) break;
                BigDecimal used = row.amount().min(remaining);
                subtractPosition(row.id(), used);
                remaining = remaining.subtract(used);
            }
        }
    }

    private List<Position> positions(Long assetId, Long uid, List<Long> excludedLots) {
        String sql = "SELECT id,lot_id,asset_id,amount FROM money_positions WHERE user_id=? AND asset_id=? AND amount>0";
        Object[] args;
        if (excludedLots != null && !excludedLots.isEmpty()) {
            String marks = String.join(",", excludedLots.stream().map(x -> "?").toList());
            sql += " AND lot_id NOT IN (" + marks + ")";
            List<Object> all = new ArrayList<>(); all.add(uid); all.add(assetId); all.addAll(excludedLots); args = all.toArray();
        } else args = new Object[]{uid, assetId};
        sql += " ORDER BY id";
        return jdbc.query(sql, (rs,n)->new Position(rs.getLong("id"),rs.getLong("lot_id"),rs.getLong("asset_id"),rs.getBigDecimal("amount")), args);
    }

    private List<Position> importedSourcePositions(Long assetId, Long uid, String source) {
        return jdbc.query("""
                SELECT p.id,p.lot_id,p.asset_id,p.amount
                FROM money_positions p
                JOIN money_lots l ON l.id=p.lot_id AND l.user_id=p.user_id
                JOIN transaction_import_links il
                  ON il.transaction_id=l.origin_transaction_id
                 AND il.user_id=p.user_id
                 AND il.source=?
                WHERE p.user_id=? AND p.asset_id=? AND p.amount>0
                ORDER BY l.created_at,l.id,p.id
                """,
                (rs,n)->new Position(rs.getLong("id"),rs.getLong("lot_id"),rs.getLong("asset_id"),rs.getBigDecimal("amount")),
                source, uid, assetId);
    }

    private List<Position> positionsForLot(Long lotId, Long uid) {
        return jdbc.query("SELECT id,lot_id,asset_id,amount FROM money_positions WHERE user_id=? AND lot_id=? AND amount>0 ORDER BY id",
                (rs,n)->new Position(rs.getLong("id"),rs.getLong("lot_id"),rs.getLong("asset_id"),rs.getBigDecimal("amount")), uid, lotId);
    }

    private BigDecimal sumPositions(List<Long> lots, Long uid) {
        if (lots.isEmpty()) return ZERO;
        String marks = String.join(",", lots.stream().map(x -> "?").toList());
        List<Object> args = new ArrayList<>(); args.add(uid); args.addAll(lots);
        BigDecimal value = jdbc.queryForObject("SELECT COALESCE(SUM(amount),0) FROM money_positions WHERE user_id=? AND lot_id IN ("+marks+")", BigDecimal.class, args.toArray());
        return value == null ? ZERO : value;
    }

    private BigDecimal totalFreeExcludingLots(Long uid, List<Long> excludedLots) {
        BigDecimal total = ZERO;
        List<Long> assetIds = jdbc.query("SELECT id FROM assets WHERE user_id=?", (rs,n)->rs.getLong(1), uid);
        for (Long assetId : assetIds) {
            reconcileAsset(assetId, uid);
            BigDecimal excluded = ZERO;
            for (Position p : positions(assetId, uid, null)) if (excludedLots.contains(p.lotId())) excluded = excluded.add(p.amount());
            BigDecimal allocated = totalReserved(assetId, uid);
            BigDecimal freeOther = assetValue(assetId, uid).subtract(allocated == null ? ZERO : allocated).subtract(excluded);
            if (freeOther.signum() > 0) total = total.add(freeOther);
        }
        return total;
    }

    private List<Long> dependentExpenseIds(Long uid, List<Long> lots) {
        if (lots.isEmpty()) return List.of();
        String marks = String.join(",", lots.stream().map(x -> "?").toList());
        List<Object> args = new ArrayList<>(); args.add(uid); args.addAll(lots);
        return jdbc.query("SELECT DISTINCT transaction_id FROM transaction_lot_usages WHERE user_id=? AND lot_id IN ("+marks+") ORDER BY transaction_id",
                (rs,n)->rs.getLong(1), args.toArray());
    }

    private ExpenseRow expenseRow(Long id, Long uid) {
        return jdbc.query("SELECT id,asset_id,amount FROM transactions WHERE id=? AND user_id=? AND type='EXPENSE'",
                rs -> { if (!rs.next()) throw new IllegalStateException("Nie znaleziono zależnego wydatku."); return new ExpenseRow(rs.getLong("id"),(Long)rs.getObject("asset_id"),rs.getBigDecimal("amount")); }, id, uid);
    }

    private void addPosition(Long uid, Long lotId, Long assetId, BigDecimal amount) {
        int updated = jdbc.update("UPDATE money_positions SET amount=amount+?,updated_at=NOW() WHERE user_id=? AND lot_id=? AND asset_id=?",
                amount, uid, lotId, assetId);
        if (updated == 0) jdbc.update("INSERT INTO money_positions(user_id,lot_id,asset_id,amount) VALUES(?,?,?,?)", uid, lotId, assetId, amount);
    }

    private void subtractPosition(Long positionId, BigDecimal amount) {
        int updated = jdbc.update("UPDATE money_positions SET amount=amount-?,updated_at=NOW() WHERE id=? AND amount>=?", amount, positionId, amount);
        if (updated == 0) throw new IllegalStateException("Niespójna pozycja ledgeru.");
        jdbc.update("DELETE FROM money_positions WHERE id=? AND amount=0", positionId);
    }

    private void changeAssetValue(Long assetId, Long uid, BigDecimal delta) {
        int updated = jdbc.update("UPDATE assets SET value=value+? WHERE id=? AND user_id=? AND value+?>=0", delta, assetId, uid, delta);
        if (updated == 0) throw new IllegalArgumentException("Operacja spowodowałaby ujemne saldo aktywa.");
    }

    private BigDecimal assetValue(Long assetId, Long uid) {
        List<BigDecimal> rows = jdbc.query("SELECT value FROM assets WHERE id=? AND user_id=?", (rs,n)->rs.getBigDecimal(1), assetId, uid);
        if (rows.isEmpty()) throw new IllegalArgumentException("Aktywo nie istnieje.");
        return rows.getFirst();
    }

    private BigDecimal totalReserved(Long assetId, Long uid) {
        BigDecimal value = jdbc.queryForObject("""
                SELECT
                    COALESCE((SELECT SUM(amount) FROM goal_allocations WHERE user_id=? AND asset_id=?),0) +
                    COALESCE((SELECT SUM(amount) FROM liability_allocations WHERE user_id=? AND asset_id=?),0)
                """, BigDecimal.class, uid, assetId, uid, assetId);
        return value == null ? ZERO : value;
    }

    public void clampReservationsForAsset(Long assetId, User user) {
        clampReservations(assetId, user.getId());
    }

    private void clampReservations(Long assetId, Long uid) {
        BigDecimal value = assetValue(assetId, uid);
        List<Reservation> reservations = jdbc.query("""
                SELECT kind, id, amount
                FROM (
                    SELECT 'GOAL' AS kind, id, amount, updated_at
                    FROM goal_allocations
                    WHERE user_id=? AND asset_id=? AND amount>0
                    UNION ALL
                    SELECT 'LIABILITY' AS kind, id, amount, updated_at
                    FROM liability_allocations
                    WHERE user_id=? AND asset_id=? AND amount>0
                ) r
                ORDER BY updated_at DESC, id DESC
                """,
                (rs,n)->new Reservation(rs.getString("kind"), rs.getLong("id"), rs.getBigDecimal("amount")),
                uid, assetId, uid, assetId);
        BigDecimal total = reservations.stream().map(Reservation::amount).reduce(ZERO, BigDecimal::add);
        BigDecimal overflow = total.subtract(value);
        if (overflow.signum() <= 0) return;

        for (Reservation reservation : reservations) {
            if (overflow.signum() == 0) break;
            BigDecimal cut = reservation.amount().min(overflow);
            String table = reservation.kind().equals("GOAL") ? "goal_allocations" : "liability_allocations";
            jdbc.update("UPDATE " + table + " SET amount=amount-?,updated_at=NOW() WHERE id=?", cut, reservation.id());
            jdbc.update("DELETE FROM " + table + " WHERE id=? AND amount=0", reservation.id());
            overflow = overflow.subtract(cut);
        }
        jdbc.update("""
                UPDATE goals g
                SET current_amount =
                        COALESCE((SELECT SUM(amount) FROM goal_allocations WHERE user_id=? AND goal_id=g.id),0) +
                        COALESCE((SELECT SUM(amount) FROM goal_spendings WHERE user_id=? AND goal_id=g.id),0),
                    status = CASE
                        WHEN g.status='COMPLETED' THEN g.status
                        WHEN (
                            COALESCE((SELECT SUM(amount) FROM goal_allocations WHERE user_id=? AND goal_id=g.id),0) +
                            COALESCE((SELECT SUM(amount) FROM goal_spendings WHERE user_id=? AND goal_id=g.id),0)
                        ) >= g.target_amount THEN 'FUNDED'
                        ELSE 'ACTIVE'
                    END
                WHERE g.user_id=?
                """, uid, uid, uid, uid, uid);
    }

    private void movement(Long uid, Long lotId, String type, Long source, Long target, Long txId, BigDecimal amount) {
        jdbc.update("INSERT INTO money_movements(user_id,lot_id,movement_type,source_asset_id,target_asset_id,transaction_id,amount) VALUES(?,?,?,?,?,?,?)",
                uid, lotId, type, source, target, txId, amount);
    }

    private static void ensurePositive(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("Kwota musi być większa od zera.");
    }

    private record Position(Long id, Long lotId, Long assetId, BigDecimal amount) {}
    private record Usage(Long lotId, Long assetId, BigDecimal amount) {}
    private record UsageRow(Long id, Long transactionId, BigDecimal amount) {}
    private record ExpenseRow(Long id, Long assetId, BigDecimal amount) {}
    private record Reservation(String kind, Long id, BigDecimal amount) {}
}
