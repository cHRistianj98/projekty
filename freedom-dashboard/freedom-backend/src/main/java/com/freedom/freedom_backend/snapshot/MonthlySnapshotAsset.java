package com.freedom.freedom_backend.snapshot;

import com.freedom.freedom_backend.asset.AssetCategory;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "monthly_snapshot_assets")
public class MonthlySnapshotAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_asset_id", nullable = false)
    private Long sourceAssetId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal value;

    @Enumerated(EnumType.STRING)
    private AssetCategory category;

    protected MonthlySnapshotAsset() {}

    public MonthlySnapshotAsset(
            Long sourceAssetId,
            String name,
            BigDecimal value,
            AssetCategory category
    ) {
        this.sourceAssetId = sourceAssetId;
        this.name = name;
        this.value = value;
        this.category = category;
    }

    public Long getSourceAssetId() { return sourceAssetId; }
    public String getName() { return name; }
    public BigDecimal getValue() { return value; }
    public AssetCategory getCategory() { return category; }
}