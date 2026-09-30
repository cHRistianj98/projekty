package com.freedom.freedom_backend.liabilityallocation;

import java.math.BigDecimal;
import java.util.List;

public record LiabilityAllocationSummaryResponse(
        Long liabilityId,
        BigDecimal bankRemainingAmount,
        BigDecimal allocatedAmount,
        BigDecimal effectiveRemainingAmount,
        List<LiabilityAllocationItemResponse> allocations
) {}
