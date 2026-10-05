package com.freedom.freedom_backend.portfolio;
import com.freedom.freedom_backend.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/portfolios")
public class PortfolioController{
 private final PortfolioService service; public PortfolioController(PortfolioService service){this.service=service;}
 @GetMapping public List<PortfolioResponse> all(@AuthenticationPrincipal User u){return service.getAll(u);}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public PortfolioResponse create(@Valid @RequestBody PortfolioRequest r,@AuthenticationPrincipal User u){return service.create(r,u);}
 @PutMapping("/{id}") public PortfolioResponse update(@PathVariable Long id,@Valid @RequestBody PortfolioRequest r,@AuthenticationPrincipal User u){return service.update(id,r,u);}
 @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id,@AuthenticationPrincipal User u){service.delete(id,u);}
 @PostMapping("/transfer") @ResponseStatus(HttpStatus.NO_CONTENT) public void transfer(@Valid @RequestBody PortfolioTransferRequest r,@AuthenticationPrincipal User u){service.transfer(r,u);}
 @PostMapping("/move-asset") @ResponseStatus(HttpStatus.NO_CONTENT) public void moveAsset(@Valid @RequestBody PortfolioMoveAssetRequest r,@AuthenticationPrincipal User u){service.moveAsset(r,u);}
 @GetMapping("/valuations") public List<ValuationEventResponse> valuations(@RequestParam(defaultValue="100") int limit,@AuthenticationPrincipal User u){return service.valuations(u,limit);}
}
