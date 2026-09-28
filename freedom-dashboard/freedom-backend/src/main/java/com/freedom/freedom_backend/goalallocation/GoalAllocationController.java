package com.freedom.freedom_backend.goalallocation;

import com.freedom.freedom_backend.user.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals/{goalId}/allocations")
public class GoalAllocationController {

    private final GoalAllocationService service;

    public GoalAllocationController(
            GoalAllocationService service
    ) {
        this.service = service;
    }

    @GetMapping
    public GoalAllocationSummaryResponse getSummary(
            @PathVariable Long goalId,
            @AuthenticationPrincipal User currentUser
    ) {
        return service.getSummary(
                goalId,
                currentUser
        );
    }

    @PostMapping
    public GoalAllocationSummaryResponse allocate(
            @PathVariable Long goalId,
            @Valid @RequestBody GoalAllocationRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return service.allocate(
                goalId,
                request,
                currentUser
        );
    }
}
