package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.CashCurrency;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record FxQuoteResponse(
        CashCurrency currency,
        String currencyName,
        BigDecimal ratePln,
        LocalDate effectiveDate,
        String tableNo,
        Instant fetchedAt,
        String source
) {}
