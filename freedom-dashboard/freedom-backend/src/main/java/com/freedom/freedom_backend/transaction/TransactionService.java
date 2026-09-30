package com.freedom.freedom_backend.transaction;

import com.freedom.freedom_backend.category.Category;
import com.freedom.freedom_backend.category.CategoryService;
import com.freedom.freedom_backend.category.CategoryType;
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

    public TransactionService(TransactionRepository repository, CategoryService categoryService,
                              MoneyLedgerService ledger) {
        this.repository = repository;
        this.categoryService = categoryService;
        this.ledger = ledger;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAll(User user) {
        return repository.findAllByUserIdOrderByDateDesc(user.getId()).stream()
                .map(TransactionResponse::from).toList();
    }

    public TransactionResponse create(TransactionRequest request, User user) {
        Category detailed = resolveCategory(request, user);
        validate(request, detailed);
        Long assetId = ledger.resolveAsset(request.assetId(), user);

        Transaction transaction = new Transaction(user, request.type(), request.name(), request.amount(),
                legacyCategory(request, detailed), detailed, request.recurring(), request.date(),
                request.recurringRuleId(), assetId);
        Transaction saved = repository.saveAndFlush(transaction);

        if (saved.getType() == TransactionType.INCOME) {
            ledger.recordIncome(saved.getId(), assetId, saved.getAmount(), user);
        } else {
            ledger.recordExpense(saved.getId(), assetId, saved.getAmount(), user);
        }
        return TransactionResponse.from(saved);
    }

    public TransactionResponse createImported(TransactionRequest request, User user, String importSource) {
        Category detailed = resolveCategory(request, user);
        validate(request, detailed);
        Long assetId = ledger.resolveAsset(request.assetId(), user);

        Transaction transaction = new Transaction(user, request.type(), request.name(), request.amount(),
                legacyCategory(request, detailed), detailed, request.recurring(), request.date(),
                request.recurringRuleId(), assetId);
        Transaction saved = repository.saveAndFlush(transaction);

        if (saved.getType() == TransactionType.INCOME) {
            ledger.recordIncome(saved.getId(), assetId, saved.getAmount(), user);
        } else {
            ledger.recordExpenseFromImportSource(saved.getId(), assetId, saved.getAmount(), user, importSource);
        }
        return TransactionResponse.from(saved);
    }

    public TransactionResponse update(Long id, TransactionRequest request, User user) {
        Category detailed = resolveCategory(request, user);
        validate(request, detailed);
        Transaction transaction = find(id, user);

        // Reverse the old financial event first. The whole method is transactional,
        // so a failed replacement restores the original state automatically.
        if (transaction.getType() == TransactionType.INCOME) {
            ledger.reverseIncome(transaction.getId(), transaction.getAssetId(), transaction.getAmount(), user);
        } else {
            ledger.reverseExpense(transaction.getId(), transaction.getAssetId(), transaction.getAmount(), user);
        }

        Long assetId = ledger.resolveAsset(request.assetId(), user);
        transaction.update(request.type(), request.name(), request.amount(), legacyCategory(request, detailed),
                detailed, request.recurring(), request.date(), request.recurringRuleId(), assetId);
        repository.flush();

        if (transaction.getType() == TransactionType.INCOME) {
            ledger.recordIncome(transaction.getId(), assetId, transaction.getAmount(), user);
        } else {
            ledger.recordExpense(transaction.getId(), assetId, transaction.getAmount(), user);
        }
        return TransactionResponse.from(transaction);
    }

    public void delete(Long id, User user) {
        Transaction transaction = find(id, user);
        if (transaction.getType() == TransactionType.INCOME) {
            ledger.reverseIncome(transaction.getId(), transaction.getAssetId(), transaction.getAmount(), user);
        } else {
            ledger.reverseExpense(transaction.getId(), transaction.getAssetId(), transaction.getAmount(), user);
        }
        repository.delete(transaction);
    }

    private Transaction find(Long id, User user) {
        return repository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new TransactionNotFoundException(id));
    }

    private Category resolveCategory(TransactionRequest request, User user) {
        return request.categoryId() == null ? null : categoryService.findOwned(request.categoryId(), user);
    }

    private void validate(TransactionRequest request, Category detailed) {
        if (detailed == null && request.type() == TransactionType.EXPENSE && request.category() == null)
            throw new IllegalArgumentException("Expense transaction requires category or categoryId");
        if (detailed != null) {
            CategoryType expected = request.type() == TransactionType.EXPENSE ? CategoryType.EXPENSE : CategoryType.INCOME;
            if (detailed.getType() != expected)
                throw new IllegalArgumentException("Category type does not match transaction type");
        }
    }

    private ExpenseCategory legacyCategory(TransactionRequest request, Category detailed) {
        if (request.type() == TransactionType.INCOME) return null;
        if (request.category() != null) return request.category();
        if (detailed == null) return ExpenseCategory.LIVING;
        return switch (detailed.getGroup()) {
            case FIXED -> ExpenseCategory.FIXED;
            case WEALTH -> ExpenseCategory.INVESTMENT;
            case GOALS -> ExpenseCategory.GOAL;
            default -> ExpenseCategory.LIVING;
        };
    }
}
