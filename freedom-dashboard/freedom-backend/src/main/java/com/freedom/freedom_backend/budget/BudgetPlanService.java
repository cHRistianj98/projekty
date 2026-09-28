package com.freedom.freedom_backend.budget;

import com.freedom.freedom_backend.category.Category;
import com.freedom.freedom_backend.category.CategoryRepository;
import com.freedom.freedom_backend.category.CategoryType;
import com.freedom.freedom_backend.transaction.ExpenseCategory;
import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BudgetPlanService {

    private final BudgetPlanRepository repository;
    private final CategoryRepository categoryRepository;

    public BudgetPlanService(
            BudgetPlanRepository repository,
            CategoryRepository categoryRepository
    ) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
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
                                toBudgetLimit(limit, user)
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

    private BudgetLimit toBudgetLimit(
            BudgetLimitRequest request,
            User user
    ) {
        if (request.categoryId() != null) {
            Category category = categoryRepository
                    .findByIdAndUserId(
                            request.categoryId(),
                            user.getId()
                    )
                    .orElseThrow(
                            () -> new IllegalArgumentException(
                                    "Budget category not found"
                            )
                    );

            if (category.getType() != CategoryType.EXPENSE) {
                throw new IllegalArgumentException(
                        "Budget limit requires EXPENSE category"
                );
            }

            return new BudgetLimit(
                    legacyCategory(category),
                    category,
                    request.limit()
            );
        }

        if (request.category() == null) {
            throw new IllegalArgumentException(
                    "Budget limit requires categoryId or legacy category"
            );
        }

        return new BudgetLimit(
                request.category(),
                null,
                request.limit()
        );
    }

    private ExpenseCategory legacyCategory(
            Category category
    ) {
        return switch (category.getGroup()) {
            case FIXED -> ExpenseCategory.FIXED;
            case WEALTH -> ExpenseCategory.INVESTMENT;
            case GOALS -> ExpenseCategory.GOAL;
            default -> ExpenseCategory.LIVING;
        };
    }
}
