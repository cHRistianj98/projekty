package com.freedom.freedom_backend.liabilityallocation;

import java.math.BigDecimal;

public record LiabilityAllocationItemResponse(
        Long id,
        Long liabilityId,
        Long assetId,
        String assetName,
        BigDecimal amount,
        String sourceType,
        Long portfolioId,
        String portfolioName
) {}
