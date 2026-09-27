package com.freedom.freedom_backend.goal;

import com.freedom.freedom_backend.user.User;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(
            GoalService goalService
    ) {
        this.goalService =
                goalService;
    }

    @GetMapping
    public List<GoalResponse> getAllGoals(
            @AuthenticationPrincipal
            User currentUser
    ) {
        return goalService.getAllGoals(
                currentUser
        );
    }

    @GetMapping("/{id}")
    public GoalResponse getGoal(
            @PathVariable Long id,

            @AuthenticationPrincipal
            User currentUser
    ) {
        return goalService.getGoal(
                id,
                currentUser
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalResponse createGoal(
            @Valid
            @RequestBody
            GoalRequest request,

            @AuthenticationPrincipal
            User currentUser
    ) {
        return goalService.createGoal(
                request,
                currentUser
        );
    }

    @PutMapping("/{id}")
    public GoalResponse updateGoal(
            @PathVariable Long id,

            @Valid
            @RequestBody
            GoalRequest request,

            @AuthenticationPrincipal
            User currentUser
    ) {
        return goalService.updateGoal(
                id,
                request,
                currentUser
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGoal(
            @PathVariable Long id,

            @AuthenticationPrincipal
            User currentUser
    ) {
        goalService.deleteGoal(
                id,
                currentUser
        );
    }
}