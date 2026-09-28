package com.freedom.freedom_backend.asset;

import java.math.BigDecimal;

public record AssetResponse(
        Long id,
        String name,
        BigDecimal value,
        String color,
        AssetCategory category,
        String iconKey
) {
    public static AssetResponse from(Asset asset) {
        return new AssetResponse(
                asset.getId(),
                asset.getName(),
                asset.getValue(),
                asset.getColor(),
                asset.getCategory(),
                asset.getIconKey()
        );
    }
}
