package com.freedom.freedom_backend.networth;

import com.freedom.freedom_backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class NetWorthDailySnapshotJob {

    private static final Logger log = LoggerFactory.getLogger(NetWorthDailySnapshotJob.class);

    private final UserRepository userRepository;
    private final NetWorthHistoryService netWorthHistoryService;

    public NetWorthDailySnapshotJob(
            UserRepository userRepository,
            NetWorthHistoryService netWorthHistoryService
    ) {
        this.userRepository = userRepository;
        this.netWorthHistoryService = netWorthHistoryService;
    }

    /**
     * Record the end-of-day value. The timezone is explicit because Freedom's
     * accounting/dashboard dates are Polish calendar dates.
     */
    @Scheduled(cron = "0 55 23 * * *", zone = "Europe/Warsaw")
    public void captureDailyNetWorth() {
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Europe/Warsaw"));
        userRepository.findAll().forEach(user -> {
            try {
                netWorthHistoryService.captureForDate(user, today);
            } catch (RuntimeException ex) {
                log.warn("Nie udało się zapisać dziennego snapshotu majątku dla userId={}: {}",
                        user.getId(), ex.getMessage());
            }
        });
    }
}
