package com.freedom.freedom_backend.asset;

import java.math.BigDecimal;
import java.util.List;

public record CashReconciliationResponse(
        List<CashReconciliationAssetResponse> assets,
        BigDecimal previousTotal,
        BigDecimal currentTotal,
        BigDecimal adjustment
) {}
