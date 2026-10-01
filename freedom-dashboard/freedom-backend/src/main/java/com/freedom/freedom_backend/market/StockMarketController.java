package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.AssetResponse;
import com.freedom.freedom_backend.asset.CashCurrency;
import com.freedom.freedom_backend.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/market/stocks")
public class StockMarketController {
    private final StockPricingService pricingService;
    private final StockAssetRefreshService refreshService;

    public StockMarketController(
            StockPricingService pricingService,
            StockAssetRefreshService refreshService
    ) {
        this.pricingService = pricingService;
        this.refreshService = refreshService;
    }

    @GetMapping("/quote")
    public StockQuoteResponse quote(
            @RequestParam String symbol,
            @RequestParam(required = false) CashCurrency currency
    ) {
        return pricingService.quote(symbol, currency);
    }

    @PostMapping("/refresh")
    public List<AssetResponse> refresh(@AuthenticationPrincipal User currentUser) {
        return refreshService.refresh(currentUser);
    }
}
