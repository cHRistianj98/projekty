package com.freedom.freedom_backend.budget;

import com.freedom.freedom_backend.user.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budget-plans")
public class BudgetPlanController {

    private final BudgetPlanService service;

    public BudgetPlanController(
            BudgetPlanService service
    ) {
        this.service = service;
    }

    @GetMapping
    public List<BudgetPlanResponse> getAll(
            @AuthenticationPrincipal
            User user
    ) {
        return service.getAll(user);
    }

    @PutMapping
    public BudgetPlanResponse save(
            @Valid
            @RequestBody
            BudgetPlanRequest request,

            @AuthenticationPrincipal
            User user
    ) {
        return service.save(request, user);
    }
}