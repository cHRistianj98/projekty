package com.freedom.freedom_backend.asset;

import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import com.freedom.freedom_backend.market.MetalPricingService;
import com.freedom.freedom_backend.market.MetalQuoteResponse;
import com.freedom.freedom_backend.market.RealEstatePricingService;
import com.freedom.freedom_backend.market.RealEstateQuoteResponse;
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
    private final RealEstatePricingService realEstatePricing;

    public AssetService(
            AssetRepository repo,
            JdbcTemplate jdbc,
            MoneyLedgerService ledger,
            MetalPricingService metalPricing,
            RealEstatePricingService realEstatePricing
    ) {
        this.repo = repo;
        this.jdbc = jdbc;
        this.ledger = ledger;
        this.metalPricing = metalPricing;
        this.realEstatePricing = realEstatePricing;
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
        PricingSetup pricing = pricingSetup(r, category);
        BigDecimal value = pricing.value() != null ? pricing.value() : r.value();

        Asset asset = new Asset(
                u,
                r.name(),
                value,
                r.color(),
                category,
                icon(r.iconKey(), category, pricing.metalSymbol()),
                portfolioId
        );
        configurePricing(asset, pricing, r);

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

        PricingSetup pricing = asset.isSystemCash() ? PricingSetup.manual() : pricingSetup(r, category);
        BigDecimal before = asset.getValue();
        BigDecimal nextValue = pricing.value() != null ? pricing.value() : r.value();

        if (!asset.isSystemCash()
                && !pricing.enabled()
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
                icon(r.iconKey(), category, pricing.metalSymbol()),
                portfolioId
        );
        configurePricing(asset, pricing, r);

        if (!asset.isSystemCash() && before.compareTo(nextValue) != 0) {
            jdbc.update(
                    "INSERT INTO asset_valuation_events(user_id,asset_id,asset_name_snapshot,previous_value,new_value,delta,reason) VALUES(?,?,?,?,?,?,'MARKET_REVALUATION')",
                    u.getId(), asset.getId(), oldName, before, nextValue, nextValue.subtract(before)
            );
            ledger.recordValuation(asset.getId(), before, nextValue, u);
        }

        if (pricing.enabled()) {
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

    private PricingSetup pricingSetup(AssetRequest request, AssetCategory category) {
        boolean enabled = Boolean.TRUE.equals(request.marketPriced());
        if (!enabled) return PricingSetup.manual();

        if (category == AssetCategory.METALS) {
            if (request.metalSymbol() == null || request.metalQuantity() == null || request.metalUnit() == null) {
                throw new IllegalArgumentException("Wybierz metal, ilość i jednostkę.");
            }
            if (request.metalQuantity().signum() <= 0) {
                throw new IllegalArgumentException("Ilość metalu musi być większa od zera.");
            }
            MetalQuoteResponse quote = metalPricing.quote(request.metalSymbol());
            BigDecimal value = metalPricing.valuePln(quote, request.metalQuantity(), request.metalUnit());
            return PricingSetup.metal(request.metalSymbol(), request.metalQuantity(), request.metalUnit(), quote, value);
        }

        if (category == AssetCategory.REAL_ESTATE) {
            RealEstateType type = request.realEstateType() == null ? RealEstateType.APARTMENT : request.realEstateType();
            if (type != RealEstateType.APARTMENT) {
                throw new IllegalArgumentException("Automatyczna wycena obsługuje obecnie mieszkania.");
            }
            if (request.realEstateCity() == null || request.realEstateCity().isBlank()) {
                throw new IllegalArgumentException("Podaj miasto mieszkania.");
            }
            if (request.realEstateAreaSqm() == null || request.realEstateAreaSqm().signum() <= 0) {
                throw new IllegalArgumentException("Podaj powierzchnię mieszkania.");
            }

            RealEstateValuationMode mode = request.realEstateValuationMode() == null
                    ? RealEstateValuationMode.MARKET_MEDIAN
                    : request.realEstateValuationMode();

            RealEstateMarketSegment segment = request.realEstateMarketSegment() == null
                    ? RealEstateMarketSegment.ALL
                    : request.realEstateMarketSegment();

            if (mode == RealEstateValuationMode.MARKET_ANCHORED) {
                if (request.realEstatePurchasePrice() == null || request.realEstatePurchasePrice().signum() <= 0) {
                    throw new IllegalArgumentException("Podaj cenę zakupu mieszkania.");
                }
                if (request.realEstatePurchaseDate() == null) {
                    throw new IllegalArgumentException("Podaj datę zakupu mieszkania.");
                }
            }

            RealEstateQuoteResponse quote = realEstatePricing.quoteApartment(
                    request.realEstateCity(),
                    request.realEstateDistrict(),
                    request.realEstateAreaSqm(),
                    segment,
                    mode,
                    request.realEstatePurchasePrice(),
                    request.realEstatePurchaseDate()
            );
            return PricingSetup.realEstate(type, quote);
        }

        throw new IllegalArgumentException("Automatyczna wycena jest dostępna dla metali szlachetnych i mieszkań.");
    }

    private void configurePricing(Asset asset, PricingSetup pricing, AssetRequest request) {
        if (pricing.kind() == PricingKind.METAL) {
            MetalQuoteResponse quote = pricing.metalQuote();
            asset.configureRealEstatePricing(
                    false, null, null, null, null,
                    null, null, null, null, null
            );
            asset.configureMarketPricing(
                    true,
                    pricing.metalSymbol(),
                    pricing.metalQuantity(),
                    pricing.metalUnit(),
                    quote.priceUsdPerTroyOunce(),
                    quote.usdPlnRate(),
                    quote.metalUpdatedAt()
            );
            return;
        }

        if (pricing.kind() == PricingKind.REAL_ESTATE) {
            asset.configureMarketPricing(false, null, null, null, null, null, null);
            asset.configureRealEstatePricing(
                    true,
                    pricing.realEstateType(),
                    request.realEstateCity().trim(),
                    request.realEstateDistrict(),
                    request.realEstateAreaSqm(),
                    request.realEstateValuationMode() == null
                            ? RealEstateValuationMode.MARKET_MEDIAN
                            : request.realEstateValuationMode(),
                    request.realEstateMarketSegment() == null
                            ? RealEstateMarketSegment.ALL
                            : request.realEstateMarketSegment(),
                    request.realEstatePurchasePrice(),
                    request.realEstatePurchaseDate(),
                    pricing.realEstateQuote()
            );
            return;
        }

        asset.configureMarketPricing(false, null, null, null, null, null, null);
        asset.configureRealEstatePricing(
                false, null, null, null, null,
                null, null, null, null, null
        );
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

    private enum PricingKind { MANUAL, METAL, REAL_ESTATE }

    private record PricingSetup(
            PricingKind kind,
            MetalSymbol metalSymbol,
            BigDecimal metalQuantity,
            MetalUnit metalUnit,
            MetalQuoteResponse metalQuote,
            RealEstateType realEstateType,
            RealEstateQuoteResponse realEstateQuote,
            BigDecimal value
    ) {
        private static PricingSetup manual() {
            return new PricingSetup(PricingKind.MANUAL, null, null, null, null, null, null, null);
        }

        private static PricingSetup metal(
                MetalSymbol symbol,
                BigDecimal quantity,
                MetalUnit unit,
                MetalQuoteResponse quote,
                BigDecimal value
        ) {
            return new PricingSetup(PricingKind.METAL, symbol, quantity, unit, quote, null, null, value);
        }

        private static PricingSetup realEstate(RealEstateType type, RealEstateQuoteResponse quote) {
            return new PricingSetup(PricingKind.REAL_ESTATE, null, null, null, null, type, quote, quote.estimatedValue());
        }

        private boolean enabled() { return kind != PricingKind.MANUAL; }
    }
}
