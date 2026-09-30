package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.AssetResponse;
import com.freedom.freedom_backend.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/market/metals")
public class MetalMarketController {
    private final MetalPricingService pricingService;
    private final MetalAssetRefreshService refreshService;

    public MetalMarketController(MetalPricingService pricingService, MetalAssetRefreshService refreshService) {
        this.pricingService = pricingService;
        this.refreshService = refreshService;
    }

    @GetMapping("/quotes")
    public List<MetalQuoteResponse> quotes() {
        return pricingService.quoteAll();
    }

    @PostMapping("/refresh")
    public List<AssetResponse> refresh(@AuthenticationPrincipal User currentUser) {
        return refreshService.refresh(currentUser);
    }
}
