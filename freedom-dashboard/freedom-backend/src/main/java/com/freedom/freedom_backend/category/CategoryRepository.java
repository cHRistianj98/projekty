package com.freedom.freedom_backend.category;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByUserIdOrderByTypeAscSortOrderAscNameAsc(Long userId);
    List<Category> findAllByUserIdAndTypeAndActiveTrueOrderBySortOrderAscNameAsc(Long userId, CategoryType type);
    Optional<Category> findByIdAndUserId(Long id, Long userId);
    Optional<Category> findByUserIdAndTypeAndSlug(Long userId, CategoryType type, String slug);
    boolean existsByUserId(Long userId);
}
