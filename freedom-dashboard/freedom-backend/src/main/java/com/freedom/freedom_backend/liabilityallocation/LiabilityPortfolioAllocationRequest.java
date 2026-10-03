package com.freedom.freedom_backend.liabilityallocation;

import jakarta.validation.constraints.NotNull;

public record LiabilityPortfolioAllocationRequest(
        @NotNull Long portfolioId
) {}
