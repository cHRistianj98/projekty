package com.freedom.freedom_backend.transaction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    List<Transaction> findAllByUserIdOrderByDateDesc(Long userId);

    Optional<Transaction> findByIdAndUserId(
            Long id,
            Long userId
    );
}