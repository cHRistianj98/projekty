package com.freedom.freedom_backend.networth;

import com.freedom.freedom_backend.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "net_worth_history")
public class NetWorthHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 7)
    private String month;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal value;

    protected NetWorthHistory() {}

    public NetWorthHistory(
            User user,
            String month,
            BigDecimal value
    ) {
        this.user = user;
        this.month = month;
        this.value = value;
    }

    public void updateValue(BigDecimal value) {
        this.value = value;
    }

    public String getMonth() { return month; }
    public BigDecimal getValue() { return value; }
}