package com.freedom.freedom_backend.asset;

import com.freedom.freedom_backend.user.User;
import com.freedom.freedom_backend.market.RealEstateQuoteResponse;
import com.freedom.freedom_backend.market.CryptoQuoteResponse;
import com.freedom.freedom_backend.market.FxQuoteResponse;
import com.freedom.freedom_backend.market.StockQuoteResponse;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "assets")
public class Asset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal value;

    @Column(nullable = false)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetCategory category;

    @Column(name = "icon_key", nullable = false)
    private String iconKey;

    @Column(name = "system_cash", nullable = false)
    private boolean systemCash = false;

    @Column(name = "portfolio_id", nullable = false)
    private Long portfolioId;

    @Column(name = "market_priced", nullable = false)
    private boolean marketPriced = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "metal_symbol")
    private MetalSymbol metalSymbol;

    @Column(name = "metal_quantity", precision = 19, scale = 6)
    private BigDecimal metalQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "metal_unit")
    private MetalUnit metalUnit;

    @Column(name = "market_price_usd", precision = 19, scale = 6)
    private BigDecimal marketPriceUsd;

    @Column(name = "usd_pln_rate", precision = 19, scale = 8)
    private BigDecimal usdPlnRate;

    @Column(name = "market_updated_at")
    private Instant marketUpdatedAt;

    @Column(name = "crypto_coin_id")
    private String cryptoCoinId;

    @Column(name = "crypto_symbol")
    private String cryptoSymbol;

    @Column(name = "crypto_quantity", precision = 38, scale = 12)
    private BigDecimal cryptoQuantity;

    @Column(name = "crypto_price_pln", precision = 38, scale = 12)
    private BigDecimal cryptoPricePln;

    @Column(name = "crypto_price_usd", precision = 38, scale = 12)
    private BigDecimal cryptoPriceUsd;

    @Column(name = "crypto_change_24h", precision = 18, scale = 8)
    private BigDecimal cryptoChange24h;

    @Column(name = "crypto_change_1m", precision = 18, scale = 8)
    private BigDecimal cryptoChange1m;

    @Column(name = "crypto_updated_at")
    private Instant cryptoUpdatedAt;

    @Column(name = "fx_priced", nullable = false)
    private boolean fxPriced = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "cash_currency")
    private CashCurrency cashCurrency;

    @Column(name = "cash_quantity", precision = 38, scale = 12)
    private BigDecimal cashQuantity;

    @Column(name = "fx_rate_pln", precision = 19, scale = 8)
    private BigDecimal fxRatePln;

    @Column(name = "fx_change_24h_percent", precision = 18, scale = 8)
    private BigDecimal fxChange24hPercent;

    @Column(name = "fx_change_1m_percent", precision = 18, scale = 8)
    private BigDecimal fxChange1mPercent;

    @Column(name = "fx_effective_date")
    private LocalDate fxEffectiveDate;

    @Column(name = "fx_updated_at")
    private Instant fxUpdatedAt;

    @Column(name = "stock_priced", nullable = false)
    private boolean stockPriced = false;

    @Column(name = "stock_symbol")
    private String stockSymbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "stock_currency")
    private CashCurrency stockCurrency;

    @Column(name = "stock_quantity", precision = 38, scale = 12)
    private BigDecimal stockQuantity;

    @Column(name = "stock_average_buy_price", precision = 38, scale = 12)
    private BigDecimal stockAverageBuyPrice;

    @Column(name = "stock_buy_fx_rate_pln", precision = 19, scale = 8)
    private BigDecimal stockBuyFxRatePln;

    @Column(name = "stock_current_price", precision = 38, scale = 12)
    private BigDecimal stockCurrentPrice;

    @Column(name = "stock_current_fx_rate_pln", precision = 19, scale = 8)
    private BigDecimal stockCurrentFxRatePln;

    @Column(name = "stock_gross_value_pln", precision = 19, scale = 2)
    private BigDecimal stockGrossValuePln;

    @Column(name = "stock_cost_basis_pln", precision = 19, scale = 2)
    private BigDecimal stockCostBasisPln;

    @Column(name = "stock_unrealized_gain_pln", precision = 19, scale = 2)
    private BigDecimal stockUnrealizedGainPln;

    @Column(name = "stock_tax_rate", precision = 7, scale = 4)
    private BigDecimal stockTaxRate;

    @Column(name = "stock_tax_amount_pln", precision = 19, scale = 2)
    private BigDecimal stockTaxAmountPln;

    @Column(name = "stock_change_percent", precision = 18, scale = 8)
    private BigDecimal stockChangePercent;

    @Column(name = "stock_change_24h_pln_percent", precision = 18, scale = 8)
    private BigDecimal stockChange24hPlnPercent;

    @Column(name = "stock_change_1m_pln_percent", precision = 18, scale = 8)
    private BigDecimal stockChange1mPlnPercent;

    @Column(name = "stock_market_date")
    private LocalDate stockMarketDate;

    @Column(name = "stock_market_time")
    private String stockMarketTime;

    @Column(name = "stock_updated_at")
    private Instant stockUpdatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "real_estate_type")
    private RealEstateType realEstateType;

    @Column(name = "real_estate_city")
    private String realEstateCity;

    @Column(name = "real_estate_district")
    private String realEstateDistrict;

    @Column(name = "real_estate_area_sqm", precision = 12, scale = 2)
    private BigDecimal realEstateAreaSqm;

    @Enumerated(EnumType.STRING)
    @Column(name = "real_estate_valuation_mode")
    private RealEstateValuationMode realEstateValuationMode;

    @Enumerated(EnumType.STRING)
    @Column(name = "real_estate_market_segment")
    private RealEstateMarketSegment realEstateMarketSegment;

    @Column(name = "real_estate_purchase_price", precision = 19, scale = 2)
    private BigDecimal realEstatePurchasePrice;

    @Column(name = "real_estate_purchase_date")
    private LocalDate realEstatePurchaseDate;

    @Column(name = "real_estate_median_price_sqm", precision = 19, scale = 2)
    private BigDecimal realEstateMedianPriceSqm;

    @Column(name = "real_estate_estimated_price_sqm", precision = 19, scale = 2)
    private BigDecimal realEstateEstimatedPriceSqm;

    @Column(name = "real_estate_scope")
    private String realEstateScope;

    @Column(name = "real_estate_resolved_area")
    private String realEstateResolvedArea;

    @Column(name = "real_estate_record_count")
    private Integer realEstateRecordCount;

    @Column(name = "real_estate_period_from")
    private LocalDate realEstatePeriodFrom;

    @Column(name = "real_estate_period_to")
    private LocalDate realEstatePeriodTo;

    @Column(name = "real_estate_anchor_median_price_sqm", precision = 19, scale = 2)
    private BigDecimal realEstateAnchorMedianPriceSqm;

    @Column(name = "real_estate_quality_factor", precision = 19, scale = 8)
    private BigDecimal realEstateQualityFactor;

    @Column(name = "real_estate_anchor_resolved_area")
    private String realEstateAnchorResolvedArea;

    @Column(name = "real_estate_anchor_scope")
    private String realEstateAnchorScope;

    @Column(name = "real_estate_anchor_record_count")
    private Integer realEstateAnchorRecordCount;

    @Column(name = "real_estate_anchor_period_from")
    private LocalDate realEstateAnchorPeriodFrom;

    @Column(name = "real_estate_anchor_period_to")
    private LocalDate realEstateAnchorPeriodTo;

    @Column(name = "real_estate_updated_at")
    private Instant realEstateUpdatedAt;

    @Column(name = "bond_purchase_value", precision = 19, scale = 2)
    private BigDecimal bondPurchaseValue;

    @Column(name = "bond_gross_value", precision = 19, scale = 2)
    private BigDecimal bondGrossValue;

    @Column(name = "bond_taxable_gain", precision = 19, scale = 2)
    private BigDecimal bondTaxableGain;

    @Column(name = "bond_tax_rate", precision = 7, scale = 4)
    private BigDecimal bondTaxRate;

    @Column(name = "bond_tax_amount", precision = 19, scale = 2)
    private BigDecimal bondTaxAmount;

    protected Asset() {}

    public Asset(
            User user,
            String name,
            BigDecimal value,
            String color,
            AssetCategory category,
            String iconKey,
            Long portfolioId
    ) {
        this.user = user;
        this.name = name;
        this.value = value;
        this.color = color;
        this.category = category;
        this.iconKey = iconKey;
        this.portfolioId = portfolioId;
    }

    public void update(
            String name,
            BigDecimal value,
            String color,
            AssetCategory category,
            String iconKey,
            Long portfolioId
    ) {
        this.name = name;
        this.value = value;
        this.color = color;
        this.category = category;
        this.iconKey = iconKey;
        this.portfolioId = portfolioId;
    }

    public void configureMarketPricing(
            boolean marketPriced,
            MetalSymbol metalSymbol,
            BigDecimal metalQuantity,
            MetalUnit metalUnit,
            BigDecimal marketPriceUsd,
            BigDecimal usdPlnRate,
            Instant marketUpdatedAt
    ) {
        this.marketPriced = marketPriced;
        this.metalSymbol = marketPriced ? metalSymbol : null;
        this.metalQuantity = marketPriced ? metalQuantity : null;
        this.metalUnit = marketPriced ? metalUnit : null;
        this.marketPriceUsd = marketPriced ? marketPriceUsd : null;
        this.usdPlnRate = marketPriced ? usdPlnRate : null;
        this.marketUpdatedAt = marketPriced ? marketUpdatedAt : null;
        if (marketPriced) {
            clearCryptoPricing();
            clearFxPricing();
            clearStockPricing();
        }
    }

    public void applyMarketValuation(
            BigDecimal value,
            BigDecimal marketPriceUsd,
            BigDecimal usdPlnRate,
            Instant marketUpdatedAt
    ) {
        this.value = value;
        this.marketPriceUsd = marketPriceUsd;
        this.usdPlnRate = usdPlnRate;
        this.marketUpdatedAt = marketUpdatedAt;
    }

    public void configureCryptoPricing(
            boolean enabled,
            String coinId,
            String symbol,
            BigDecimal quantity,
            CryptoQuoteResponse quote
    ) {
        if (!enabled) {
            clearCryptoPricing();
            return;
        }

        boolean sameCoin = this.cryptoCoinId != null
                && coinId != null
                && this.cryptoCoinId.equalsIgnoreCase(coinId);
        BigDecimal previousChange1m = sameCoin ? this.cryptoChange1m : null;

        this.marketPriced = true;
        clearFxPricing();
        clearStockPricing();
        this.cryptoCoinId = coinId;
        this.cryptoSymbol = symbol;
        this.cryptoQuantity = quantity;
        if (quote != null) {
            this.cryptoPricePln = quote.pricePln();
            this.cryptoPriceUsd = quote.priceUsd();
            this.cryptoChange24h = quote.change24h();
            this.cryptoChange1m = quote.change1m() != null ? quote.change1m() : previousChange1m;
            this.cryptoUpdatedAt = quote.updatedAt();
            this.marketUpdatedAt = quote.updatedAt();
        }
    }

    public void applyCryptoValuation(BigDecimal value, CryptoQuoteResponse quote) {
        this.value = value;
        this.cryptoPricePln = quote.pricePln();
        this.cryptoPriceUsd = quote.priceUsd();
        this.cryptoChange24h = quote.change24h();
        if (quote.change1m() != null) {
            this.cryptoChange1m = quote.change1m();
        }
        this.cryptoUpdatedAt = quote.updatedAt();
        this.marketUpdatedAt = quote.updatedAt();
    }

    public void clearCryptoPricing() {
        this.cryptoCoinId = null;
        this.cryptoSymbol = null;
        this.cryptoQuantity = null;
        this.cryptoPricePln = null;
        this.cryptoPriceUsd = null;
        this.cryptoChange24h = null;
        this.cryptoChange1m = null;
        this.cryptoUpdatedAt = null;
    }

    public void configureFxPricing(
            boolean enabled,
            CashCurrency currency,
            BigDecimal quantity,
            FxQuoteResponse quote
    ) {
        if (!enabled) {
            clearFxPricing();
            return;
        }

        this.fxPriced = true;
        this.marketPriced = false;
        clearStockPricing();
        this.cashCurrency = currency;
        this.cashQuantity = quantity;

        if (quote != null) {
            this.fxRatePln = quote.ratePln();
            this.fxChange24hPercent = quote.change24hPercent();
            this.fxChange1mPercent = quote.change1mPercent();
            this.fxEffectiveDate = quote.effectiveDate();
            this.fxUpdatedAt = quote.fetchedAt();
        }
    }

    public void applyFxValuation(BigDecimal value, FxQuoteResponse quote) {
        this.value = value;
        this.fxRatePln = quote.ratePln();
        this.fxChange24hPercent = quote.change24hPercent();
        this.fxChange1mPercent = quote.change1mPercent();
        this.fxEffectiveDate = quote.effectiveDate();
        this.fxUpdatedAt = quote.fetchedAt();
    }

    public void clearFxPricing() {
        this.fxPriced = false;
        this.cashCurrency = null;
        this.cashQuantity = null;
        this.fxRatePln = null;
        this.fxChange24hPercent = null;
        this.fxChange1mPercent = null;
        this.fxEffectiveDate = null;
        this.fxUpdatedAt = null;
    }

    public void configureStockPricing(
            boolean enabled,
            String symbol,
            CashCurrency currency,
            BigDecimal quantity,
            BigDecimal averageBuyPrice,
            BigDecimal buyFxRatePln,
            StockQuoteResponse quote,
            StockTaxValuationService.StockValuation valuation
    ) {
        if (!enabled) {
            clearStockPricing();
            return;
        }

        this.stockPriced = true;
        this.marketPriced = false;
        clearCryptoPricing();
        clearFxPricing();
        this.metalSymbol = null;
        this.metalQuantity = null;
        this.metalUnit = null;
        this.marketPriceUsd = null;
        this.usdPlnRate = null;

        this.stockSymbol = symbol;
        this.stockCurrency = currency;
        this.stockQuantity = quantity;
        this.stockAverageBuyPrice = averageBuyPrice;
        this.stockBuyFxRatePln = valuation != null ? valuation.buyFxRatePln() : buyFxRatePln;

        if (quote != null && valuation != null) {
            applyStockValuation(valuation.netValuePln(), quote, valuation);
        }
    }

    public void applyStockValuation(
            BigDecimal value,
            StockQuoteResponse quote,
            StockTaxValuationService.StockValuation valuation
    ) {
        this.value = value;
        this.stockCurrentPrice = quote.price();
        this.stockCurrentFxRatePln = quote.fxRatePln();
        this.stockGrossValuePln = valuation.grossValuePln();
        this.stockCostBasisPln = valuation.costBasisPln();
        this.stockUnrealizedGainPln = valuation.unrealizedGainPln();
        this.stockTaxRate = valuation.taxRate();
        this.stockTaxAmountPln = valuation.estimatedTaxPln();
        this.stockBuyFxRatePln = valuation.buyFxRatePln();
        this.stockChangePercent = quote.changePercent();
        this.stockChange24hPlnPercent = quote.change24hPlnPercent();
        this.stockChange1mPlnPercent = quote.change1mPlnPercent();
        this.stockMarketDate = quote.marketDate();
        this.stockMarketTime = quote.marketTime();
        this.stockUpdatedAt = quote.fetchedAt();
    }

    public void clearStockPricing() {
        this.stockPriced = false;
        this.stockSymbol = null;
        this.stockCurrency = null;
        this.stockQuantity = null;
        this.stockAverageBuyPrice = null;
        this.stockBuyFxRatePln = null;
        this.stockCurrentPrice = null;
        this.stockCurrentFxRatePln = null;
        this.stockGrossValuePln = null;
        this.stockCostBasisPln = null;
        this.stockUnrealizedGainPln = null;
        this.stockTaxRate = null;
        this.stockTaxAmountPln = null;
        this.stockChangePercent = null;
        this.stockChange24hPlnPercent = null;
        this.stockChange1mPlnPercent = null;
        this.stockMarketDate = null;
        this.stockMarketTime = null;
        this.stockUpdatedAt = null;
    }

    public void configureRealEstatePricing(
            boolean enabled,
            RealEstateType type,
            String city,
            String district,
            BigDecimal areaSqm,
            RealEstateValuationMode valuationMode,
            RealEstateMarketSegment marketSegment,
            BigDecimal purchasePrice,
            LocalDate purchaseDate,
            RealEstateQuoteResponse quote
    ) {
        this.marketPriced = enabled;

        if (enabled) {
            clearCryptoPricing();
            clearFxPricing();
            clearStockPricing();
            this.metalSymbol = null;
            this.metalQuantity = null;
            this.metalUnit = null;
            this.marketPriceUsd = null;
            this.usdPlnRate = null;
        }

        this.realEstateType = enabled ? type : null;
        this.realEstateCity = enabled ? city : null;
        this.realEstateDistrict = enabled && district != null && !district.isBlank() ? district.trim() : null;
        this.realEstateAreaSqm = enabled ? areaSqm : null;
        this.realEstateValuationMode = enabled
                ? (valuationMode == null ? RealEstateValuationMode.MARKET_MEDIAN : valuationMode)
                : null;
        this.realEstateMarketSegment = enabled
                ? (marketSegment == null ? RealEstateMarketSegment.ALL : marketSegment)
                : null;
        this.realEstatePurchasePrice = enabled
                && this.realEstateValuationMode == RealEstateValuationMode.MARKET_ANCHORED
                ? purchasePrice
                : null;
        this.realEstatePurchaseDate = enabled
                && this.realEstateValuationMode == RealEstateValuationMode.MARKET_ANCHORED
                ? purchaseDate
                : null;

        if (enabled && quote != null) {
            applyRealEstateValuation(quote);
        } else if (!enabled) {
            clearRealEstateValuation();
        }
    }

    public void applyRealEstateValuation(RealEstateQuoteResponse quote) {
        this.value = quote.estimatedValue();
        this.realEstateMedianPriceSqm = quote.medianPricePerSqm();
        this.realEstateEstimatedPriceSqm = quote.estimatedPricePerSqm();
        this.realEstateScope = quote.scope();
        this.realEstateResolvedArea = quote.resolvedArea();
        this.realEstateRecordCount = quote.recordCount();
        this.realEstatePeriodFrom = quote.periodFrom();
        this.realEstatePeriodTo = quote.periodTo();

        this.realEstateAnchorMedianPriceSqm = quote.anchorMedianPricePerSqm();
        this.realEstateQualityFactor = quote.qualityFactor();
        this.realEstateAnchorResolvedArea = quote.anchorResolvedArea();
        this.realEstateAnchorScope = quote.anchorScope();
        this.realEstateAnchorRecordCount = quote.anchorRecordCount();
        this.realEstateAnchorPeriodFrom = quote.anchorPeriodFrom();
        this.realEstateAnchorPeriodTo = quote.anchorPeriodTo();

        this.realEstateUpdatedAt = quote.fetchedAt();
        this.marketUpdatedAt = quote.fetchedAt();
    }

    private void clearRealEstateValuation() {
        this.realEstateType = null;
        this.realEstateCity = null;
        this.realEstateDistrict = null;
        this.realEstateAreaSqm = null;
        this.realEstateValuationMode = null;
        this.realEstateMarketSegment = null;
        this.realEstatePurchasePrice = null;
        this.realEstatePurchaseDate = null;
        this.realEstateMedianPriceSqm = null;
        this.realEstateEstimatedPriceSqm = null;
        this.realEstateScope = null;
        this.realEstateResolvedArea = null;
        this.realEstateRecordCount = null;
        this.realEstatePeriodFrom = null;
        this.realEstatePeriodTo = null;
        this.realEstateAnchorMedianPriceSqm = null;
        this.realEstateQualityFactor = null;
        this.realEstateAnchorResolvedArea = null;
        this.realEstateAnchorScope = null;
        this.realEstateAnchorRecordCount = null;
        this.realEstateAnchorPeriodFrom = null;
        this.realEstateAnchorPeriodTo = null;
        this.realEstateUpdatedAt = null;
    }


    public void configureRetailBondValuation(
            boolean enabled,
            BigDecimal purchaseValue,
            BigDecimal grossValue,
            BigDecimal taxableGain,
            BigDecimal taxRate,
            BigDecimal taxAmount
    ) {
        this.bondPurchaseValue = enabled ? purchaseValue : null;
        this.bondGrossValue = enabled ? grossValue : null;
        this.bondTaxableGain = enabled ? taxableGain : null;
        this.bondTaxRate = enabled ? taxRate : null;
        this.bondTaxAmount = enabled ? taxAmount : null;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public BigDecimal getValue() { return value; }
    public String getColor() { return color; }
    public AssetCategory getCategory() { return category; }
    public String getIconKey() { return iconKey; }
    public boolean isSystemCash() { return systemCash; }
    public Long getPortfolioId() { return portfolioId; }
    public boolean isMarketPriced() { return marketPriced; }
    public MetalSymbol getMetalSymbol() { return metalSymbol; }
    public BigDecimal getMetalQuantity() { return metalQuantity; }
    public MetalUnit getMetalUnit() { return metalUnit; }
    public BigDecimal getMarketPriceUsd() { return marketPriceUsd; }
    public BigDecimal getUsdPlnRate() { return usdPlnRate; }
    public Instant getMarketUpdatedAt() { return marketUpdatedAt; }
    public RealEstateType getRealEstateType() { return realEstateType; }
    public String getRealEstateCity() { return realEstateCity; }
    public String getRealEstateDistrict() { return realEstateDistrict; }
    public BigDecimal getRealEstateAreaSqm() { return realEstateAreaSqm; }
    public RealEstateValuationMode getRealEstateValuationMode() { return realEstateValuationMode; }
    public RealEstateMarketSegment getRealEstateMarketSegment() { return realEstateMarketSegment; }
    public BigDecimal getRealEstatePurchasePrice() { return realEstatePurchasePrice; }
    public LocalDate getRealEstatePurchaseDate() { return realEstatePurchaseDate; }
    public BigDecimal getRealEstateMedianPriceSqm() { return realEstateMedianPriceSqm; }
    public BigDecimal getRealEstateEstimatedPriceSqm() { return realEstateEstimatedPriceSqm; }
    public String getRealEstateScope() { return realEstateScope; }
    public String getRealEstateResolvedArea() { return realEstateResolvedArea; }
    public Integer getRealEstateRecordCount() { return realEstateRecordCount; }
    public LocalDate getRealEstatePeriodFrom() { return realEstatePeriodFrom; }
    public LocalDate getRealEstatePeriodTo() { return realEstatePeriodTo; }
    public BigDecimal getRealEstateAnchorMedianPriceSqm() { return realEstateAnchorMedianPriceSqm; }
    public BigDecimal getRealEstateQualityFactor() { return realEstateQualityFactor; }
    public String getRealEstateAnchorResolvedArea() { return realEstateAnchorResolvedArea; }
    public String getRealEstateAnchorScope() { return realEstateAnchorScope; }
    public Integer getRealEstateAnchorRecordCount() { return realEstateAnchorRecordCount; }
    public LocalDate getRealEstateAnchorPeriodFrom() { return realEstateAnchorPeriodFrom; }
    public LocalDate getRealEstateAnchorPeriodTo() { return realEstateAnchorPeriodTo; }
    public Instant getRealEstateUpdatedAt() { return realEstateUpdatedAt; }

    public String getCryptoCoinId() { return cryptoCoinId; }
    public String getCryptoSymbol() { return cryptoSymbol; }
    public BigDecimal getCryptoQuantity() { return cryptoQuantity; }
    public BigDecimal getCryptoPricePln() { return cryptoPricePln; }
    public BigDecimal getCryptoPriceUsd() { return cryptoPriceUsd; }
    public BigDecimal getCryptoChange24h() { return cryptoChange24h; }
    public BigDecimal getCryptoChange1m() { return cryptoChange1m; }
    public Instant getCryptoUpdatedAt() { return cryptoUpdatedAt; }

    public boolean isFxPriced() { return fxPriced; }
    public CashCurrency getCashCurrency() { return cashCurrency; }
    public BigDecimal getCashQuantity() { return cashQuantity; }
    public BigDecimal getFxRatePln() { return fxRatePln; }
    public BigDecimal getFxChange24hPercent() { return fxChange24hPercent; }
    public BigDecimal getFxChange1mPercent() { return fxChange1mPercent; }
    public LocalDate getFxEffectiveDate() { return fxEffectiveDate; }
    public Instant getFxUpdatedAt() { return fxUpdatedAt; }

    public boolean isStockPriced() { return stockPriced; }
    public String getStockSymbol() { return stockSymbol; }
    public CashCurrency getStockCurrency() { return stockCurrency; }
    public BigDecimal getStockQuantity() { return stockQuantity; }
    public BigDecimal getStockAverageBuyPrice() { return stockAverageBuyPrice; }
    public BigDecimal getStockBuyFxRatePln() { return stockBuyFxRatePln; }
    public BigDecimal getStockCurrentPrice() { return stockCurrentPrice; }
    public BigDecimal getStockCurrentFxRatePln() { return stockCurrentFxRatePln; }
    public BigDecimal getStockGrossValuePln() { return stockGrossValuePln; }
    public BigDecimal getStockCostBasisPln() { return stockCostBasisPln; }
    public BigDecimal getStockUnrealizedGainPln() { return stockUnrealizedGainPln; }
    public BigDecimal getStockTaxRate() { return stockTaxRate; }
    public BigDecimal getStockTaxAmountPln() { return stockTaxAmountPln; }
    public BigDecimal getStockChangePercent() { return stockChangePercent; }
    public BigDecimal getStockChange24hPlnPercent() { return stockChange24hPlnPercent; }
    public BigDecimal getStockChange1mPlnPercent() { return stockChange1mPlnPercent; }
    public LocalDate getStockMarketDate() { return stockMarketDate; }
    public String getStockMarketTime() { return stockMarketTime; }
    public Instant getStockUpdatedAt() { return stockUpdatedAt; }

    public BigDecimal getBondPurchaseValue() { return bondPurchaseValue; }
    public BigDecimal getBondGrossValue() { return bondGrossValue; }
    public BigDecimal getBondTaxableGain() { return bondTaxableGain; }
    public BigDecimal getBondTaxRate() { return bondTaxRate; }
    public BigDecimal getBondTaxAmount() { return bondTaxAmount; }
}
