package com.freedom.freedom_backend.retailbond;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RetailBondQuantityRequest(
        @NotNull @Min(1) Integer quantity
) {}
