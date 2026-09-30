package com.freedom.freedom_backend.asset;

import com.freedom.freedom_backend.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

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
}
