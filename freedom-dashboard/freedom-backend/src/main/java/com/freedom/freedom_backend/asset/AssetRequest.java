package com.freedom.freedom_backend.asset;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record AssetRequest(@NotBlank String name,@NotNull @DecimalMin("0.0") BigDecimal value,@NotBlank String color,AssetCategory category,String iconKey,Long portfolioId){}
