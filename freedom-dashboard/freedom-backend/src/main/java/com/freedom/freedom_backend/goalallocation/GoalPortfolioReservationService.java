package com.freedom.freedom_backend.goalallocation;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class GoalPortfolioReservationService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final int SCALE = 2;

    private final JdbcTemplate jdbc;

    public GoalPortfolioReservationService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public BigDecimal reservedForAsset(Long assetId, Long userId) {
        return reservationsForAsset(assetId, userId).stream()
                .map(DynamicAssetReservation::amount)
                .reduce(ZERO, BigDecimal::add);
    }

    public List<DynamicAssetReservation> reservationsForAsset(Long assetId, Long userId) {
        List<AssetPortfolioRow> assets = jdbc.query("""
                SELECT a.id, a.portfolio_id
                FROM assets a
                WHERE a.id=? AND a.user_id=?
                """,
                (rs, rowNum) -> new AssetPortfolioRow(
                        rs.getLong("id"),
                        (Long) rs.getObject("portfolio_id")
                ),
                assetId, userId
        );
        if (assets.isEmpty() || assets.getFirst().portfolioId() == null) return List.of();

        Optional<PortfolioLink> link = linkForPortfolio(assets.getFirst().portfolioId(), userId);
        if (link.isEmpty()) return List.of();

        return dynamicReservations(link.get()).stream()
                .filter(row -> row.assetId().equals(assetId))
                .toList();
    }

    public BigDecimal reservedForPortfolio(Long portfolioId, Long userId) {
        return linkForPortfolio(portfolioId, userId)
                .map(this::dynamicReservations)
                .orElseGet(List::of)
                .stream()
                .map(DynamicAssetReservation::amount)
                .reduce(ZERO, BigDecimal::add);
    }

    public BigDecimal reservedForGoal(Long goalId, Long userId) {
        return reservationsForGoal(goalId, userId).stream()
                .map(DynamicAssetReservation::amount)
                .reduce(ZERO, BigDecimal::add);
    }

    public List<DynamicAssetReservation> reservationsForGoal(Long goalId, Long userId) {
        return linkForGoal(goalId, userId)
                .map(this::dynamicReservations)
                .orElseGet(List::of);
    }

    public List<DynamicAssetReservation> reservationsForUser(Long userId) {
        List<PortfolioLink> links = jdbc.query("""
                SELECT gpa.id,
                       gpa.user_id,
                       gpa.goal_id,
                       gpa.portfolio_id,
                       p.name AS portfolio_name,
                       g.name AS goal_name,
                       g.target_amount,
                       g.status
                FROM goal_portfolio_allocations gpa
                JOIN portfolios p ON p.id=gpa.portfolio_id AND p.user_id=gpa.user_id
                JOIN goals g ON g.id=gpa.goal_id AND g.user_id=gpa.user_id
                WHERE gpa.user_id=?
                ORDER BY gpa.id
                """,
                (rs, rowNum) -> new PortfolioLink(
                        rs.getLong("id"),
                        rs.getLong("user_id"),
                        rs.getLong("goal_id"),
                        rs.getLong("portfolio_id"),
                        rs.getString("portfolio_name"),
                        rs.getString("goal_name"),
                        rs.getBigDecimal("target_amount"),
                        rs.getString("status")
                ),
                userId
        );

        List<DynamicAssetReservation> result = new ArrayList<>();
        for (PortfolioLink link : links) result.addAll(dynamicReservations(link));
        return result;
    }

    public Optional<PortfolioLink> linkForGoal(Long goalId, Long userId) {
        List<PortfolioLink> rows = jdbc.query("""
                SELECT gpa.id,
                       gpa.user_id,
                       gpa.goal_id,
                       gpa.portfolio_id,
                       p.name AS portfolio_name,
                       g.name AS goal_name,
                       g.target_amount,
                       g.status
                FROM goal_portfolio_allocations gpa
                JOIN portfolios p ON p.id=gpa.portfolio_id AND p.user_id=gpa.user_id
                JOIN goals g ON g.id=gpa.goal_id AND g.user_id=gpa.user_id
                WHERE gpa.user_id=? AND gpa.goal_id=?
                """,
                (rs, rowNum) -> new PortfolioLink(
                        rs.getLong("id"),
                        rs.getLong("user_id"),
                        rs.getLong("goal_id"),
                        rs.getLong("portfolio_id"),
                        rs.getString("portfolio_name"),
                        rs.getString("goal_name"),
                        rs.getBigDecimal("target_amount"),
                        rs.getString("status")
                ),
                userId, goalId
        );
        return rows.stream().findFirst();
    }

    public Optional<PortfolioLink> linkForPortfolio(Long portfolioId, Long userId) {
        List<PortfolioLink> rows = jdbc.query("""
                SELECT gpa.id,
                       gpa.user_id,
                       gpa.goal_id,
                       gpa.portfolio_id,
                       p.name AS portfolio_name,
                       g.name AS goal_name,
                       g.target_amount,
                       g.status
                FROM goal_portfolio_allocations gpa
                JOIN portfolios p ON p.id=gpa.portfolio_id AND p.user_id=gpa.user_id
                JOIN goals g ON g.id=gpa.goal_id AND g.user_id=gpa.user_id
                WHERE gpa.user_id=? AND gpa.portfolio_id=?
                """,
                (rs, rowNum) -> new PortfolioLink(
                        rs.getLong("id"),
                        rs.getLong("user_id"),
                        rs.getLong("goal_id"),
                        rs.getLong("portfolio_id"),
                        rs.getString("portfolio_name"),
                        rs.getString("goal_name"),
                        rs.getBigDecimal("target_amount"),
                        rs.getString("status")
                ),
                userId, portfolioId
        );
        return rows.stream().findFirst();
    }

    public boolean isAssetInsideGoalPortfolio(Long goalId, Long assetId, Long userId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM goal_portfolio_allocations gpa
                JOIN assets a
                  ON a.portfolio_id=gpa.portfolio_id
                 AND a.user_id=gpa.user_id
                WHERE gpa.user_id=?
                  AND gpa.goal_id=?
                  AND a.id=?
                """, Integer.class, userId, goalId, assetId);
        return count != null && count > 0;
    }

    private List<DynamicAssetReservation> dynamicReservations(PortfolioLink link) {
        if ("COMPLETED".equals(link.goalStatus())) return List.of();

        BigDecimal explicitForGoal = value("""
                SELECT COALESCE(SUM(amount),0)
                FROM goal_allocations
                WHERE user_id=? AND goal_id=?
                """, link.userId(), link.goalId());

        BigDecimal spentForGoal = value("""
                SELECT COALESCE(SUM(amount),0)
                FROM goal_spendings
                WHERE user_id=? AND goal_id=?
                """, link.userId(), link.goalId());

        BigDecimal headroom = link.targetAmount()
                .subtract(explicitForGoal)
                .subtract(spentForGoal)
                .max(ZERO);
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

        BigDecimal totalFree = assets.stream()
                .map(FreeAsset::freeAmount)
                .reduce(ZERO, BigDecimal::add);
        if (totalFree.signum() <= 0) return List.of();

        BigDecimal reserveTotal = headroom.min(totalFree);
        List<DynamicAssetReservation> result = new ArrayList<>();

        // When the goal needs the whole portfolio, reserve every free złoty.
        if (reserveTotal.compareTo(totalFree) >= 0) {
            for (FreeAsset asset : assets) {
                if (asset.freeAmount().signum() <= 0) continue;
                result.add(toReservation(link, asset, asset.freeAmount()));
            }
            return result;
        }

        // If the portfolio has already exceeded the goal, reserve the required
        // amount proportionally instead of arbitrarily locking the first assets.
        BigDecimal remaining = reserveTotal.setScale(SCALE, RoundingMode.HALF_UP);
        List<FreeAsset> positive = assets.stream()
                .filter(asset -> asset.freeAmount().signum() > 0)
                .toList();

        for (int i = 0; i < positive.size(); i++) {
            FreeAsset asset = positive.get(i);
            BigDecimal amount;
            if (i == positive.size() - 1) {
                amount = remaining.min(asset.freeAmount());
            } else {
                amount = reserveTotal
                        .multiply(asset.freeAmount())
                        .divide(totalFree, SCALE, RoundingMode.DOWN)
                        .min(asset.freeAmount())
                        .min(remaining);
            }
            if (amount.signum() > 0) {
                result.add(toReservation(link, asset, amount));
                remaining = remaining.subtract(amount);
            }
            if (remaining.signum() <= 0) break;
        }
        return result;
    }

    private DynamicAssetReservation toReservation(PortfolioLink link, FreeAsset asset, BigDecimal amount) {
        return new DynamicAssetReservation(
                link.linkId(),
                link.goalId(),
                link.goalName(),
                link.portfolioId(),
                link.portfolioName(),
                asset.id(),
                asset.name(),
                amount
        );
    }

    private BigDecimal value(String sql, Long userId, Long goalId) {
        BigDecimal result = jdbc.queryForObject(sql, BigDecimal.class, userId, goalId);
        return result == null ? ZERO : result;
    }

    public record PortfolioLink(
            Long linkId,
            Long userId,
            Long goalId,
            Long portfolioId,
            String portfolioName,
            String goalName,
            BigDecimal targetAmount,
            String goalStatus
    ) {}

    public record DynamicAssetReservation(
            Long linkId,
            Long goalId,
            String goalName,
            Long portfolioId,
            String portfolioName,
            Long assetId,
            String assetName,
            BigDecimal amount
    ) {}

    private record AssetPortfolioRow(Long id, Long portfolioId) {}
    private record FreeAsset(Long id, String name, BigDecimal freeAmount) {}
}
