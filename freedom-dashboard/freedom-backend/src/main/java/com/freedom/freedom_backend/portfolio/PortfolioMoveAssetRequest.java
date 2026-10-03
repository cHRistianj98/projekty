package com.freedom.freedom_backend.portfolio;

import jakarta.validation.constraints.NotNull;

public record PortfolioMoveAssetRequest(
        @NotNull Long assetId,
        @NotNull Long targetPortfolioId
) {}
