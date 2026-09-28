package com.freedom.freedom_backend.networth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NetWorthHistoryRepository
        extends JpaRepository<NetWorthHistory, Long> {

    List<NetWorthHistory> findAllByUserIdOrderByMonthAsc(
            Long userId
    );

    Optional<NetWorthHistory> findByUserIdAndMonth(
            Long userId,
            String month
    );
}