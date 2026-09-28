package com.freedom.freedom_backend.transaction;

import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TransactionService {

    private final TransactionRepository repository;

    public TransactionService(
            TransactionRepository repository
    ) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAll(User user) {
        return repository
                .findAllByUserIdOrderByDateDesc(user.getId())
                .stream()
                .map(TransactionResponse::from)
                .toList();
    }

    public TransactionResponse create(
            TransactionRequest request,
            User user
    ) {
        validate(request);

        Transaction transaction = new Transaction(
                user,
                request.type(),
                request.name(),
                request.amount(),
                request.category(),
                request.recurring(),
                request.date(),
                request.recurringRuleId()
        );

        return TransactionResponse.from(
                repository.save(transaction)
        );
    }

    public TransactionResponse update(
            Long id,
            TransactionRequest request,
            User user
    ) {
        validate(request);

        Transaction transaction =
                find(id, user);

        transaction.update(
                request.type(),
                request.name(),
                request.amount(),
                request.category(),
                request.recurring(),
                request.date(),
                request.recurringRuleId()
        );

        return TransactionResponse.from(transaction);
    }

    public void delete(Long id, User user) {
        repository.delete(find(id, user));
    }

    private Transaction find(
            Long id,
            User user
    ) {
        return repository
                .findByIdAndUserId(id, user.getId())
                .orElseThrow(
                        () -> new TransactionNotFoundException(id)
                );
    }

    private void validate(TransactionRequest request) {
        if (
                request.type() == TransactionType.EXPENSE
                && request.category() == null
        ) {
            throw new IllegalArgumentException(
                    "Expense transaction requires category"
            );
        }

        if (
                request.type() == TransactionType.INCOME
                && request.category() != null
        ) {
            throw new IllegalArgumentException(
                    "Income transaction cannot have category"
            );
        }
    }
}