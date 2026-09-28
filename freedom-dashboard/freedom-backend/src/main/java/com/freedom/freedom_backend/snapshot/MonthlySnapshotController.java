package com.freedom.freedom_backend.snapshot;

import com.freedom.freedom_backend.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monthly-snapshots")
public class MonthlySnapshotController {

    private final MonthlySnapshotService service;

    public MonthlySnapshotController(
            MonthlySnapshotService service
    ) {
        this.service = service;
    }

    @GetMapping
    public List<MonthlySnapshotResponse> getAll(
            @AuthenticationPrincipal User user
    ) {
        return service.getAll(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MonthlySnapshotResponse create(
            @Valid @RequestBody MonthlySnapshotRequest request,
            @AuthenticationPrincipal User user
    ) {
        return service.create(request, user);
    }
}