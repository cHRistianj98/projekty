package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.CashCurrency;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record StockQuoteResponse(
        String symbol,
        String name,
        BigDecimal price,
        CashCurrency currency,
        BigDecimal fxRatePln,
        BigDecimal pricePln,
        BigDecimal previousClose,
        BigDecimal changePercent,
        BigDecimal previousClosePln,
        BigDecimal monthBasePrice,
        BigDecimal monthBasePricePln,
        BigDecimal change24hPlnPercent,
        BigDecimal change1mPlnPercent,
        LocalDate marketDate,
        String marketTime,
        Instant fetchedAt,
        String source
) {}
