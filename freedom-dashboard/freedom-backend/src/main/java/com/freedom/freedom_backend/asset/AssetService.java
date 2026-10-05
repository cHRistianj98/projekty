package com.freedom.freedom_backend.asset;

import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import com.freedom.freedom_backend.market.MetalPricingService;
import com.freedom.freedom_backend.market.MetalQuoteResponse;
import com.freedom.freedom_backend.market.RealEstatePricingService;
import com.freedom.freedom_backend.market.RealEstateQuoteResponse;
import com.freedom.freedom_backend.market.CryptoPricingService;
import com.freedom.freedom_backend.market.CryptoQuoteResponse;
import com.freedom.freedom_backend.market.FxPricingService;
import com.freedom.freedom_backend.market.FxQuoteResponse;
import com.freedom.freedom_backend.market.StockPricingService;
import com.freedom.freedom_backend.market.StockQuoteResponse;
import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class AssetService {
    private static final Set<String> ICONS = Set.of(
            "landmark", "wallet", "banknote", "coins", "trendingUp", "chart", "bitcoin",
            "circleDollar", "building", "house", "briefcase", "car", "shield", "piggyBank",
            "gem", "vault", "goldBars", "silverCoin", "scrollText"
    );

    private final AssetRepository repo;
    private final JdbcTemplate jdbc;
    private final MoneyLedgerService ledger;
    private final MetalPricingService metalPricing;
    private final RealEstatePricingService realEstatePricing;
    private final CryptoPricingService cryptoPricing;
    private final FxPricingService fxPricing;
    private final StockPricingService stockPricing;
    private final StockTaxValuationService stockTaxValuation;
    private final RetailBondValuationService retailBondValuation;

    public AssetService(
            AssetRepository repo,
            JdbcTemplate jdbc,
            MoneyLedgerService ledger,
            MetalPricingService metalPricing,
            RealEstatePricingService realEstatePricing,
            CryptoPricingService cryptoPricing,
            FxPricingService fxPricing,
            StockPricingService stockPricing,
            StockTaxValuationService stockTaxValuation,
            RetailBondValuationService retailBondValuation
    ) {
        this.repo = repo;
        this.jdbc = jdbc;
        this.ledger = ledger;
        this.metalPricing = metalPricing;
        this.realEstatePricing = realEstatePricing;
        this.cryptoPricing = cryptoPricing;
        this.fxPricing = fxPricing;
        this.stockPricing = stockPricing;
        this.stockTaxValuation = stockTaxValuation;
        this.retailBondValuation = retailBondValuation;
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
        RetailBondValuationService.BondValuation bondValuation = bondValuation(r, category);
        BigDecimal value = bondValuation != null
                ? bondValuation.netValue()
                : (pricing.value() != null ? pricing.value() : r.value());

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
        configureBondValuation(asset, bondValuation);

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
        RetailBondValuationService.BondValuation bondValuation = asset.isSystemCash() ? null : bondValuation(r, category);
        BigDecimal before = asset.getValue();
        BigDecimal nextValue = bondValuation != null
                ? bondValuation.netValue()
                : (pricing.value() != null ? pricing.value() : r.value());

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
        configureBondValuation(asset, bondValuation);

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
        if (category == AssetCategory.BONDS) return PricingSetup.manual();

        if (category == AssetCategory.CASH && Boolean.TRUE.equals(request.fxPriced())) {
            if (request.cashCurrency() == null || request.cashCurrency() == CashCurrency.PLN) {
                throw new IllegalArgumentException("Wybierz walutę obcą: EUR, CHF, USD albo CZK.");
            }
            if (request.cashQuantity() == null || request.cashQuantity().signum() <= 0) {
                throw new IllegalArgumentException("Ilość waluty musi być większa od zera.");
            }
            FxQuoteResponse quote = fxPricing.quote(request.cashCurrency());
            BigDecimal value = fxPricing.valuePln(quote, request.cashQuantity());
            return PricingSetup.fx(request.cashCurrency(), request.cashQuantity(), quote, value);
        }

        if (category == AssetCategory.STOCKS && Boolean.TRUE.equals(request.stockPriced())) {
            if (request.stockSymbol() == null || request.stockSymbol().isBlank()) {
                throw new IllegalArgumentException("Podaj symbol instrumentu w Stooq, np. DNP, XTB, MMM.US.");
            }
            if (request.stockCurrency() == null) {
                throw new IllegalArgumentException("Wybierz walutę notowania instrumentu.");
            }
            if (request.stockQuantity() == null || request.stockQuantity().signum() <= 0) {
                throw new IllegalArgumentException("Ilość akcji/jednostek musi być większa od zera.");
            }
            if (request.stockAverageBuyPrice() == null || request.stockAverageBuyPrice().signum() <= 0) {
                throw new IllegalArgumentException("Średnia cena zakupu musi być większa od zera.");
            }

            StockQuoteResponse quote = stockPricing.quote(request.stockSymbol(), request.stockCurrency());
            StockTaxValuationService.StockValuation valuation = stockTaxValuation.calculate(
                    quote,
                    request.stockQuantity(),
                    request.stockAverageBuyPrice(),
                    request.stockBuyFxRatePln()
            );

            return PricingSetup.stock(
                    quote.symbol(),
                    request.stockCurrency(),
                    request.stockQuantity(),
                    request.stockAverageBuyPrice(),
                    valuation.buyFxRatePln(),
                    quote,
                    valuation
            );
        }

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

        if (category == AssetCategory.CRYPTO) {
            if (request.cryptoCoinId() == null || request.cryptoCoinId().isBlank()) {
                throw new IllegalArgumentException("Wybierz kryptowalutę z CoinGecko.");
            }
            if (request.cryptoQuantity() == null || request.cryptoQuantity().signum() <= 0) {
                throw new IllegalArgumentException("Ilość krypto musi być większa od zera.");
            }
            String symbol = request.cryptoSymbol() == null || request.cryptoSymbol().isBlank()
                    ? request.cryptoCoinId().toUpperCase()
                    : request.cryptoSymbol().trim().toUpperCase();
            CryptoQuoteResponse quote = cryptoPricing.quote(request.cryptoCoinId(), symbol, request.name());
            BigDecimal value = cryptoPricing.valuePln(quote, request.cryptoQuantity());
            return PricingSetup.crypto(request.cryptoCoinId().trim().toLowerCase(), symbol, request.cryptoQuantity(), quote, value);
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

        throw new IllegalArgumentException("Automatyczna wycena jest dostępna dla akcji/ETF, walut obcych, krypto, metali szlachetnych i mieszkań.");
    }

    private RetailBondValuationService.BondValuation bondValuation(AssetRequest request, AssetCategory category) {
        if (category != AssetCategory.BONDS) return null;
        return retailBondValuation.calculate(request.bondPurchaseValue(), request.bondGrossValue());
    }

    private void configureBondValuation(Asset asset, RetailBondValuationService.BondValuation valuation) {
        if (valuation == null) {
            asset.configureRetailBondValuation(false, null, null, null, null, null);
            return;
        }
        asset.configureRetailBondValuation(
                true,
                valuation.purchaseValue(),
                valuation.grossValue(),
                valuation.taxableGain(),
                valuation.taxRate(),
                valuation.taxAmount()
        );
    }

    private void configurePricing(Asset asset, PricingSetup pricing, AssetRequest request) {
        if (pricing.kind() == PricingKind.METAL) {
            MetalQuoteResponse quote = pricing.metalQuote();
            asset.clearCryptoPricing();
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

        if (pricing.kind() == PricingKind.CRYPTO) {
            asset.configureMarketPricing(false, null, null, null, null, null, null);
            asset.configureRealEstatePricing(
                    false, null, null, null, null,
                    null, null, null, null, null
            );
            asset.configureCryptoPricing(
                    true,
                    pricing.cryptoCoinId(),
                    pricing.cryptoSymbol(),
                    pricing.cryptoQuantity(),
                    pricing.cryptoQuote()
            );
            return;
        }

        if (pricing.kind() == PricingKind.FX) {
            asset.clearCryptoPricing();
            asset.configureMarketPricing(false, null, null, null, null, null, null);
            asset.configureRealEstatePricing(
                    false, null, null, null, null,
                    null, null, null, null, null
            );
            asset.configureFxPricing(
                    true,
                    pricing.cashCurrency(),
                    pricing.cashQuantity(),
                    pricing.fxQuote()
            );
            return;
        }

        if (pricing.kind() == PricingKind.STOCK) {
            asset.clearCryptoPricing();
            asset.clearFxPricing();
            asset.configureMarketPricing(false, null, null, null, null, null, null);
            asset.configureRealEstatePricing(
                    false, null, null, null, null,
                    null, null, null, null, null
            );
            asset.configureStockPricing(
                    true,
                    pricing.stockSymbol(),
                    pricing.stockCurrency(),
                    pricing.stockQuantity(),
                    pricing.stockAverageBuyPrice(),
                    pricing.stockBuyFxRatePln(),
                    pricing.stockQuote(),
                    pricing.stockValuation()
            );
            return;
        }

        if (pricing.kind() == PricingKind.REAL_ESTATE) {
            asset.clearCryptoPricing();
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

        asset.clearCryptoPricing();
        asset.clearFxPricing();
        asset.clearStockPricing();
        asset.configureMarketPricing(false, null, null, null, null, null, null);
        asset.configureRealEstatePricing(
                false, null, null, null, null,
                null, null, null, null, null
        );
    }

    public Long createEmptyPurchaseTarget(AssetPurchaseTargetRequest request, Long portfolioId, User user) {
        if (request == null) throw new IllegalArgumentException("Brak danych nowej pozycji.");
        if (request.category() == null) throw new IllegalArgumentException("Wybierz typ nowej pozycji.");
        if (request.name() == null || request.name().isBlank()) throw new IllegalArgumentException("Podaj nazwę nowej pozycji.");

        Long resolvedPortfolioId = resolvePortfolio(portfolioId, user.getId());
        String color = request.color() == null || request.color().isBlank() ? "#3b82f6" : request.color().trim();
        Asset asset = new Asset(
                user,
                request.name().trim(),
                BigDecimal.ZERO,
                color,
                request.category(),
                icon(request.iconKey(), request.category(), null),
                resolvedPortfolioId
        );

        switch (request.category()) {
            case CRYPTO -> {
                if (request.cryptoCoinId() == null || request.cryptoCoinId().isBlank()) {
                    throw new IllegalArgumentException("Podaj identyfikator kryptowaluty CoinGecko.");
                }
                String symbol = request.cryptoSymbol() == null || request.cryptoSymbol().isBlank()
                        ? request.cryptoCoinId().trim().toUpperCase(Locale.ROOT)
                        : request.cryptoSymbol().trim().toUpperCase(Locale.ROOT);
                asset.configureCryptoPricing(
                        true,
                        request.cryptoCoinId().trim().toLowerCase(Locale.ROOT),
                        symbol,
                        BigDecimal.ZERO,
                        null
                );
            }
            case CASH -> {
                if (request.cashCurrency() == null || request.cashCurrency() == CashCurrency.PLN) {
                    throw new IllegalArgumentException("Nowa pozycja walutowa musi być walutą obcą.");
                }
                asset.configureFxPricing(true, request.cashCurrency(), BigDecimal.ZERO, null);
            }
            case STOCKS -> {
                if (request.stockSymbol() == null || request.stockSymbol().isBlank()) {
                    throw new IllegalArgumentException("Podaj ticker akcji / ETF.");
                }
                if (request.stockCurrency() == null) {
                    throw new IllegalArgumentException("Wybierz walutę notowania akcji / ETF.");
                }
                asset.configureStockPricing(
                        true,
                        request.stockSymbol().trim().toUpperCase(Locale.ROOT),
                        request.stockCurrency(),
                        BigDecimal.ZERO,
                        null,
                        null,
                        null,
                        null
                );
            }
            default -> throw new IllegalArgumentException(
                    "Zakup z podaniem liczby jednostek obsługuje krypto, akcje / ETF i waluty obce."
            );
        }

        return repo.saveAndFlush(asset).getId();
    }

    public boolean supportsUnitPurchase(Long assetId, User user) {
        Asset asset = find(assetId, user);
        return (asset.getCategory() == AssetCategory.CRYPTO
                    && asset.getCryptoCoinId() != null
                    && !asset.getCryptoCoinId().isBlank())
                || (asset.getCategory() == AssetCategory.STOCKS
                    && asset.isStockPriced()
                    && asset.getStockSymbol() != null
                    && asset.getStockCurrency() != null)
                || (asset.getCategory() == AssetCategory.CASH
                    && asset.isFxPriced()
                    && asset.getCashCurrency() != null
                    && asset.getCashCurrency() != CashCurrency.PLN);
    }

    /**
     * Finalizes a purchase after the PLN capital has already been moved to the target asset in the ledger.
     * The quantity becomes the source of truth and the visible PLN value is recalculated from the latest market quote.
     * The difference between transferred cost and current market value is a valuation change, never an income transaction.
     */
    public AssetResponse applyPurchasedQuantity(
            Long assetId,
            BigDecimal acquiredQuantity,
            BigDecimal purchaseAmountPln,
            User user
    ) {
        if (acquiredQuantity == null || acquiredQuantity.signum() <= 0) {
            throw new IllegalArgumentException("Liczba otrzymanych jednostek musi być większa od zera.");
        }
        if (purchaseAmountPln == null || purchaseAmountPln.signum() <= 0) {
            throw new IllegalArgumentException("Kwota zakupu musi być większa od zera.");
        }

        Asset asset = find(assetId, user);
        BigDecimal before = jdbc.queryForObject(
                "SELECT value FROM assets WHERE id=? AND user_id=?",
                BigDecimal.class, assetId, user.getId()
        );
        if (before == null) throw new AssetNotFoundException(assetId);

        BigDecimal after;

        if (asset.getCategory() == AssetCategory.CRYPTO
                && asset.getCryptoCoinId() != null
                && !asset.getCryptoCoinId().isBlank()) {
            BigDecimal newQuantity = zero(asset.getCryptoQuantity()).add(acquiredQuantity);
            String symbol = asset.getCryptoSymbol() == null || asset.getCryptoSymbol().isBlank()
                    ? asset.getCryptoCoinId().toUpperCase(Locale.ROOT)
                    : asset.getCryptoSymbol();
            CryptoQuoteResponse quote = cryptoPricing.quote(asset.getCryptoCoinId(), symbol, asset.getName());
            after = cryptoPricing.valuePln(quote, newQuantity);
            asset.configureCryptoPricing(true, asset.getCryptoCoinId(), symbol, newQuantity, quote);
            asset.applyCryptoValuation(after, quote);
        } else if (asset.getCategory() == AssetCategory.CASH
                && asset.isFxPriced()
                && asset.getCashCurrency() != null
                && asset.getCashCurrency() != CashCurrency.PLN) {
            BigDecimal newQuantity = zero(asset.getCashQuantity()).add(acquiredQuantity);
            FxQuoteResponse quote = fxPricing.quote(asset.getCashCurrency());
            after = fxPricing.valuePln(quote, newQuantity);
            asset.configureFxPricing(true, asset.getCashCurrency(), newQuantity, quote);
            asset.applyFxValuation(after, quote);
        } else if (asset.getCategory() == AssetCategory.STOCKS
                && asset.isStockPriced()
                && asset.getStockSymbol() != null
                && asset.getStockCurrency() != null) {
            BigDecimal oldQuantity = zero(asset.getStockQuantity());
            BigDecimal newQuantity = oldQuantity.add(acquiredQuantity);
            StockQuoteResponse quote = stockPricing.quote(asset.getStockSymbol(), asset.getStockCurrency());

            BigDecimal oldCostBasis = asset.getStockCostBasisPln();
            if (oldCostBasis == null) {
                BigDecimal oldAverage = zero(asset.getStockAverageBuyPrice());
                BigDecimal oldBuyFx = asset.getStockBuyFxRatePln() == null
                        ? quote.fxRatePln()
                        : asset.getStockBuyFxRatePln();
                oldCostBasis = oldQuantity.multiply(oldAverage).multiply(oldBuyFx);
            }
            BigDecimal totalCostBasis = oldCostBasis.add(purchaseAmountPln);
            BigDecimal buyFx = quote.fxRatePln();
            if (buyFx == null || buyFx.signum() <= 0) buyFx = BigDecimal.ONE;
            BigDecimal averageBuyPrice = totalCostBasis
                    .divide(newQuantity, 16, RoundingMode.HALF_UP)
                    .divide(buyFx, 16, RoundingMode.HALF_UP);

            StockTaxValuationService.StockValuation valuation = stockTaxValuation.calculate(
                    quote, newQuantity, averageBuyPrice, buyFx
            );
            after = valuation.netValuePln();
            asset.configureStockPricing(
                    true,
                    quote.symbol(),
                    asset.getStockCurrency(),
                    newQuantity,
                    averageBuyPrice,
                    buyFx,
                    quote,
                    valuation
            );
        } else {
            throw new IllegalArgumentException(
                    "Wybrane aktywo nie obsługuje zakupu jednostkowego. Wybierz krypto, akcje / ETF lub walutę obcą z automatyczną wyceną."
            );
        }

        repo.flush();

        if (before.compareTo(after) != 0) {
            jdbc.update(
                    "INSERT INTO asset_valuation_events(user_id,asset_id,asset_name_snapshot,previous_value,new_value,delta,reason) VALUES(?,?,?,?,?,?,'PURCHASE_REVALUATION')",
                    user.getId(), asset.getId(), asset.getName(), before, after, after.subtract(before)
            );
            ledger.recordValuation(asset.getId(), before, after, user);
        }
        ledger.clampReservationsForAsset(asset.getId(), user);
        return AssetResponse.from(asset);
    }

    private BigDecimal zero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
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
            case BONDS -> "scrollText";
            case OTHER -> "circleDollar";
        };
    }

    private enum PricingKind { MANUAL, METAL, CRYPTO, FX, STOCK, REAL_ESTATE }

    private record PricingSetup(
            PricingKind kind,
            MetalSymbol metalSymbol,
            BigDecimal metalQuantity,
            MetalUnit metalUnit,
            MetalQuoteResponse metalQuote,
            String cryptoCoinId,
            String cryptoSymbol,
            BigDecimal cryptoQuantity,
            CryptoQuoteResponse cryptoQuote,
            CashCurrency cashCurrency,
            BigDecimal cashQuantity,
            FxQuoteResponse fxQuote,
            String stockSymbol,
            CashCurrency stockCurrency,
            BigDecimal stockQuantity,
            BigDecimal stockAverageBuyPrice,
            BigDecimal stockBuyFxRatePln,
            StockQuoteResponse stockQuote,
            StockTaxValuationService.StockValuation stockValuation,
            RealEstateType realEstateType,
            RealEstateQuoteResponse realEstateQuote,
            BigDecimal value
    ) {
        private static PricingSetup manual() {
            return new PricingSetup(
                    PricingKind.MANUAL,
                    null, null, null, null,
                    null, null, null, null,
                    null, null, null,
                    null, null, null, null, null, null, null,
                    null, null,
                    null
            );
        }

        private static PricingSetup metal(
                MetalSymbol symbol,
                BigDecimal quantity,
                MetalUnit unit,
                MetalQuoteResponse quote,
                BigDecimal value
        ) {
            return new PricingSetup(
                    PricingKind.METAL,
                    symbol, quantity, unit, quote,
                    null, null, null, null,
                    null, null, null,
                    null, null, null, null, null, null, null,
                    null, null,
                    value
            );
        }

        private static PricingSetup crypto(
                String coinId,
                String symbol,
                BigDecimal quantity,
                CryptoQuoteResponse quote,
                BigDecimal value
        ) {
            return new PricingSetup(
                    PricingKind.CRYPTO,
                    null, null, null, null,
                    coinId, symbol, quantity, quote,
                    null, null, null,
                    null, null, null, null, null, null, null,
                    null, null,
                    value
            );
        }

        private static PricingSetup fx(
                CashCurrency currency,
                BigDecimal quantity,
                FxQuoteResponse quote,
                BigDecimal value
        ) {
            return new PricingSetup(
                    PricingKind.FX,
                    null, null, null, null,
                    null, null, null, null,
                    currency, quantity, quote,
                    null, null, null, null, null, null, null,
                    null, null,
                    value
            );
        }

        private static PricingSetup stock(
                String symbol,
                CashCurrency currency,
                BigDecimal quantity,
                BigDecimal averageBuyPrice,
                BigDecimal buyFxRatePln,
                StockQuoteResponse quote,
                StockTaxValuationService.StockValuation valuation
        ) {
            return new PricingSetup(
                    PricingKind.STOCK,
                    null, null, null, null,
                    null, null, null, null,
                    null, null, null,
                    symbol, currency, quantity, averageBuyPrice, buyFxRatePln, quote, valuation,
                    null, null,
                    valuation.netValuePln()
            );
        }

        private static PricingSetup realEstate(RealEstateType type, RealEstateQuoteResponse quote) {
            return new PricingSetup(
                    PricingKind.REAL_ESTATE,
                    null, null, null, null,
                    null, null, null, null,
                    null, null, null,
                    null, null, null, null, null, null, null,
                    type, quote,
                    quote.estimatedValue()
            );
        }

        private boolean enabled() { return kind != PricingKind.MANUAL; }
    }
}
