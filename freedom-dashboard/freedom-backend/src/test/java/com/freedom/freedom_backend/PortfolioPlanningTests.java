// package com.freedom.freedom_backend;

// import com.freedom.freedom_backend.asset.SystemCashService;
// import com.freedom.freedom_backend.goalallocation.*;
// import com.freedom.freedom_backend.portfolio.*;
// import com.freedom.freedom_backend.user.*;
// import jakarta.validation.Validator;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.test.context.SpringBootTest;
// import org.springframework.jdbc.core.JdbcTemplate;
// import org.springframework.transaction.annotation.Transactional;
// import java.math.BigDecimal;
// import java.util.UUID;
// import static org.assertj.core.api.Assertions.*;

// @SpringBootTest
// @Transactional
// class PortfolioPlanningTests {
//     @Autowired PortfolioService portfolios;
//     @Autowired SystemCashService cash;
//     @Autowired GoalAllocationService allocations;
//     @Autowired UserRepository users;
//     @Autowired JdbcTemplate jdbc;
//     @Autowired Validator validator;

//     private User user() {
//         User user = users.saveAndFlush(new User(UUID.randomUUID() + "@portfolio.test", "not-a-login-hash"));
//         cash.ensureExists(user);
//         return user;
//     }
//     private PortfolioRequest request(String target, String monthly) {
//         return new PortfolioRequest("Long term", "#35d5a4", "sprout",
//                 target == null ? null : new BigDecimal(target), monthly == null ? null : new BigDecimal(monthly));
//     }
//     private PortfolioResponse wallet(Long id, User user) {
//         return portfolios.getAll(user).stream().filter(p -> p.id().equals(id)).findFirst().orElseThrow();
//     }
//     private BigDecimal wealth(User user) {
//         return jdbc.queryForObject("SELECT COALESCE(SUM(value),0) FROM assets WHERE user_id=?", BigDecimal.class, user.getId());
//     }

//     @Test void planningFieldsPersistWithoutMovingMoney() {
//         User user = user();
//         cash.applyDelta(user, new BigDecimal("10000"));
//         PortfolioResponse created = portfolios.create(request("300000", "1500"), user);
//         assertThat(wallet(created.id(), user).targetAmount()).isEqualByComparingTo("300000");
//         assertThat(wallet(created.id(), user).monthlyContribution()).isEqualByComparingTo("1500");
//         portfolios.update(created.id(), request("350000", "2000"), user);
//         assertThat(wallet(created.id(), user).monthlyContribution()).isEqualByComparingTo("2000");
//         assertThat(wealth(user)).isEqualByComparingTo("10000");
//         portfolios.update(created.id(), request(null, "0"), user);
//         assertThat(wallet(created.id(), user).targetAmount()).isNull();
//     }

//     @Test void planningIsIsolatedPerUserAndSystemPortfoliosStayProtected() {
//         User owner = user();
//         User other = user();
//         PortfolioResponse created = portfolios.create(request("30000", "500"), owner);
//         assertThat(portfolios.getAll(other)).noneMatch(p -> p.id().equals(created.id()));
//         assertThatThrownBy(() -> portfolios.update(created.id(), request("1", "1"), other)).isInstanceOf(IllegalArgumentException.class);
//         assertThat(wallet(created.id(), owner).targetAmount()).isEqualByComparingTo("30000");
//         Long main = portfolios.getAll(owner).stream().filter(p -> p.type() == PortfolioType.MAIN).findFirst().orElseThrow().id();
//         assertThatThrownBy(() -> portfolios.update(main, request("1", "1"), owner)).isInstanceOf(IllegalArgumentException.class);
//     }

//     @Test void validatesTargetsAndMonthlyContributions() {
//         assertThat(validator.validate(request("-1", "500"))).isNotEmpty();
//         assertThat(validator.validate(request("30000", "-1"))).isNotEmpty();
//         assertThat(validator.validate(request("30000.001", "500"))).isNotEmpty();
//         assertThat(validator.validate(request(null, null))).isEmpty();
//     }

//     @Test void transferAndReleaseKeepUnderlyingWealthAndCashflowUnchanged() {
//         User user = user();
//         cash.applyDelta(user, new BigDecimal("10000"));
//         Long source = jdbc.queryForObject("SELECT id FROM assets WHERE user_id=? AND system_cash=TRUE", Long.class, user.getId());
//         PortfolioResponse targetWallet = portfolios.create(request("30000", "500"), user);
//         Long target = jdbc.queryForObject("INSERT INTO assets(user_id,name,value,color,category,icon_key,system_cash,portfolio_id) VALUES(?,'Bonds',0,'#318bff','OTHER','shield',FALSE,?) RETURNING id", Long.class, user.getId(), targetWallet.id());
//         Long goal = jdbc.queryForObject("INSERT INTO goals(user_id,name,current_amount,target_amount,monthly_contribution,color) VALUES(?,'Reserve',0,2000,0,'#8b5cf6') RETURNING id", Long.class, user.getId());
//         allocations.allocate(goal, new GoalAllocationRequest(new BigDecimal("2000"), GoalAllocationMode.ALLOCATE_EXISTING, null, source), user);
//         portfolios.transfer(new PortfolioTransferRequest(source, target, new BigDecimal("3000")), user);
//         allocations.release(goal, source, new BigDecimal("500"), user);
//         assertThat(wealth(user)).isEqualByComparingTo("10000");
//         assertThat(allocations.getOverview(user).totalAllocated()).isEqualByComparingTo("1500");
//         assertThat(wallet(targetWallet.id(), user).grossValue()).isEqualByComparingTo("3000");
//         assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM transactions WHERE user_id=?", Long.class, user.getId())).isZero();
//         assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM asset_valuation_events WHERE user_id=?", Long.class, user.getId())).isZero();
//     }
// }
