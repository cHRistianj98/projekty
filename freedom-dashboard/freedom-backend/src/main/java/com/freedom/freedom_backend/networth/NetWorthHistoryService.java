package com.freedom.freedom_backend.networth;

import com.freedom.freedom_backend.asset.AssetRepository;
import com.freedom.freedom_backend.liability.LiabilityRepository;
import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@Transactional
public class NetWorthHistoryService {

    private final NetWorthHistoryRepository repository;
    private final AssetRepository assetRepository;
    private final LiabilityRepository liabilityRepository;

    public NetWorthHistoryService(
            NetWorthHistoryRepository repository,
            AssetRepository assetRepository,
            LiabilityRepository liabilityRepository
    ) {
        this.repository = repository;
        this.assetRepository = assetRepository;
        this.liabilityRepository = liabilityRepository;
    }

    /**
     * Reading the chart also refreshes today's point. This makes the daily history
     * useful even on a developer/local installation that was not running at the
     * scheduled snapshot time. One calendar day always has at most one row.
     */
    public List<NetWorthHistoryResponse> getAll(User user) {
        captureForDate(user, LocalDate.now());

        return repository
                .findAllByUserIdOrderByMonthAsc(user.getId())
                .stream()
                .map(NetWorthHistoryResponse::from)
                .toList();
    }

    /**
     * Manual/demo save remains supported. The field is still named `month` in the
     * wire format for backwards compatibility, but accepts YYYY-MM-DD now as well.
     */
    public NetWorthHistoryResponse save(
            NetWorthHistoryRequest request,
            User user
    ) {
        String date = normalizeDateKey(request.month());
        NetWorthHistory history = repository
                .findByUserIdAndMonth(user.getId(), date)
                .orElseGet(() -> new NetWorthHistory(user, date, request.value()));

        history.updateValue(request.value());
        return NetWorthHistoryResponse.from(repository.save(history));
    }

    /** Capture current assets - current liabilities for one calendar day. */
    public NetWorthHistoryResponse captureForDate(User user, LocalDate date) {
        BigDecimal assets = assetRepository.findAllByUserId(user.getId()).stream()
                .map(asset -> asset.getValue() == null ? BigDecimal.ZERO : asset.getValue())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal liabilities = liabilityRepository.findAllByUserId(user.getId()).stream()
                .map(liability -> liability.getRemainingAmount() == null
                        ? BigDecimal.ZERO
                        : liability.getRemainingAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netWorth = assets.subtract(liabilities);
        String dateKey = date.toString();

        NetWorthHistory history = repository
                .findByUserIdAndMonth(user.getId(), dateKey)
                .orElseGet(() -> new NetWorthHistory(user, dateKey, netWorth));

        history.updateValue(netWorth);
        return NetWorthHistoryResponse.from(repository.save(history));
    }

    /**
     * Closed month values are kept on the last calendar day of that month. If a
     * daily row already exists for that day, the frozen month-close value wins.
     */
    public void upsertForClosedMonth(
            User user,
            String month,
            BigDecimal value
    ) {
        String dateKey = YearMonth.parse(month).atEndOfMonth().toString();
        NetWorthHistory history = repository
                .findByUserIdAndMonth(user.getId(), dateKey)
                .orElseGet(() -> new NetWorthHistory(user, dateKey, value));

        history.updateValue(value);
        repository.save(history);
    }

    private String normalizeDateKey(String raw) {
        if (raw == null) throw new IllegalArgumentException("Brak daty historii majątku.");
        String value = raw.trim();
        if (value.matches("\\d{4}-\\d{2}-\\d{2}")) {
            LocalDate.parse(value); // validation
            return value;
        }
        if (value.matches("\\d{4}-\\d{2}")) {
            return YearMonth.parse(value).atEndOfMonth().toString();
        }
        throw new IllegalArgumentException("Data historii majątku musi mieć format YYYY-MM-DD.");
    }
}
