package com.freedom.freedom_backend.snapshot;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MonthlySnapshotRepository
        extends JpaRepository<MonthlySnapshot, Long> {

    List<MonthlySnapshot> findAllByUserIdOrderByMonthDesc(
            Long userId
    );

    Optional<MonthlySnapshot> findByUserIdAndMonth(
            Long userId,
            String month
    );
}