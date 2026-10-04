package com.freedom.freedom_backend.goalallocation;

import jakarta.validation.constraints.NotNull;

public record GoalPortfolioAllocationRequest(
        @NotNull Long portfolioId
) {}
