package com.freedom.freedom_backend.liabilityallocation;

import com.freedom.freedom_backend.user.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
public class LiabilityAllocationController {
    private final LiabilityAllocationService service;

    public LiabilityAllocationController(LiabilityAllocationService service) {
        this.service = service;
    }

    @GetMapping("/api/liabilities/{liabilityId}/allocations")
    public LiabilityAllocationSummaryResponse summary(
            @PathVariable Long liabilityId,
            @AuthenticationPrincipal User user
    ) {
        return service.getSummary(liabilityId, user);
    }

    @PostMapping("/api/liabilities/{liabilityId}/allocations")
    public LiabilityAllocationSummaryResponse allocate(
            @PathVariable Long liabilityId,
            @Valid @RequestBody LiabilityAllocationRequest request,
            @AuthenticationPrincipal User user
    ) {
        return service.allocate(liabilityId, request, user);
    }


    @PostMapping("/api/liabilities/{liabilityId}/portfolio-allocation")
    public LiabilityAllocationSummaryResponse assignPortfolio(
            @PathVariable Long liabilityId,
            @Valid @RequestBody LiabilityPortfolioAllocationRequest request,
            @AuthenticationPrincipal User user
    ) {
        return service.assignPortfolio(liabilityId, request, user);
    }

    @DeleteMapping("/api/liabilities/{liabilityId}/portfolio-allocation/{portfolioId}")
    public LiabilityAllocationSummaryResponse releasePortfolio(
            @PathVariable Long liabilityId,
            @PathVariable Long portfolioId,
            @AuthenticationPrincipal User user
    ) {
        return service.releasePortfolio(liabilityId, portfolioId, user);
    }

    @DeleteMapping("/api/liabilities/{liabilityId}/allocations/{assetId}")
    public LiabilityAllocationSummaryResponse release(
            @PathVariable Long liabilityId,
            @PathVariable Long assetId,
            @RequestParam BigDecimal amount,
            @AuthenticationPrincipal User user
    ) {
        return service.release(liabilityId, assetId, amount, user);
    }

    @GetMapping("/api/liability-allocations/overview")
    public LiabilityAllocationOverviewResponse overview(@AuthenticationPrincipal User user) {
        return service.getOverview(user);
    }
}
