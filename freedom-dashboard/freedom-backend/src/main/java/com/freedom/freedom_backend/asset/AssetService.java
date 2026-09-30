package com.freedom.freedom_backend.asset;

import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import com.freedom.freedom_backend.market.MetalPricingService;
import com.freedom.freedom_backend.market.MetalQuoteResponse;
import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class AssetService {
    private static final Set<String> ICONS = Set.of(
            "landmark", "wallet", "banknote", "coins", "trendingUp", "chart", "bitcoin",
            "circleDollar", "building", "house", "briefcase", "car", "shield", "piggyBank",
            "gem", "vault", "goldBars", "silverCoin"
    );

    private final AssetRepository repo;
    private final JdbcTemplate jdbc;
    private final MoneyLedgerService ledger;
    private final MetalPricingService metalPricing;

    public AssetService(
            AssetRepository repo,
            JdbcTemplate jdbc,
            MoneyLedgerService ledger,
            MetalPricingService metalPricing
    ) {
        this.repo = repo;
        this.jdbc = jdbc;
        this.ledger = ledger;
        this.metalPricing = metalPricing;
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getAllAssets(User u) {
        return repo.findAllByUserId(u.getId()).stream().map(AssetResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AssetResponse getAsset(Long id, User u) {
        return AssetResponse.from(find(id, u));
    }

    public AssetResponse createAsset(AssetRequest r, User u) {
        AssetCategory category = r.category() != null ? r.category() : AssetCategory.OTHER;
        Long portfolioId = resolvePortfolio(r.portfolioId(), u.getId());
        MarketSetup market = marketSetup(r, category);
        BigDecimal value = market.enabled() ? market.value() : r.value();

        Asset asset = new Asset(
                u,
                r.name(),
                value,
                r.color(),
                category,
                icon(r.iconKey(), category, market.symbol()),
                portfolioId
        );
        asset.configureMarketPricing(
                market.enabled(),
                market.symbol(),
                market.quantity(),
                market.unit(),
                market.quote() == null ? null : market.quote().priceUsdPerTroyOunce(),
                market.quote() == null ? null : market.quote().usdPlnRate(),
                market.quote() == null ? null : market.quote().metalUpdatedAt()
        );

        Asset saved = repo.saveAndFlush(asset);
        ledger.recordAssetCreation(saved.getId(), saved.getValue(), u);
        return AssetResponse.from(saved);
    }

    public AssetResponse updateAsset(Long id, AssetRequest r, User u) {
        Asset asset = find(id, u);
        AssetCategory category = r.category() != null ? r.category() : AssetCategory.OTHER;
        Long portfolioId = asset.isSystemCash()
                ? asset.getPortfolioId()
                : resolvePortfolio(r.portfolioId() != null ? r.portfolioId() : asset.getPortfolioId(), u.getId());

        if (asset.isSystemCash() && r.value().compareTo(asset.getValue()) != 0) {
            throw new IllegalArgumentException("Systemowa Gotówka jest sterowana przez przychody i wydatki.");
        }

        MarketSetup market = asset.isSystemCash() ? MarketSetup.manual() : marketSetup(r, category);
        BigDecimal before = asset.getValue();
        BigDecimal nextValue = market.enabled() ? market.value() : r.value();

        if (!asset.isSystemCash()
                && !market.enabled()
                && nextValue.compareTo(before) < 0
                && nextValue.compareTo(ledger.reserved(id, u)) < 0) {
            throw new IllegalArgumentException(
                    "Nie można obniżyć wartości aktywa poniżej kwoty zarezerwowanej na cele i zobowiązania. Najpierw zwolnij część rezerwacji."
            );
        }

        String oldName = asset.getName();
        asset.update(
                r.name(),
                nextValue,
                r.color(),
                category,
                icon(r.iconKey(), category, market.symbol()),
                portfolioId
        );
        asset.configureMarketPricing(
                market.enabled(),
                market.symbol(),
                market.quantity(),
                market.unit(),
                market.quote() == null ? null : market.quote().priceUsdPerTroyOunce(),
                market.quote() == null ? null : market.quote().usdPlnRate(),
                market.quote() == null ? null : market.quote().metalUpdatedAt()
        );

        if (!asset.isSystemCash() && before.compareTo(nextValue) != 0) {
            jdbc.update(
                    "INSERT INTO asset_valuation_events(user_id,asset_id,asset_name_snapshot,previous_value,new_value,delta,reason) VALUES(?,?,?,?,?,?,'MARKET_REVALUATION')",
                    u.getId(), asset.getId(), oldName, before, nextValue, nextValue.subtract(before)
            );
            ledger.recordValuation(asset.getId(), before, nextValue, u);
        }

        if (market.enabled()) {
            repo.flush();
            ledger.clampReservationsForAsset(asset.getId(), u);
        }

        return AssetResponse.from(asset);
    }

    public void deleteAsset(Long id, User u) {
        Asset asset = find(id, u);
        if (asset.isSystemCash()) throw new IllegalArgumentException("Systemowej Gotówki nie można usunąć.");
        if (ledger.reserved(id, u).signum() > 0) {
            throw new IllegalArgumentException("Najpierw zwolnij środki tego aktywa z celów i zobowiązań.");
        }
        ledger.consumeAssetBeforeDelete(id, u);
        repo.delete(asset);
    }

    private MarketSetup marketSetup(AssetRequest request, AssetCategory category) {
        boolean enabled = Boolean.TRUE.equals(request.marketPriced());
        if (!enabled) return MarketSetup.manual();

        if (category != AssetCategory.METALS) {
            throw new IllegalArgumentException("Automatyczna wycena metalu jest dostępna tylko dla kategorii Metale szlachetne.");
        }
        if (request.metalSymbol() == null || request.metalQuantity() == null || request.metalUnit() == null) {
            throw new IllegalArgumentException("Wybierz metal, ilość i jednostkę.");
        }
        if (request.metalQuantity().signum() <= 0) {
            throw new IllegalArgumentException("Ilość metalu musi być większa od zera.");
        }

        MetalQuoteResponse quote = metalPricing.quote(request.metalSymbol());
        BigDecimal value = metalPricing.valuePln(quote, request.metalQuantity(), request.metalUnit());
        return new MarketSetup(true, request.metalSymbol(), request.metalQuantity(), request.metalUnit(), quote, value);
    }

    private Asset find(Long id, User u) {
        return repo.findByIdAndUserId(id, u.getId()).orElseThrow(() -> new AssetNotFoundException(id));
    }

    private Long resolvePortfolio(Long requested, Long uid) {
        if (requested != null) {
            Integer n = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM portfolios WHERE id=? AND user_id=? AND type<>'GOALS'",
                    Integer.class,
                    requested,
                    uid
            );
            if (n != null && n > 0) return requested;
        }
        return jdbc.queryForObject(
                "SELECT id FROM portfolios WHERE user_id=? AND type='MAIN' AND system_portfolio=TRUE",
                Long.class,
                uid
        );
    }

    private String icon(String key, AssetCategory category, MetalSymbol metalSymbol) {
        if (key != null && ICONS.contains(key)) return key;
        return switch (category) {
            case CASH -> "landmark";
            case STOCKS -> "chart";
            case CRYPTO -> "bitcoin";
            case REAL_ESTATE -> "building";
            case BUSINESS -> "briefcase";
            case VEHICLE -> "car";
            case METALS -> metalSymbol == MetalSymbol.XAG ? "silverCoin" : "goldBars";
            case OTHER -> "circleDollar";
        };
    }

    private record MarketSetup(
            boolean enabled,
            MetalSymbol symbol,
            BigDecimal quantity,
            MetalUnit unit,
            MetalQuoteResponse quote,
            BigDecimal value
    ) {
        private static MarketSetup manual() {
            return new MarketSetup(false, null, null, null, null, null);
        }
    }
}
