package com.freedom.freedom_backend.networth;

import java.math.BigDecimal;

public record NetWorthHistoryResponse(
        String month,
        BigDecimal value
) {
    public static NetWorthHistoryResponse from(
            NetWorthHistory history
    ) {
        return new NetWorthHistoryResponse(
                history.getMonth(),
                history.getValue()
        );
    }
}