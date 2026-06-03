package com.templeregistry.service.notice;

import com.templeregistry.repository.notice.NoticeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Nightly scheduler that auto-transitions PUBLISHED notices to EXPIRED
 * when their expiry_date has passed.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NoticeExpiryScheduler {

    private final NoticeRepository noticeRepository;

    /** Runs every day at 01:00 AM server time. */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void expireOverdueNotices() {
        int count = noticeRepository.bulkExpireByDate(LocalDate.now());
        if (count > 0) {
            log.info("NoticeExpiryScheduler: expired {} notice(s) as of {}", count, LocalDate.now());
        }
    }
}
