package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.CashCurrency;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record FxQuoteResponse(
        CashCurrency currency,
        String currencyName,
        BigDecimal ratePln,
        BigDecimal change24hPercent,
        BigDecimal change1mPercent,
        LocalDate effectiveDate,
        String tableNo,
        Instant fetchedAt,
        String source,
        String provider,
        String symbol,
        Instant quotedAt,
        boolean intraday,
        boolean fallback
) {}
