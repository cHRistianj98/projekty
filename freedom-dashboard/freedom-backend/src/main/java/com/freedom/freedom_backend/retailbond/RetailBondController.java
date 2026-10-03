package com.freedom.freedom_backend.retailbond;

import com.freedom.freedom_backend.user.User;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/retail-bonds")
public class RetailBondController {
    private final RetailBondService service;

    public RetailBondController(RetailBondService service) {
        this.service = service;
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RetailBondPortfolioResponse importRegister(
            @RequestParam Long portfolioId,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        return service.importRegister(portfolioId, file, user);
    }

    @GetMapping("/assets/{assetId}")
    public RetailBondPortfolioResponse getPortfolio(@PathVariable Long assetId, @AuthenticationPrincipal User user) {
        return service.getPortfolio(assetId, user);
    }

    @PostMapping("/portfolios/{portfolioId}/positions")
    public RetailBondPortfolioResponse addPositionToPortfolio(
            @PathVariable Long portfolioId,
            @Valid @RequestBody RetailBondPositionRequest request,
            @AuthenticationPrincipal User user
    ) {
        return service.addPositionToPortfolio(portfolioId, request, user);
    }

    @PostMapping("/assets/{assetId}/positions")
    public RetailBondPortfolioResponse addPosition(
            @PathVariable Long assetId,
            @Valid @RequestBody RetailBondPositionRequest request,
            @AuthenticationPrincipal User user
    ) {
        return service.addPosition(assetId, request, user);
    }

    @DeleteMapping("/assets/{assetId}/positions/{positionId}")
    public RetailBondPortfolioResponse deletePosition(
            @PathVariable Long assetId,
            @PathVariable Long positionId,
            @AuthenticationPrincipal User user
    ) {
        service.deletePosition(assetId, positionId, user);
        return service.getPortfolio(assetId, user);
    }

    @PostMapping("/assets/{assetId}/refresh")
    public RetailBondPortfolioResponse refresh(@PathVariable Long assetId, @AuthenticationPrincipal User user) {
        return service.refresh(assetId, user);
    }
}
