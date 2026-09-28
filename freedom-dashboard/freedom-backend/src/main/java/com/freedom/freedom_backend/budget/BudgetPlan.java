package com.freedom.freedom_backend.budget;

import com.freedom.freedom_backend.user.User;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "budget_plans")
public class BudgetPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 7)
    private String month;

    @ElementCollection
    @CollectionTable(
            name = "budget_limits",
            joinColumns =
            @JoinColumn(name = "budget_plan_id")
    )
    private List<BudgetLimit> limits =
            new ArrayList<>();

    protected BudgetPlan() {}

    public BudgetPlan(
            User user,
            String month,
            List<BudgetLimit> limits
    ) {
        this.user = user;
        this.month = month;
        this.limits = new ArrayList<>(limits);
    }

    public void updateLimits(
            List<BudgetLimit> limits
    ) {
        this.limits.clear();
        this.limits.addAll(limits);
    }

    public Long getId() { return id; }
    public String getMonth() { return month; }
    public List<BudgetLimit> getLimits() { return limits; }
}