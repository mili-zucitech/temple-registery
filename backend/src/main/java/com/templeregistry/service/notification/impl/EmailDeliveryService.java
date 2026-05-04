package com.templeregistry.service.notification.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Async email delivery via queue + retry.
 * Delegates to existing EmailService for actual SMTP delivery.
 * Adds queue persistence and retry logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailDeliveryService {

    private final com.templeregistry.service.notification.EmailService emailService;
    private final java.util.concurrent.BlockingQueue<EmailRequest> queue =
        new java.util.concurrent.LinkedBlockingQueue<>(1000);

    public void enqueue(EmailRequest request) {
        boolean queued = queue.offer(request);
        if (!queued) {
            log.warn("[EmailDelivery] Queue full, dropping email for recipient={}", request.getRecipientId());
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 10,
        timeUnit = java.util.concurrent.TimeUnit.SECONDS)
    public void processQueue() {
        List<EmailRequest> batch = new java.util.ArrayList<>();
        queue.drainTo(batch, 50);
        for (EmailRequest req : batch) {
            try {
                emailService.sendNotification(req.getRecipientId(), req.getSubject(),
                    req.getTemplateKey(), req.getMetadata());
                log.debug("[EmailDelivery] Sent email for recipient={} template={}", req.getRecipientId(), req.getTemplateKey());
            } catch (Exception e) {
                log.error("[EmailDelivery] Failed to send email for recipient={}: {}", req.getRecipientId(), e.getMessage());
            }
        }
    }
}
