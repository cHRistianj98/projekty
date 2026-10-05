package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.AssetResponse;
import com.freedom.freedom_backend.asset.CashCurrency;
import com.freedom.freedom_backend.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/market/fx")
public class FxMarketController {
    private final FxPricingService pricingService;
    private final FxCashAssetRefreshService refreshService;

    public FxMarketController(
            FxPricingService pricingService,
            FxCashAssetRefreshService refreshService
    ) {
        this.pricingService = pricingService;
        this.refreshService = refreshService;
    }

    @GetMapping("/quote")
    public FxQuoteResponse quote(
            @RequestParam CashCurrency currency,
            @RequestParam(defaultValue = "false") boolean fresh
    ) {
        return fresh ? pricingService.quoteFresh(currency) : pricingService.quote(currency);
    }

    @GetMapping("/quotes")
    public List<FxQuoteResponse> quotes() {
        return pricingService.supportedQuotes();
    }

    @PostMapping("/refresh")
    public List<AssetResponse> refresh(@AuthenticationPrincipal User currentUser) {
        return refreshService.refresh(currentUser);
    }
}
