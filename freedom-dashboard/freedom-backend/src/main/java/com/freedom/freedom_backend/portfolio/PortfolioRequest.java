package com.freedom.freedom_backend.portfolio;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record PortfolioRequest(
        @NotBlank @Size(max = 120) String name,
        @Pattern(regexp = "#[0-9a-fA-F]{6}") String color,
        @Size(max = 40) String iconKey,
        @DecimalMin("0.01") @Digits(integer = 17, fraction = 2) BigDecimal targetAmount,
        @DecimalMin("0.00") @Digits(integer = 17, fraction = 2) BigDecimal monthlyContribution,
        @Size(max = 1000) String imageUrl,
        PortfolioImagePosition imagePosition
) {}
