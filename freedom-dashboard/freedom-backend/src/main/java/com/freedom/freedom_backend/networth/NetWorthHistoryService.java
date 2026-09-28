package com.freedom.freedom_backend.networth;

import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NetWorthHistoryService {

    private final NetWorthHistoryRepository repository;

    public NetWorthHistoryService(
            NetWorthHistoryRepository repository
    ) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<NetWorthHistoryResponse> getAll(
            User user
    ) {
        return repository
                .findAllByUserIdOrderByMonthAsc(user.getId())
                .stream()
                .map(NetWorthHistoryResponse::from)
                .toList();
    }

    public NetWorthHistoryResponse save(
            NetWorthHistoryRequest request,
            User user
    ) {
        NetWorthHistory history =
                repository
                        .findByUserIdAndMonth(
                                user.getId(),
                                request.month()
                        )
                        .orElseGet(() ->
                                new NetWorthHistory(
                                        user,
                                        request.month(),
                                        request.value()
                                )
                        );

        history.updateValue(request.value());

        return NetWorthHistoryResponse.from(
                repository.save(history)
        );
    }
}