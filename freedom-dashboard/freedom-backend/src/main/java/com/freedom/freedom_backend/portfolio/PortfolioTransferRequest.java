package com.freedom.freedom_backend.portfolio;

import com.freedom.freedom_backend.asset.AssetPurchaseTargetRequest;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PortfolioTransferRequest(
        @NotNull Long sourceAssetId,
        Long targetAssetId,
        Long targetPortfolioId,
        AssetPurchaseTargetRequest newTarget,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @DecimalMin(value = "0.000000000001", inclusive = true) BigDecimal acquiredQuantity,
        @DecimalMin(value = "0.00", inclusive = true) BigDecimal fee
) {
    public BigDecimal normalizedFee() {
        return fee == null ? BigDecimal.ZERO : fee;
    }

    public boolean isPurchase() {
        return acquiredQuantity != null;
    }
}
