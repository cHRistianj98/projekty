package com.freedom.freedom_backend.transaction;

import com.freedom.freedom_backend.asset.SystemCashService;
import com.freedom.freedom_backend.category.Category;
import com.freedom.freedom_backend.category.CategoryService;
import com.freedom.freedom_backend.category.CategoryType;
import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class TransactionService {
    private final TransactionRepository repository;
    private final CategoryService categoryService;
    private final SystemCashService systemCashService;

    public TransactionService(TransactionRepository repository, CategoryService categoryService,
                              SystemCashService systemCashService) {
        this.repository = repository;
        this.categoryService = categoryService;
        this.systemCashService = systemCashService;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAll(User user) {
        return repository.findAllByUserIdOrderByDateDesc(user.getId()).stream()
                .map(TransactionResponse::from).toList();
    }

    public TransactionResponse create(TransactionRequest request, User user) {
        Category detailed = resolveCategory(request, user);
        validate(request, detailed);
        Transaction transaction = new Transaction(user, request.type(), request.name(), request.amount(),
                legacyCategory(request, detailed), detailed, request.recurring(), request.date(), request.recurringRuleId());
        Transaction saved = repository.save(transaction);
        systemCashService.applyDelta(user, signedAmount(saved.getType(), saved.getAmount()));
        return TransactionResponse.from(saved);
    }

    public TransactionResponse update(Long id, TransactionRequest request, User user) {
        Category detailed = resolveCategory(request, user);
        validate(request, detailed);
        Transaction transaction = find(id, user);
        BigDecimal before = signedAmount(transaction.getType(), transaction.getAmount());

        transaction.update(request.type(), request.name(), request.amount(), legacyCategory(request, detailed),
                detailed, request.recurring(), request.date(), request.recurringRuleId());

        BigDecimal after = signedAmount(transaction.getType(), transaction.getAmount());
        systemCashService.applyDelta(user, after.subtract(before));
        return TransactionResponse.from(transaction);
    }

    public void delete(Long id, User user) {
        Transaction transaction = find(id, user);
        systemCashService.applyDelta(user,
                signedAmount(transaction.getType(), transaction.getAmount()).negate());
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

    private BigDecimal signedAmount(TransactionType type, BigDecimal amount) {
        return type == TransactionType.INCOME ? amount : amount.negate();
    }
}
