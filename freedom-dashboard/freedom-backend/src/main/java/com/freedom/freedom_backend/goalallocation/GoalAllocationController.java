package com.freedom.freedom_backend.goalallocation;
import com.freedom.freedom_backend.user.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController
public class GoalAllocationController {
 private final GoalAllocationService service;
 public GoalAllocationController(GoalAllocationService service){this.service=service;}

 @GetMapping("/api/goals/{goalId}/allocations")
 public GoalAllocationSummaryResponse summary(@PathVariable Long goalId,@AuthenticationPrincipal User u){
  return service.getSummary(goalId,u);
 }
 @PostMapping("/api/goals/{goalId}/allocations")
 public GoalAllocationSummaryResponse allocate(@PathVariable Long goalId,@Valid @RequestBody GoalAllocationRequest r,
                                               @AuthenticationPrincipal User u){
  return service.allocate(goalId,r,u);
 }
 @DeleteMapping("/api/goals/{goalId}/allocations/{assetId}")
 public GoalAllocationSummaryResponse release(@PathVariable Long goalId,@PathVariable Long assetId,@RequestParam BigDecimal amount,@AuthenticationPrincipal User u){return service.release(goalId,assetId,amount,u);}
 @GetMapping("/api/goal-allocations/overview")
 public MoneyFlowOverviewResponse overview(@AuthenticationPrincipal User u){return service.getOverview(u);}
 @PostMapping("/api/goals/{goalId}/execute")
 public MoneyFlowOverviewResponse execute(@PathVariable Long goalId,@AuthenticationPrincipal User u){
  return service.executeGoal(goalId,u);
 }
}
