package com.freedom.freedom_backend.asset;

import com.freedom.freedom_backend.user.User;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    private final AssetService assetService;

    public AssetController(
            AssetService assetService
    ) {
        this.assetService = assetService;
    }

    @GetMapping
    public List<AssetResponse> getAllAssets(
            @AuthenticationPrincipal
            User currentUser
    ) {
        return assetService.getAllAssets(
                currentUser
        );
    }

    @GetMapping("/{id}")
    public AssetResponse getAsset(
            @PathVariable Long id,

            @AuthenticationPrincipal
            User currentUser
    ) {
        return assetService.getAsset(
                id,
                currentUser
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssetResponse createAsset(
            @Valid
            @RequestBody
            AssetRequest request,

            @AuthenticationPrincipal
            User currentUser
    ) {
        return assetService.createAsset(
                request,
                currentUser
        );
    }

    @PutMapping("/{id}")
    public AssetResponse updateAsset(
            @PathVariable Long id,

            @Valid
            @RequestBody
            AssetRequest request,

            @AuthenticationPrincipal
            User currentUser
    ) {
        return assetService.updateAsset(
                id,
                request,
                currentUser
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAsset(
            @PathVariable Long id,

            @AuthenticationPrincipal
            User currentUser
    ) {
        assetService.deleteAsset(
                id,
                currentUser
        );
    }
}