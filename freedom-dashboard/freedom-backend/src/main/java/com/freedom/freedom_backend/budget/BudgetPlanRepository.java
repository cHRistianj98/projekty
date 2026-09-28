package com.freedom.freedom_backend.budget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetPlanRepository
        extends JpaRepository<BudgetPlan, Long> {

    List<BudgetPlan> findAllByUserId(Long userId);

    Optional<BudgetPlan> findByUserIdAndMonth(
            Long userId,
            String month
    );
}