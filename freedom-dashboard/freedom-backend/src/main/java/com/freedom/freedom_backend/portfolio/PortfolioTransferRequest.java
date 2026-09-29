package com.freedom.freedom_backend.portfolio;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
public record PortfolioTransferRequest(@NotNull Long sourceAssetId,@NotNull Long targetAssetId,@NotNull @DecimalMin("0.01") BigDecimal amount) {}
