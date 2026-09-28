package com.freedom.freedom_backend.recurring;

import com.freedom.freedom_backend.transaction.TransactionType;
import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RecurringTransactionService {

    private final RecurringTransactionRepository repository;

    public RecurringTransactionService(
            RecurringTransactionRepository repository
    ) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<RecurringTransactionResponse> getAll(
            User user
    ) {
        return repository
                .findAllByUserId(user.getId())
                .stream()
                .map(RecurringTransactionResponse::from)
                .toList();
    }

    public RecurringTransactionResponse create(
            RecurringTransactionRequest request,
            User user
    ) {
        validate(request);

        RecurringTransaction transaction =
                new RecurringTransaction(
                        user,
                        request.type(),
                        request.name(),
                        request.amount(),
                        request.category(),
                        request.dayOfMonth(),
                        request.startDate(),
                        request.active()
                );

        return RecurringTransactionResponse.from(
                repository.save(transaction)
        );
    }

    public RecurringTransactionResponse update(
            Long id,
            RecurringTransactionRequest request,
            User user
    ) {
        validate(request);

        RecurringTransaction transaction =
                find(id, user);

        transaction.update(
                request.type(),
                request.name(),
                request.amount(),
                request.category(),
                request.dayOfMonth(),
                request.startDate(),
                request.active()
        );

        return RecurringTransactionResponse.from(transaction);
    }

    public void delete(Long id, User user) {
        repository.delete(find(id, user));
    }

    private RecurringTransaction find(
            Long id,
            User user
    ) {
        return repository
                .findByIdAndUserId(id, user.getId())
                .orElseThrow(
                        () ->
                                new RecurringTransactionNotFoundException(id)
                );
    }

    private void validate(
            RecurringTransactionRequest request
    ) {
        if (
                request.type() == TransactionType.EXPENSE
                && request.category() == null
        ) {
            throw new IllegalArgumentException(
                    "Expense recurring transaction requires category"
            );
        }

        if (
                request.type() == TransactionType.INCOME
                && request.category() != null
        ) {
            throw new IllegalArgumentException(
                    "Income recurring transaction cannot have category"
            );
        }
    }
}