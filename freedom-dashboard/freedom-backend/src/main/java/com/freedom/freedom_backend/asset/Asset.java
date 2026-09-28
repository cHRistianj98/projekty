package com.freedom.freedom_backend.asset;

import com.freedom.freedom_backend.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "assets")
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal value;

    @Column(nullable = false)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetCategory category;

    @Column(name = "icon_key", nullable = false)
    private String iconKey;

    protected Asset() {
    }

    public Asset(
            User user,
            String name,
            BigDecimal value,
            String color,
            AssetCategory category,
            String iconKey
    ) {
        this.user = user;
        this.name = name;
        this.value = value;
        this.color = color;
        this.category = category;
        this.iconKey = iconKey;
    }

    public void update(
            String name,
            BigDecimal value,
            String color,
            AssetCategory category,
            String iconKey
    ) {
        this.name = name;
        this.value = value;
        this.color = color;
        this.category = category;
        this.iconKey = iconKey;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public BigDecimal getValue() { return value; }
    public String getColor() { return color; }
    public AssetCategory getCategory() { return category; }
    public String getIconKey() { return iconKey; }
}
