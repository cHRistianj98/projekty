package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.AssetResponse;
import com.freedom.freedom_backend.asset.RealEstateMarketSegment;
import com.freedom.freedom_backend.asset.RealEstateValuationMode;
import com.freedom.freedom_backend.user.User;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/market/real-estate")
public class RealEstateMarketController {
    private final RealEstatePricingService pricingService;
    private final RealEstateAssetRefreshService refreshService;

    public RealEstateMarketController(
            RealEstatePricingService pricingService,
            RealEstateAssetRefreshService refreshService
    ) {
        this.pricingService = pricingService;
        this.refreshService = refreshService;
    }

    @GetMapping("/quote")
    public RealEstateQuoteResponse quote(
            @RequestParam String city,
            @RequestParam(required = false, defaultValue = "") String district,
            @RequestParam BigDecimal areaSqm,
            @RequestParam(required = false, defaultValue = "ALL") RealEstateMarketSegment marketSegment,
            @RequestParam(required = false, defaultValue = "MARKET_MEDIAN") RealEstateValuationMode valuationMode,
            @RequestParam(required = false) BigDecimal purchasePrice,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate purchaseDate
    ) {
        return pricingService.quoteApartment(
                city,
                district,
                areaSqm,
                marketSegment,
                valuationMode,
                purchasePrice,
                purchaseDate
        );
    }

    @PostMapping("/refresh")
    public List<AssetResponse> refresh(@AuthenticationPrincipal User currentUser) {
        return refreshService.refresh(currentUser);
    }
}
