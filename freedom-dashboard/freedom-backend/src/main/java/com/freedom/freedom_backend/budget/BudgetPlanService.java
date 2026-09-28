package com.freedom.freedom_backend.budget;

import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BudgetPlanService {

    private final BudgetPlanRepository repository;

    public BudgetPlanService(
            BudgetPlanRepository repository
    ) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<BudgetPlanResponse> getAll(
            User user
    ) {
        return repository
                .findAllByUserId(user.getId())
                .stream()
                .map(BudgetPlanResponse::from)
                .toList();
    }

    public BudgetPlanResponse save(
            BudgetPlanRequest request,
            User user
    ) {
        List<BudgetLimit> limits =
                request.limits()
                        .stream()
                        .map(limit ->
                                new BudgetLimit(
                                        limit.category(),
                                        limit.limit()
                                )
                        )
                        .toList();

        BudgetPlan plan = repository
                .findByUserIdAndMonth(
                        user.getId(),
                        request.month()
                )
                .orElseGet(
                        () -> new BudgetPlan(
                                user,
                                request.month(),
                                limits
                        )
                );

        if (plan.getId() != null) {
            plan.updateLimits(limits);
        }

        return BudgetPlanResponse.from(
                repository.save(plan)
        );
    }
}