package com.freedom.freedom_backend.category;

public record CategoryResponse(
        Long id,
        CategoryType type,
        CategoryGroup group,
        String slug,
        String name,
        String iconKey,
        String color,
        boolean systemDefault,
        boolean active,
        int sortOrder
) {
    public static CategoryResponse from(Category c) {
        return new CategoryResponse(c.getId(), c.getType(), c.getGroup(), c.getSlug(), c.getName(),
                c.getIconKey(), c.getColor(), c.isSystemDefault(), c.isActive(), c.getSortOrder());
    }
}
