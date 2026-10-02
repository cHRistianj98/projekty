package com.freedom.freedom_backend.transaction;

import com.freedom.freedom_backend.category.Category;
import com.freedom.freedom_backend.category.CategoryService;
import com.freedom.freedom_backend.category.CategoryType;
import com.freedom.freedom_backend.goalspending.GoalSpendingService;
import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TransactionService {
    private final TransactionRepository repository;
    private final CategoryService categoryService;
    private final MoneyLedgerService ledger;
    private final GoalSpendingService goalSpending;

    public TransactionService(
            TransactionRepository repository,
            CategoryService categoryService,
            MoneyLedgerService ledger,
            GoalSpendingService goalSpending
    ) {
        this.repository = repository;
        this.categoryService = categoryService;
        this.ledger = ledger;
        this.goalSpending = goalSpending;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAll(User user) {
        return repository.findAllByUserIdOrderByDateDesc(user.getId()).stream()
                .map(TransactionResponse::from)
                .toList();
    }

    public TransactionResponse create(TransactionRequest request, User user) {
        Category detailed = resolveCategory(request, user);
        validate(request, detailed);
        Long assetId = ledger.resolveAsset(request.assetId(), user);

        Transaction transaction = new Transaction(
                user,
                request.type(),
                request.name(),
                request.amount(),
                legacyCategory(request, detailed),
                detailed,
                request.recurring(),
                request.date(),
                request.recurringRuleId(),
                assetId,
                request.goalId()
        );
        Transaction saved = repository.saveAndFlush(transaction);

        applyFinancialEvent(saved, user, false, null);
        return TransactionResponse.from(saved);
    }

    public TransactionResponse createImported(
            TransactionRequest request,
            User user,
            String importSource
    ) {
        Category detailed = resolveCategory(request, user);
        validate(request, detailed);
        Long assetId = ledger.resolveAsset(request.assetId(), user);

        Transaction transaction = new Transaction(
                user,
                request.type(),
                request.name(),
                request.amount(),
                legacyCategory(request, detailed),
                detailed,
                request.recurring(),
                request.date(),
                request.recurringRuleId(),
                assetId,
                request.goalId()
        );
        Transaction saved = repository.saveAndFlush(transaction);

        applyFinancialEvent(saved, user, true, importSource);
        return TransactionResponse.from(saved);
    }

    public TransactionResponse update(Long id, TransactionRequest request, User user) {
        Category detailed = resolveCategory(request, user);
        validate(request, detailed);
        Transaction transaction = find(id, user);

        // Reverse the old event first. Everything runs in one DB transaction, so
        // a failure while applying the replacement restores the previous state.
        reverseFinancialEvent(transaction, user);

        Long assetId = ledger.resolveAsset(request.assetId(), user);
        transaction.update(
                request.type(),
                request.name(),
                request.amount(),
                legacyCategory(request, detailed),
                detailed,
                request.recurring(),
                request.date(),
                request.recurringRuleId(),
                assetId,
                request.goalId()
        );
        repository.flush();

        applyFinancialEvent(transaction, user, false, null);
        return TransactionResponse.from(transaction);
    }

    public void delete(Long id, User user) {
        Transaction transaction = find(id, user);
        reverseFinancialEvent(transaction, user);
        repository.delete(transaction);
    }

    private void applyFinancialEvent(
            Transaction transaction,
            User user,
            boolean imported,
            String importSource
    ) {
        if (transaction.getType() == TransactionType.INCOME) {
            ledger.recordIncome(
                    transaction.getId(),
                    transaction.getAssetId(),
                    transaction.getAmount(),
                    user
            );
            return;
        }

        if (transaction.getGoalId() != null) {
            // First turn the exact goal reservation into spendable capital.
            // Then the normal expense ledger consumes the physical money.
            goalSpending.consumeReservation(
                    transaction.getGoalId(),
                    transaction.getId(),
                    transaction.getAssetId(),
                    transaction.getAmount(),
                    user
            );
            ledger.recordExpense(
                    transaction.getId(),
                    transaction.getAssetId(),
                    transaction.getAmount(),
                    user
            );
            return;
        }

        if (imported) {
            ledger.recordExpenseFromImportSource(
                    transaction.getId(),
                    transaction.getAssetId(),
                    transaction.getAmount(),
                    user,
                    importSource
            );
        } else {
            ledger.recordExpense(
                    transaction.getId(),
                    transaction.getAssetId(),
                    transaction.getAmount(),
                    user
            );
        }
    }

    private void reverseFinancialEvent(Transaction transaction, User user) {
        if (transaction.getType() == TransactionType.INCOME) {
            ledger.reverseIncome(
                    transaction.getId(),
                    transaction.getAssetId(),
                    transaction.getAmount(),
                    user
            );
            return;
        }

        // Restore the physical capital first, then reserve it back to the goal.
        ledger.reverseExpense(
                transaction.getId(),
                transaction.getAssetId(),
                transaction.getAmount(),
                user
        );

        if (transaction.getGoalId() != null) {
            goalSpending.reverseSpending(transaction.getId(), user);
        }
    }

    private Transaction find(Long id, User user) {
        return repository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new TransactionNotFoundException(id));
    }

    private Category resolveCategory(TransactionRequest request, User user) {
        return request.categoryId() == null
                ? null
                : categoryService.findOwned(request.categoryId(), user);
    }

    private void validate(TransactionRequest request, Category detailed) {
        if (detailed == null
                && request.type() == TransactionType.EXPENSE
                && request.category() == null) {
            throw new IllegalArgumentException("Expense transaction requires category or categoryId");
        }

        if (detailed != null) {
            CategoryType expected = request.type() == TransactionType.EXPENSE
                    ? CategoryType.EXPENSE
                    : CategoryType.INCOME;
            if (detailed.getType() != expected) {
                throw new IllegalArgumentException("Category type does not match transaction type");
            }
        }

        if (request.goalId() != null && request.type() != TransactionType.EXPENSE) {
            throw new IllegalArgumentException("Tylko wydatek może być powiązany z celem.");
        }

        if (request.goalId() != null && request.recurring()) {
            throw new IllegalArgumentException(
                    "Wydatek z celu nie może być regułą cykliczną. Zaksięguj kolejne płatności osobno."
            );
        }
    }

    private ExpenseCategory legacyCategory(TransactionRequest request, Category detailed) {
        if (request.type() == TransactionType.INCOME) {
            return null;
        }
        if (request.category() != null) {
            return request.category();
        }
        if (detailed == null) {
            return ExpenseCategory.LIVING;
        }
        return switch (detailed.getGroup()) {
            case FIXED -> ExpenseCategory.FIXED;
            case WEALTH -> ExpenseCategory.INVESTMENT;
            case GOALS -> ExpenseCategory.GOAL;
            default -> ExpenseCategory.LIVING;
        };
    }
}
