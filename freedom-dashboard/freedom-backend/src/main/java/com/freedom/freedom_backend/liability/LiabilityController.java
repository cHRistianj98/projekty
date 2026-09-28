package com.freedom.freedom_backend.liability;

import com.freedom.freedom_backend.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/liabilities")
public class LiabilityController {

    private final LiabilityService liabilityService;

    public LiabilityController(
            LiabilityService liabilityService
    ) {
        this.liabilityService =
                liabilityService;
    }

    @GetMapping
    public List<LiabilityResponse> getAllLiabilities(
            @AuthenticationPrincipal
            User currentUser
    ) {
        return liabilityService
                .getAllLiabilities(
                        currentUser
                );
    }

    @GetMapping("/{id}")
    public LiabilityResponse getLiability(
            @PathVariable Long id,

            @AuthenticationPrincipal
            User currentUser
    ) {
        return liabilityService
                .getLiability(
                        id,
                        currentUser
                );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LiabilityResponse createLiability(
            @Valid
            @RequestBody
            LiabilityRequest request,

            @AuthenticationPrincipal
            User currentUser
    ) {
        return liabilityService
                .createLiability(
                        request,
                        currentUser
                );
    }

    @PutMapping("/{id}")
    public LiabilityResponse updateLiability(
            @PathVariable Long id,

            @Valid
            @RequestBody
            LiabilityRequest request,

            @AuthenticationPrincipal
            User currentUser
    ) {
        return liabilityService
                .updateLiability(
                        id,
                        request,
                        currentUser
                );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLiability(
            @PathVariable Long id,

            @AuthenticationPrincipal
            User currentUser
    ) {
        liabilityService.deleteLiability(
                id,
                currentUser
        );
    }
}