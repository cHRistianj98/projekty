package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.AssetResponse;
import com.freedom.freedom_backend.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/market/crypto")
public class CryptoMarketController {
    private final CryptoPricingService pricingService;
    private final CryptoAssetRefreshService refreshService;

    public CryptoMarketController(
            CryptoPricingService pricingService,
            CryptoAssetRefreshService refreshService
    ) {
        this.pricingService = pricingService;
        this.refreshService = refreshService;
    }

    @GetMapping("/quote")
    public CryptoQuoteResponse quote(
            @RequestParam String coinId,
            @RequestParam(required = false) String symbol,
            @RequestParam(required = false) String name
    ) {
        return pricingService.quote(coinId, symbol, name);
    }

    @GetMapping("/search")
    public List<CryptoSearchResult> search(@RequestParam("q") String query) {
        return pricingService.search(query);
    }

    @PostMapping("/refresh")
    public List<AssetResponse> refresh(@AuthenticationPrincipal User currentUser) {
        return refreshService.refresh(currentUser);
    }
}
