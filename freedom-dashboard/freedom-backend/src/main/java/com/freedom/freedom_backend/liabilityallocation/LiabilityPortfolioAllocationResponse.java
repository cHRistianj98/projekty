package com.freedom.freedom_backend.liabilityallocation;

import java.math.BigDecimal;

public record LiabilityPortfolioAllocationResponse(
        Long liabilityId,
        String liabilityName,
        String liabilityImageUrl,
        String liabilityImagePosition,
        BigDecimal originalAmount,
        BigDecimal bankRemainingAmount,
        Long assetId,
        String assetName,
        BigDecimal amount
) {}
