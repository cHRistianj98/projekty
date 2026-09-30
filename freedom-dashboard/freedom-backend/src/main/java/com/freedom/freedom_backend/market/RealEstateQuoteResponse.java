package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.RealEstateMarketSegment;
import com.freedom.freedom_backend.asset.RealEstateValuationMode;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record RealEstateQuoteResponse(
        String city,
        String requestedDistrict,
        String resolvedArea,
        String scope,
        BigDecimal medianPricePerSqm,
        BigDecimal areaSqm,
        BigDecimal estimatedValue,
        BigDecimal estimatedPricePerSqm,
        Integer recordCount,
        LocalDate periodFrom,
        LocalDate periodTo,
        RealEstateValuationMode valuationMode,
        RealEstateMarketSegment marketSegment,
        RealEstateMarketSegment dataMarketSegment,
        BigDecimal purchasePrice,
        LocalDate purchaseDate,
        BigDecimal anchorMedianPricePerSqm,
        BigDecimal qualityFactor,
        String anchorResolvedArea,
        String anchorScope,
        RealEstateMarketSegment anchorMarketSegment,
        Integer anchorRecordCount,
        LocalDate anchorPeriodFrom,
        LocalDate anchorPeriodTo,
        String source,
        String citation,
        Instant fetchedAt
) {}
