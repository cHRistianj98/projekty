package com.freedom.freedom_backend.recurring;

import com.freedom.freedom_backend.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-transactions")
public class RecurringTransactionController {

    private final RecurringTransactionService service;

    public RecurringTransactionController(
            RecurringTransactionService service
    ) {
        this.service = service;
    }

    @GetMapping
    public List<RecurringTransactionResponse> getAll(
            @AuthenticationPrincipal User user
    ) {
        return service.getAll(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecurringTransactionResponse create(
            @Valid
            @RequestBody
            RecurringTransactionRequest request,

            @AuthenticationPrincipal
            User user
    ) {
        return service.create(request, user);
    }

    @PutMapping("/{id}")
    public RecurringTransactionResponse update(
            @PathVariable Long id,

            @Valid
            @RequestBody
            RecurringTransactionRequest request,

            @AuthenticationPrincipal
            User user
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