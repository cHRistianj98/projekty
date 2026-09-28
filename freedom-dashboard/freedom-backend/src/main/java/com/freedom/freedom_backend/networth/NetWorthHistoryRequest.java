package com.freedom.freedom_backend.networth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record NetWorthHistoryRequest(
        @NotBlank String month,
        @NotNull BigDecimal value
) {}