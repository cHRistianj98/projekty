package com.freedom.freedom_backend.recurring;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecurringTransactionRepository
        extends JpaRepository<RecurringTransaction, Long> {

    List<RecurringTransaction> findAllByUserId(Long userId);

    Optional<RecurringTransaction> findByIdAndUserId(
            Long id,
            Long userId
    );
}