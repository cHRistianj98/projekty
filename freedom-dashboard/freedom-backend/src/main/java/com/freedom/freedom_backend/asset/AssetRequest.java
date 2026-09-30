package com.freedom.freedom_backend.asset;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssetRequest(
        @NotBlank String name,
        @NotNull @DecimalMin("0.0") BigDecimal value,
        @NotBlank String color,
        AssetCategory category,
        String iconKey,
        Long portfolioId,
        Boolean marketPriced,
        MetalSymbol metalSymbol,
        @DecimalMin(value = "0.000001", inclusive = true) BigDecimal metalQuantity,
        MetalUnit metalUnit,
        RealEstateType realEstateType,
        String realEstateCity,
        String realEstateDistrict,
        @DecimalMin(value = "1.0", inclusive = true) BigDecimal realEstateAreaSqm,
        RealEstateValuationMode realEstateValuationMode,
        RealEstateMarketSegment realEstateMarketSegment,
        @DecimalMin(value = "0.01", inclusive = true) BigDecimal realEstatePurchasePrice,
        LocalDate realEstatePurchaseDate,
        @DecimalMin(value = "0.01", inclusive = true) BigDecimal bondPurchaseValue,
        @DecimalMin(value = "0.0", inclusive = true) BigDecimal bondGrossValue
) {}
