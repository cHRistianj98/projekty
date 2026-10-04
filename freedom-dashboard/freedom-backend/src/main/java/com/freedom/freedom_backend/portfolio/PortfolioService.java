package com.freedom.freedom_backend.portfolio;

import com.freedom.freedom_backend.user.User;
import com.freedom.freedom_backend.category.Category;
import com.freedom.freedom_backend.category.CategoryService;
import com.freedom.freedom_backend.transaction.ExpenseCategory;
import com.freedom.freedom_backend.transaction.TransactionRequest;
import com.freedom.freedom_backend.transaction.TransactionService;
import com.freedom.freedom_backend.transaction.TransactionType;
import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import com.freedom.freedom_backend.liabilityallocation.LiabilityPortfolioReservationService;
import com.freedom.freedom_backend.goalallocation.GoalPortfolioReservationService;
import com.freedom.freedom_backend.retailbond.RetailBondService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class PortfolioService {
    private static final String DEFAULT_CUSTOM_IMAGE = "/portfolios/long-term.webp";
    private static final String DEFAULT_MAIN_IMAGE = "/portfolios/main.webp";

    private final JdbcTemplate jdbc;
    private final MoneyLedgerService ledger;
    private final LiabilityPortfolioReservationService portfolioReservations;
    private final GoalPortfolioReservationService goalPortfolioReservations;
    private final RetailBondService retailBondService;
    private final CategoryService categoryService;
    private final TransactionService transactionService;

    public PortfolioService(
            JdbcTemplate jdbc,
            MoneyLedgerService ledger,
            LiabilityPortfolioReservationService portfolioReservations,
            GoalPortfolioReservationService goalPortfolioReservations,
            RetailBondService retailBondService,
            CategoryService categoryService,
            TransactionService transactionService
    ) {
        this.jdbc = jdbc;
        this.ledger = ledger;
        this.portfolioReservations = portfolioReservations;
        this.goalPortfolioReservations = goalPortfolioReservations;
        this.retailBondService = retailBondService;
        this.categoryService = categoryService;
        this.transactionService = transactionService;
    }

    @Transactional(readOnly = true)
    public List<PortfolioResponse> getAll(User user) {
        List<PortfolioResponse> base = jdbc.query("""
          SELECT p.id,p.name,p.type,p.color,p.icon_key,p.system_portfolio,p.target_amount,p.monthly_contribution,
                 p.image_url,p.image_position,
                 CASE WHEN p.type='GOALS' THEN 0 ELSE COALESCE(SUM(a.value),0) END gross_value,
                 CASE WHEN p.type='GOALS' THEN 0 ELSE
                      COALESCE((SELECT SUM(ga.amount) FROM goal_allocations ga JOIN assets aa ON aa.id=ga.asset_id WHERE aa.portfolio_id=p.id AND ga.user_id=p.user_id),0) +
                      COALESCE((SELECT SUM(la.amount) FROM liability_allocations la JOIN assets aa ON aa.id=la.asset_id WHERE aa.portfolio_id=p.id AND la.user_id=p.user_id),0)
                 END allocated_out,
                 CASE WHEN p.type='GOALS'
                      THEN COALESCE((SELECT SUM(ga.amount) FROM goal_allocations ga WHERE ga.user_id=p.user_id),0)
                      ELSE COALESCE(SUM(a.value),0)
                           - COALESCE((SELECT SUM(ga.amount) FROM goal_allocations ga JOIN assets aa ON aa.id=ga.asset_id WHERE aa.portfolio_id=p.id AND ga.user_id=p.user_id),0)
                           - COALESCE((SELECT SUM(la.amount) FROM liability_allocations la JOIN assets aa ON aa.id=la.asset_id WHERE aa.portfolio_id=p.id AND la.user_id=p.user_id),0)
                 END display_value
          FROM portfolios p LEFT JOIN assets a ON a.portfolio_id=p.id
          WHERE p.user_id=? GROUP BY p.id ORDER BY p.sort_order,p.id
        """, (rs, n) -> new PortfolioResponse(
                rs.getLong("id"),
                rs.getString("name"),
                PortfolioType.valueOf(rs.getString("type")),
                rs.getString("color"),
                rs.getString("icon_key"),
                rs.getBoolean("system_portfolio"),
                rs.getBigDecimal("gross_value"),
                rs.getBigDecimal("allocated_out"),
                rs.getBigDecimal("display_value"),
                rs.getBigDecimal("target_amount"),
                rs.getBigDecimal("monthly_contribution"),
                rs.getString("image_url"),
                PortfolioImagePosition.valueOf(rs.getString("image_position"))
        ), user.getId());

        return base.stream().map(portfolio -> {
            if (portfolio.type() == PortfolioType.GOALS) return portfolio;
            BigDecimal dynamicLiability = portfolioReservations.reservedForPortfolio(portfolio.id(), user.getId());
            BigDecimal dynamicGoal = goalPortfolioReservations.reservedForPortfolio(portfolio.id(), user.getId());
            BigDecimal dynamic = dynamicLiability.add(dynamicGoal);
            if (dynamic.signum() <= 0) return portfolio;
            return new PortfolioResponse(
                    portfolio.id(),
                    portfolio.name(),
                    portfolio.type(),
                    portfolio.color(),
                    portfolio.iconKey(),
                    portfolio.systemPortfolio(),
                    portfolio.grossValue(),
                    portfolio.allocatedOut().add(dynamic),
                    portfolio.value().subtract(dynamic).max(BigDecimal.ZERO),
                    portfolio.targetAmount(),
                    portfolio.monthlyContribution(),
                    portfolio.imageUrl(),
                    portfolio.imagePosition()
            );
        }).toList();
    }

    public PortfolioResponse create(PortfolioRequest r, User user) {
        ensureSystemPortfolios(user.getId());
        Long id = jdbc.queryForObject("""
                INSERT INTO portfolios(
                    user_id,name,type,color,icon_key,system_portfolio,sort_order,
                    target_amount,monthly_contribution,image_url,image_position
                )
                VALUES(?,?,'CUSTOM',?,?,FALSE,100,?,?,?,?)
                RETURNING id
                """, Long.class,
                user.getId(),
                r.name().trim(),
                color(r.color()),
                icon(r.iconKey()),
                r.targetAmount(),
                contribution(r.monthlyContribution()),
                image(r.imageUrl()),
                position(r.imagePosition()).name()
        );
        return getAll(user).stream().filter(x -> x.id().equals(id)).findFirst().orElseThrow();
    }

    public PortfolioResponse update(Long id, PortfolioRequest r, User user) {
        Integer sys = jdbc.queryForObject(
                "SELECT COUNT(*) FROM portfolios WHERE id=? AND user_id=? AND system_portfolio=TRUE",
                Integer.class, id, user.getId()
        );
        if (sys != null && sys > 0) {
            throw new IllegalArgumentException("Portfela systemowego nie można edytować.");
        }

        int n = jdbc.update("""
                UPDATE portfolios
                SET name=?,color=?,icon_key=?,target_amount=?,monthly_contribution=?,image_url=?,image_position=?
                WHERE id=? AND user_id=?
                """,
                r.name().trim(),
                color(r.color()),
                icon(r.iconKey()),
                r.targetAmount(),
                contribution(r.monthlyContribution()),
                nullableImage(r.imageUrl()),
                position(r.imagePosition()).name(),
                id,
                user.getId()
        );
        if (n == 0) throw new IllegalArgumentException("Nie znaleziono portfela.");
        return getAll(user).stream().filter(x -> x.id().equals(id)).findFirst().orElseThrow();
    }

    public void delete(Long id, User user) {
        Integer sys = jdbc.queryForObject(
                "SELECT COUNT(*) FROM portfolios WHERE id=? AND user_id=? AND system_portfolio=TRUE",
                Integer.class, id, user.getId()
        );
        if (sys != null && sys > 0) throw new IllegalArgumentException("Portfela systemowego nie można usunąć.");
        Integer assets = jdbc.queryForObject(
                "SELECT COUNT(*) FROM assets WHERE portfolio_id=? AND user_id=?",
                Integer.class, id, user.getId()
        );
        if (assets != null && assets > 0) throw new IllegalArgumentException("Najpierw przenieś lub usuń aktywa z portfela.");
        jdbc.update("DELETE FROM portfolios WHERE id=? AND user_id=?", id, user.getId());
    }

    public void transfer(PortfolioTransferRequest r, User user) {
        if (r.sourceAssetId().equals(r.targetAssetId())) {
            throw new IllegalArgumentException("Źródło i cel muszą być różne.");
        }

        AssetRow s = asset(r.sourceAssetId(), user.getId());
        AssetRow t = asset(r.targetAssetId(), user.getId());
        BigDecimal fee = r.normalizedFee();

        if (fee.signum() > 0) {
            // Prowizja jest prawdziwym kosztem i musi zejść z konta/gotówki,
            // z którego finansowany jest zakup. Sam transfer pozostaje neutralny
            // dla cashflow i wartości majątku.
            ledger.resolveTransactionAsset(s.id(), user);
            BigDecimal totalDebit = r.amount().add(fee);
            if (totalDebit.compareTo(ledger.available(s.id(), user)) > 0) {
                throw new IllegalArgumentException(
                        "Za mało wolnych środków na transfer i prowizję. Potrzeba łącznie "
                                + totalDebit.stripTrailingZeros().toPlainString() + " zł."
                );
            }
        }

        ledger.transfer(s.id(), t.id(), r.amount(), user);
        jdbc.update(
                "INSERT INTO portfolio_transfers(user_id,source_asset_id,target_asset_id,source_name_snapshot,target_name_snapshot,amount) VALUES(?,?,?,?,?,?)",
                user.getId(), s.id(), t.id(), s.name(), t.name(), r.amount()
        );

        if (fee.signum() > 0) {
            Category feeCategory = categoryService.investmentFeeCategory(user);
            transactionService.create(
                    new TransactionRequest(
                            TransactionType.EXPENSE,
                            "Prowizja inwestycyjna · " + t.name(),
                            fee,
                            ExpenseCategory.INVESTMENT,
                            feeCategory.getId(),
                            false,
                            LocalDate.now(),
                            null,
                            s.id(),
                            null
                    ),
                    user
            );
        }
    }

    public void moveAsset(PortfolioMoveAssetRequest r, User user) {
        AssetMoveRow source = moveAssetRow(r.assetId(), user.getId());
        if (source.systemCash()) {
            throw new IllegalArgumentException("Środki nierozdzielone są sterowane automatycznie i nie można ich przenosić między portfelami.");
        }
        if (source.portfolioId().equals(r.targetPortfolioId())) {
            throw new IllegalArgumentException("Aktywo znajduje się już w tym portfelu.");
        }
        ensureTargetPortfolio(r.targetPortfolioId(), user.getId());

        Integer bondPositions = jdbc.queryForObject(
                "SELECT COUNT(*) FROM retail_bond_positions WHERE asset_id=? AND user_id=?",
                Integer.class, source.id(), user.getId()
        );
        if ("BONDS".equals(source.category()) && bondPositions != null && bondPositions > 0) {
            retailBondService.moveWholeAssetToPortfolio(source.id(), r.targetPortfolioId(), user);
            return;
        }

        int updated = jdbc.update(
                "UPDATE assets SET portfolio_id=? WHERE id=? AND user_id=? AND system_cash=FALSE",
                r.targetPortfolioId(), source.id(), user.getId()
        );
        if (updated == 0) throw new IllegalArgumentException("Nie udało się przenieść aktywa.");
    }

    private void ensureTargetPortfolio(Long portfolioId, Long userId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM portfolios WHERE id=? AND user_id=? AND type<>'GOALS'",
                Integer.class, portfolioId, userId
        );
        if (count == null || count == 0) throw new IllegalArgumentException("Portfel docelowy nie istnieje.");
    }

    private AssetMoveRow moveAssetRow(Long id, Long uid) {
        return jdbc.query(
                "SELECT id,name,value,system_cash,portfolio_id,category FROM assets WHERE id=? AND user_id=?",
                rs -> {
                    if (!rs.next()) throw new IllegalArgumentException("Nie znaleziono aktywa.");
                    return new AssetMoveRow(
                            rs.getLong("id"),
                            rs.getString("name"),
                            rs.getBigDecimal("value"),
                            rs.getBoolean("system_cash"),
                            rs.getLong("portfolio_id"),
                            rs.getString("category")
                    );
                },
                id, uid
        );
    }

    @Transactional(readOnly = true)
    public List<ValuationEventResponse> valuations(User user) {
        return jdbc.query(
                "SELECT id,asset_id,asset_name_snapshot,previous_value,new_value,delta,reason,created_at FROM asset_valuation_events WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 100",
                (rs, n) -> new ValuationEventResponse(
                        rs.getLong("id"),
                        (Long) rs.getObject("asset_id"),
                        rs.getString("asset_name_snapshot"),
                        rs.getBigDecimal("previous_value"),
                        rs.getBigDecimal("new_value"),
                        rs.getBigDecimal("delta"),
                        rs.getString("reason"),
                        rs.getTimestamp("created_at").toInstant()
                ),
                user.getId()
        );
    }

    public void ensureSystemPortfolios(Long uid) {
        jdbc.update("""
                INSERT INTO portfolios(user_id,name,type,color,icon_key,system_portfolio,sort_order,image_url,image_position)
                SELECT ?,'Główny','MAIN','#3b82f6','wallet',TRUE,0,?,'CENTER'
                WHERE NOT EXISTS(SELECT 1 FROM portfolios WHERE user_id=? AND type='MAIN' AND system_portfolio=TRUE)
                """, uid, DEFAULT_MAIN_IMAGE, uid);
        jdbc.update("""
                INSERT INTO portfolios(user_id,name,type,color,icon_key,system_portfolio,sort_order,image_position)
                SELECT ?,'Cele','GOALS','#8b5cf6','target',TRUE,999,'CENTER'
                WHERE NOT EXISTS(SELECT 1 FROM portfolios WHERE user_id=? AND type='GOALS' AND system_portfolio=TRUE)
                """, uid, uid);
    }

    private AssetRow asset(Long id, Long uid) {
        return jdbc.query(
                "SELECT id,name,value FROM assets WHERE id=? AND user_id=?",
                rs -> {
                    if (!rs.next()) throw new IllegalArgumentException("Nie znaleziono aktywa.");
                    return new AssetRow(rs.getLong(1), rs.getString(2), rs.getBigDecimal(3));
                },
                id,
                uid
        );
    }

    private BigDecimal contribution(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String color(String value) {
        return value == null || value.isBlank() ? "#3b82f6" : value;
    }

    private String icon(String value) {
        return value == null || value.isBlank() ? "wallet" : value;
    }

    private String image(String value) {
        String normalized = nullableImage(value);
        return normalized == null ? DEFAULT_CUSTOM_IMAGE : normalized;
    }

    private String nullableImage(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private PortfolioImagePosition position(PortfolioImagePosition value) {
        return value == null ? PortfolioImagePosition.CENTER : value;
    }

    private record AssetRow(Long id, String name, BigDecimal value) {}
    private record AssetMoveRow(Long id, String name, BigDecimal value, boolean systemCash, Long portfolioId, String category) {}
}
