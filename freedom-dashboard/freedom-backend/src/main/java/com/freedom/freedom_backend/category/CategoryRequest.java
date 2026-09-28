package com.freedom.freedom_backend.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CategoryRequest(
        @NotNull CategoryType type,
        @NotNull CategoryGroup group,
        @NotBlank String name,
        @NotBlank String iconKey,
        @NotBlank String color,
        Boolean active,
        Integer sortOrder
) {}
