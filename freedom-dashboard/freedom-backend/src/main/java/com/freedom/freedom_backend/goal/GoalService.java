package com.freedom.freedom_backend.goal;

import com.freedom.freedom_backend.user.User;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GoalService {

    private final GoalRepository goalRepository;

    public GoalService(
            GoalRepository goalRepository
    ) {
        this.goalRepository =
                goalRepository;
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getAllGoals(
            User currentUser
    ) {
        return goalRepository
                .findAllByUserId(
                        currentUser.getId()
                )
                .stream()
                .map(GoalResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public GoalResponse getGoal(
            Long id,
            User currentUser
    ) {
        Goal goal =
                findGoal(
                        id,
                        currentUser
                );

        return GoalResponse.from(goal);
    }

    @Transactional
    public GoalResponse createGoal(
            GoalRequest request,
            User currentUser
    ) {
        Goal goal =
                new Goal(
                        currentUser,
                        request.name(),
                        request.currentAmount(),
                        request.targetAmount(),
                        request.monthlyContribution(),
                        request.targetDate(),
                        request.priority(),
                        request.type(),
                        request.color(),
                        request.imageUrl(),
                        request.imagePosition()
                );

        Goal savedGoal =
                goalRepository.save(goal);

        return GoalResponse.from(
                savedGoal
        );
    }

    @Transactional
    public GoalResponse updateGoal(
            Long id,
            GoalRequest request,
            User currentUser
    ) {
        Goal goal =
                findGoal(
                        id,
                        currentUser
                );

        goal.update(
                request.name(),
                request.currentAmount(),
                request.targetAmount(),
                request.monthlyContribution(),
                request.targetDate(),
                request.priority(),
                request.type(),
                request.color(),
                request.imageUrl(),
                request.imagePosition()
        );

        return GoalResponse.from(goal);
    }

    @Transactional
    public void deleteGoal(
            Long id,
            User currentUser
    ) {
        Goal goal =
                findGoal(
                        id,
                        currentUser
                );

        goalRepository.delete(goal);
    }

    private Goal findGoal(
            Long id,
            User currentUser
    ) {
        return goalRepository
                .findByIdAndUserId(
                        id,
                        currentUser.getId()
                )
                .orElseThrow(
                        () ->
                                new GoalNotFoundException(
                                        id
                                )
                );
    }
}