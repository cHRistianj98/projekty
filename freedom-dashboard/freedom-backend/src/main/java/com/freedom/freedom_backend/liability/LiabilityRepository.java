package com.freedom.freedom_backend.liability;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LiabilityRepository
        extends JpaRepository<Liability, Long> {

    List<Liability> findAllByUserId(
            Long userId
    );

    Optional<Liability> findByIdAndUserId(
            Long id,
            Long userId
    );
}