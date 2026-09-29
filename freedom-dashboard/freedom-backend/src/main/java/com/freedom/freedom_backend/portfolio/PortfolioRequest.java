package com.freedom.freedom_backend.portfolio;
import jakarta.validation.constraints.NotBlank;
public record PortfolioRequest(@NotBlank String name, String color, String iconKey) {}
