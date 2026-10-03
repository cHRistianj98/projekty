package com.freedom.freedom_backend.goalspending;

import com.freedom.freedom_backend.user.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalSpendingController {

    private final GoalSpendingService service;

    public GoalSpendingController(GoalSpendingService service) {
        this.service = service;
    }

    @GetMapping("/spendable")
    public List<SpendableGoalResponse> spendable(
            @RequestParam Long assetId,
            @RequestParam(required = false) Long transactionId,
            @AuthenticationPrincipal User user
    ) {
        return service.getSpendableGoals(assetId, transactionId, user);
    }

    @PostMapping("/{goalId}/complete")
    public GoalCompletionResponse complete(
            @PathVariable Long goalId,
            @Valid @RequestBody GoalCompletionRequest request,
            @AuthenticationPrincipal User user
    ) {
        return service.completeGoal(goalId, request, user);
    }

    @PostMapping("/{goalId}/undo-completion")
    public void undoCompletion(
            @PathVariable Long goalId,
            @AuthenticationPrincipal User user
    ) {
        service.undoCompletion(goalId, user);
    }
}
