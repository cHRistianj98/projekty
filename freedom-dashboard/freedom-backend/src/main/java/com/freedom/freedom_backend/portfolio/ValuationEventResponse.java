package com.freedom.freedom_backend.portfolio;
import java.math.BigDecimal;
import java.time.Instant;
public record ValuationEventResponse(Long id,Long assetId,String assetName,BigDecimal previousValue,BigDecimal newValue,BigDecimal delta,String reason,Instant createdAt) {}
