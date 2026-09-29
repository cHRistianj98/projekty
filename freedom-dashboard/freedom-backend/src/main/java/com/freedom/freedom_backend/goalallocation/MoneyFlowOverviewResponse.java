package com.freedom.freedom_backend.goalallocation;
import java.math.BigDecimal;
import java.util.List;
public record MoneyFlowOverviewResponse(BigDecimal totalAllocated,List<PortfolioAllocationResponse> allocations,List<Long> executedGoalIds) {}
