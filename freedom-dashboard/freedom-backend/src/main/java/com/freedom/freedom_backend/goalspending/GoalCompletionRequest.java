package com.freedom.freedom_backend.goalspending;

import jakarta.validation.constraints.NotNull;

public record GoalCompletionRequest(
        @NotNull GoalCompletionMode mode,
        Long targetGoalId
) {
}
