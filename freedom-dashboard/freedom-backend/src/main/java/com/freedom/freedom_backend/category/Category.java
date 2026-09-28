package com.freedom.freedom_backend.category;

import com.freedom.freedom_backend.user.User;
import jakarta.persistence.*;

@Entity
@Table(
        name = "categories",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_categories_user_type_slug",
                columnNames = {"user_id", "type", "slug"}
        )
)
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CategoryType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "group_key", nullable = false, length = 32)
    private CategoryGroup group;

    @Column(nullable = false, length = 80)
    private String slug;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "icon_key", nullable = false, length = 80)
    private String iconKey;

    @Column(nullable = false, length = 16)
    private String color;

    @Column(name = "system_default", nullable = false)
    private boolean systemDefault;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected Category() {}

    public Category(User user, CategoryType type, CategoryGroup group, String slug,
                    String name, String iconKey, String color, boolean systemDefault,
                    boolean active, int sortOrder) {
        this.user = user;
        this.type = type;
        this.group = group;
        this.slug = slug;
        this.name = name;
        this.iconKey = iconKey;
        this.color = color;
        this.systemDefault = systemDefault;
        this.active = active;
        this.sortOrder = sortOrder;
    }

    public void update(String name, CategoryGroup group, String iconKey, String color, boolean active, int sortOrder) {
        this.name = name;
        this.group = group;
        this.iconKey = iconKey;
        this.color = color;
        this.active = active;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public CategoryType getType() { return type; }
    public CategoryGroup getGroup() { return group; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public String getIconKey() { return iconKey; }
    public String getColor() { return color; }
    public boolean isSystemDefault() { return systemDefault; }
    public boolean isActive() { return active; }
    public int getSortOrder() { return sortOrder; }
}
