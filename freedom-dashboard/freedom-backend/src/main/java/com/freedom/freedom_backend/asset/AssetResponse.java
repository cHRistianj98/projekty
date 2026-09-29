package com.freedom.freedom_backend.asset;
import java.math.BigDecimal;
public record AssetResponse(Long id,String name,BigDecimal value,String color,AssetCategory category,String iconKey,boolean systemCash,Long portfolioId){
 public static AssetResponse from(Asset a){return new AssetResponse(a.getId(),a.getName(),a.getValue(),a.getColor(),a.getCategory(),a.getIconKey(),a.isSystemCash(),a.getPortfolioId());}
}
