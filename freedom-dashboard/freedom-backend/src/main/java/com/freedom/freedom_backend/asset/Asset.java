package com.freedom.freedom_backend.asset;

import com.freedom.freedom_backend.user.User;
import com.freedom.freedom_backend.market.RealEstateQuoteResponse;
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
}
