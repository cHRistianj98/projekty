package com.freedom.freedom_backend.budget;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record BudgetPlanRequest(

        @NotBlank
        String month,

        @NotNull
        List<@Valid BudgetLimitRequest> limits

) {}