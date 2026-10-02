package com.freedom.freedom_backend.goal;

import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class GoalService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final GoalRepository goalRepository;
    private final JdbcTemplate jdbc;

    public GoalService(
            GoalRepository goalRepository,
            JdbcTemplate jdbc
    ) {
        this.goalRepository = goalRepository;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getAllGoals(User currentUser) {
        return goalRepository
                .findAllByUserId(currentUser.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GoalResponse getGoal(Long id, User currentUser) {
        return toResponse(findGoal(id, currentUser));
    }

    @Transactional
    public GoalResponse createGoal(GoalRequest request, User currentUser) {
        Goal goal = new Goal(
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

        Goal savedGoal = goalRepository.saveAndFlush(goal);

        // Backward-friendly initial balance. New money should normally be added
        // through goal allocations, but an initial amount entered in the form is
        // preserved as Legacy / unassigned until the user assigns a real asset.
        if (request.currentAmount().signum() > 0) {
            jdbc.update(
                    """
                    INSERT INTO goal_allocations(
                        user_id,goal_id,asset_id,asset_name_snapshot,amount
                    ) VALUES(?,?,NULL,'Legacy / nieprzypisane',?)
                    """,
                    currentUser.getId(),
                    savedGoal.getId(),
                    request.currentAmount()
            );
        }

        return toResponse(savedGoal);
    }

    @Transactional
    public GoalResponse updateGoal(Long id, GoalRequest request, User currentUser) {
        Goal goal = findGoal(id, currentUser);

        BigDecimal lifecycleAmount = goal.getStatus() == GoalStatus.COMPLETED
                ? goal.getCurrentAmount()
                : coveredAmount(goal.getId(), currentUser.getId());

        // currentAmount is now governed by real allocations + real spending.
        // Editing metadata/target must not silently create or destroy money.
        goal.update(
                request.name(),
                lifecycleAmount,
                request.targetAmount(),
                request.monthlyContribution(),
                request.targetDate(),
                request.priority(),
                request.type(),
                request.color(),
                request.imageUrl(),
                request.imagePosition()
        );

        return toResponse(goal);
    }

    @Transactional
    public void deleteGoal(Long id, User currentUser) {
        Goal goal = findGoal(id, currentUser);
        goalRepository.delete(goal);
    }

    private GoalResponse toResponse(Goal goal) {
        Long uid = goal.getUser().getId();
        return GoalResponse.from(
                goal,
                reservedAmount(goal.getId(), uid),
                spentAmount(goal.getId(), uid)
        );
    }

    private BigDecimal coveredAmount(Long goalId, Long uid) {
        return reservedAmount(goalId, uid).add(spentAmount(goalId, uid));
    }

    private BigDecimal reservedAmount(Long goalId, Long uid) {
        BigDecimal value = jdbc.queryForObject(
                "SELECT COALESCE(SUM(amount),0) FROM goal_allocations WHERE user_id=? AND goal_id=?",
                BigDecimal.class,
                uid,
                goalId
        );
        return value == null ? ZERO : value;
    }

    private BigDecimal spentAmount(Long goalId, Long uid) {
        BigDecimal value = jdbc.queryForObject(
                """
                SELECT
                    COALESCE((SELECT SUM(amount) FROM goal_spendings WHERE user_id=? AND goal_id=?),0) +
                    COALESCE((SELECT SUM(spent_amount) FROM goal_executions WHERE user_id=? AND goal_id=?),0)
                """,
                BigDecimal.class,
                uid,
                goalId,
                uid,
                goalId
        );
        return value == null ? ZERO : value;
    }

    private Goal findGoal(Long id, User currentUser) {
        return goalRepository
                .findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new GoalNotFoundException(id));
    }
}
