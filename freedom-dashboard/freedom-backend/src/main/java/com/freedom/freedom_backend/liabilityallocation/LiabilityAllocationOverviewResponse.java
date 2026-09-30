package com.freedom.freedom_backend.liabilityallocation;

import java.math.BigDecimal;
import java.util.List;

public record LiabilityAllocationOverviewResponse(
        BigDecimal totalAllocated,
        List<LiabilityPortfolioAllocationResponse> allocations
) {}
