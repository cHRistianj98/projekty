package com.freedom.freedom_backend.transaction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    List<Transaction> findAllByUserIdOrderByDateDesc(
            Long userId
    );

    List<Transaction>
    findAllByUserIdAndDateBetweenOrderByDateAsc(
            Long userId,
            LocalDate start,
            LocalDate end
    );

    List<Transaction>
    findAllByUserIdAndDateBefore(
            Long userId,
            LocalDate before
    );

    Optional<Transaction> findByIdAndUserId(
            Long id,
            Long userId
    );
}