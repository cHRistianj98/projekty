package com.freedom.freedom_backend.networth;

import com.freedom.freedom_backend.user.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/net-worth-history")
public class NetWorthHistoryController {

    private final NetWorthHistoryService service;

    public NetWorthHistoryController(
            NetWorthHistoryService service
    ) {
        this.service = service;
    }

    @GetMapping
    public List<NetWorthHistoryResponse> getAll(
            @AuthenticationPrincipal User user
    ) {
        return service.getAll(user);
    }

    @PutMapping
    public NetWorthHistoryResponse save(
            @Valid @RequestBody NetWorthHistoryRequest request,
            @AuthenticationPrincipal User user
    ) {
        return service.save(request, user);
    }
}