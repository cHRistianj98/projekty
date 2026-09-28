package com.freedom.freedom_backend.transaction;

import com.freedom.freedom_backend.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService service;

    public TransactionController(
            TransactionService service
    ) {
        this.service = service;
    }

    @GetMapping
    public List<TransactionResponse> getAll(
            @AuthenticationPrincipal User user
    ) {
        return service.getAll(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse create(
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal User user
    ) {
        return service.create(request, user);
    }

    @PutMapping("/{id}")
    public TransactionResponse update(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal User user
    ) {
        return service.update(id, request, user);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        service.delete(id, user);
    }
}