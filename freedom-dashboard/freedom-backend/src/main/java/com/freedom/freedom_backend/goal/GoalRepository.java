package com.freedom.freedom_backend.goal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GoalRepository
        extends JpaRepository<Goal, Long> {

    List<Goal> findAllByUserId(
            Long userId
    );

    Optional<Goal> findByIdAndUserId(
            Long id,
            Long userId
    );
}