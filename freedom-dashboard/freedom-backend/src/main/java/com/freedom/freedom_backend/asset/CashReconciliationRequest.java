package com.freedom.freedom_backend.asset;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CashReconciliationRequest(
        @NotEmpty List<@Valid CashReconciliationItemRequest> balances
) {}
