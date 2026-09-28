package com.freedom.freedom_backend.snapshot;

import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MonthlySnapshotService {

    private final MonthlySnapshotRepository repository;

    public MonthlySnapshotService(
            MonthlySnapshotRepository repository
    ) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<MonthlySnapshotResponse> getAll(
            User user
    ) {
        return repository
                .findAllByUserIdOrderByMonthDesc(user.getId())
                .stream()
                .map(MonthlySnapshotResponse::from)
                .toList();
    }

    public MonthlySnapshotResponse create(
            MonthlySnapshotRequest request,
            User user
    ) {
        if (
                repository
                        .findByUserIdAndMonth(
                                user.getId(),
                                request.month()
                        )
                        .isPresent()
        ) {
            throw new IllegalStateException(
                    "Month " + request.month()
                            + " is already closed"
            );
        }

        List<MonthlySnapshotAsset> assets =
                request.assets()
                        .stream()
                        .map(asset ->
                                new MonthlySnapshotAsset(
                                        asset.id(),
                                        asset.name(),
                                        asset.value(),
                                        asset.category()
                                )
                        )
                        .toList();

        List<MonthlySnapshotGoal> goals =
                request.goals()
                        .stream()
                        .map(goal ->
                                new MonthlySnapshotGoal(
                                        goal.id(),
                                        goal.name(),
                                        goal.currentAmount(),
                                        goal.targetAmount(),
                                        goal.monthlyContribution(),
                                        goal.targetDate(),
                                        goal.priority(),
                                        goal.type()
                                )
                        )
                        .toList();

        List<MonthlySnapshotLiability> liabilities =
                request.liabilities()
                        .stream()
                        .map(liability ->
                                new MonthlySnapshotLiability(
                                        liability.id(),
                                        liability.name(),
                                        liability.type(),
                                        liability.originalAmount(),
                                        liability.remainingAmount(),
                                        liability.monthlyPayment(),
                                        liability.principalPayment(),
                                        liability.interestPayment(),
                                        liability.interestRate()
                                )
                        )
                        .toList();

        MonthlySnapshot snapshot =
                new MonthlySnapshot(
                        user,
                        request.month(),
                        request.closedAt(),

                        request.cashflow().income(),
                        request.cashflow().expenses(),
                        request.cashflow().surplus(),
                        request.cashflow().savingsRate(),
                        request.cashflow().incomeTransactions(),
                        request.cashflow().expenseTransactions(),

                        request.wealth().netWorth(),
                        request.wealth().assets(),
                        request.wealth().liabilities(),

                        request.player().totalXp(),
                        request.player().level(),
                        request.player().levelName(),
                        request.player().unlockedAchievements(),
                        request.player().totalAchievements(),

                        assets,
                        goals,
                        liabilities
                );

        return MonthlySnapshotResponse.from(
                repository.save(snapshot)
        );
    }
}