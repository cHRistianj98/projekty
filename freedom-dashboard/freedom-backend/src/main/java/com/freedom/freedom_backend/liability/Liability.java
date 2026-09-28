package com.freedom.freedom_backend.liability;

import com.freedom.freedom_backend.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "liabilities")
public class Liability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column
    private LiabilityType type;

    @Column(name = "original_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal originalAmount;

    @Column(name = "remaining_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal remainingAmount;

    @Column(name = "monthly_payment", nullable = false, precision = 19, scale = 2)
    private BigDecimal monthlyPayment;

    @Column(name = "principal_payment", nullable = false, precision = 19, scale = 2)
    private BigDecimal principalPayment;

    @Column(name = "interest_payment", nullable = false, precision = 19, scale = 2)
    private BigDecimal interestPayment;

    @Column(name = "interest_rate", nullable = false, precision = 10, scale = 4)
    private BigDecimal interestRate;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "image_position", length = 20)
    private String imagePosition;

    @Column(name = "icon_key", length = 40)
    private String iconKey;

    protected Liability() {}

    public Liability(
            User user,
            String name,
            LiabilityType type,
            BigDecimal originalAmount,
            BigDecimal remainingAmount,
            BigDecimal monthlyPayment,
            BigDecimal principalPayment,
            BigDecimal interestPayment,
            BigDecimal interestRate,
            String imageUrl,
            String imagePosition,
            String iconKey
    ) {
        this.user = user;
        update(name, type, originalAmount, remainingAmount, monthlyPayment,
                principalPayment, interestPayment, interestRate, imageUrl,
                imagePosition, iconKey);
    }

    public void update(
            String name,
            LiabilityType type,
            BigDecimal originalAmount,
            BigDecimal remainingAmount,
            BigDecimal monthlyPayment,
            BigDecimal principalPayment,
            BigDecimal interestPayment,
            BigDecimal interestRate,
            String imageUrl,
            String imagePosition,
            String iconKey
    ) {
        this.name = name;
        this.type = type;
        this.originalAmount = originalAmount;
        this.remainingAmount = remainingAmount;
        this.monthlyPayment = monthlyPayment;
        this.principalPayment = principalPayment;
        this.interestPayment = interestPayment;
        this.interestRate = interestRate;
        this.imageUrl = normalize(imageUrl);
        this.imagePosition = normalizePosition(imagePosition);
        this.iconKey = normalize(iconKey);
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private String normalizePosition(String value) {
        if (value == null) return "center";
        return switch (value) {
            case "top", "bottom" -> value;
            default -> "center";
        };
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public LiabilityType getType() { return type; }
    public BigDecimal getOriginalAmount() { return originalAmount; }
    public BigDecimal getRemainingAmount() { return remainingAmount; }
    public BigDecimal getMonthlyPayment() { return monthlyPayment; }
    public BigDecimal getPrincipalPayment() { return principalPayment; }
    public BigDecimal getInterestPayment() { return interestPayment; }
    public BigDecimal getInterestRate() { return interestRate; }
    public String getImageUrl() { return imageUrl; }
    public String getImagePosition() { return imagePosition; }
    public String getIconKey() { return iconKey; }
}
