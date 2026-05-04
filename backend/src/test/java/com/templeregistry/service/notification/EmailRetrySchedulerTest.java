package com.templeregistry.service.notification;

import com.templeregistry.entity.notification.EmailDeliveryLog;
import com.templeregistry.repository.notification.EmailDeliveryLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EmailRetryScheduler.
 *
 * Verifies:
 *   - Calls emailService.resendByLog on each FAILED row
 *   - Sets status SENT and clears failureReason on success
 *   - Sets status FAILED and increments retryCount on SMTP failure
 *   - Sets status FAILED and increments retryCount on unexpected exception
 *   - Does nothing when no failed emails exist
 *   - Each row is saved at least once regardless of outcome
 */
@ExtendWith(MockitoExtension.class)
class EmailRetrySchedulerTest {

    @Mock EmailDeliveryLogRepository emailDeliveryLogRepository;
    @Mock EmailService emailService;

    @InjectMocks
    EmailRetryScheduler scheduler;

    private EmailDeliveryLog buildLog(int retryCount) {
        return EmailDeliveryLog.builder()
            .recipientEmail("ta@temple.gov.in")
            .subject("Declaration approved")
            .templateName("email/approval-notification")
            .status("FAILED")
            .retryCount(retryCount)
            .failureReason("SMTP timeout")
            .build();
    }

    // ── Success path ──────────────────────────────────────────────────────────

    @Test
    void should_setStatusSent_when_resendSucceeds() throws Exception {
        EmailDeliveryLog log = buildLog(0);
        when(emailDeliveryLogRepository.findByStatusAndRetryCountLessThan("FAILED", 3))
            .thenReturn(List.of(log));

        scheduler.retryFailedEmails();

        assertThat(log.getStatus()).isEqualTo("SENT");
        assertThat(log.getFailureReason()).isNull();
        verify(emailService).resendByLog(
            "ta@temple.gov.in", "Declaration approved", "email/approval-notification");
    }

    @Test
    void should_saveRow_when_resendSucceeds() throws Exception {
        EmailDeliveryLog log = buildLog(1);
        when(emailDeliveryLogRepository.findByStatusAndRetryCountLessThan("FAILED", 3))
            .thenReturn(List.of(log));

        scheduler.retryFailedEmails();

        verify(emailDeliveryLogRepository, atLeastOnce()).save(log);
    }

    // ── SMTP failure path ─────────────────────────────────────────────────────

    @Test
    void should_setStatusFailed_and_incrementRetryCount_when_smtpThrows() throws Exception {
        EmailDeliveryLog log = buildLog(0);
        when(emailDeliveryLogRepository.findByStatusAndRetryCountLessThan("FAILED", 3))
            .thenReturn(List.of(log));
        doThrow(new jakarta.mail.MessagingException("Connection refused"))
            .when(emailService).resendByLog(anyString(), anyString(), anyString());

        scheduler.retryFailedEmails();

        assertThat(log.getStatus()).isEqualTo("FAILED");
        assertThat(log.getRetryCount()).isEqualTo(1);
        assertThat(log.getFailureReason()).contains("Connection refused");
    }

    @Test
    void should_setStatusFailed_and_incrementRetryCount_when_unexpectedExceptionThrown() throws Exception {
        EmailDeliveryLog log = buildLog(1);
        when(emailDeliveryLogRepository.findByStatusAndRetryCountLessThan("FAILED", 3))
            .thenReturn(List.of(log));
        doThrow(new RuntimeException("template render failed"))
            .when(emailService).resendByLog(anyString(), anyString(), anyString());

        scheduler.retryFailedEmails();

        assertThat(log.getStatus()).isEqualTo("FAILED");
        assertThat(log.getRetryCount()).isEqualTo(2);
        assertThat(log.getFailureReason()).contains("template render failed");
        verify(emailDeliveryLogRepository, atLeastOnce()).save(log);
    }

    // ── No-op when queue is empty ─────────────────────────────────────────────

    @Test
    void should_doNothing_when_noFailedEmailsInQueue() throws Exception {
        when(emailDeliveryLogRepository.findByStatusAndRetryCountLessThan("FAILED", 3))
            .thenReturn(List.of());

        scheduler.retryFailedEmails();

        verifyNoInteractions(emailService);
        verify(emailDeliveryLogRepository, never()).save(any());
    }

    // ── Multiple rows processed independently ─────────────────────────────────

    @Test
    void should_processEachRow_when_multipleFailedEmailsExist() throws Exception {
        EmailDeliveryLog log1 = buildLog(0);
        EmailDeliveryLog log2 = buildLog(2);
        // log2 resend will fail
        doNothing().when(emailService)
            .resendByLog("ta@temple.gov.in", "Declaration approved", "email/approval-notification");

        // First call succeeds, second fails
        doNothing().doThrow(new RuntimeException("send failed"))
            .when(emailService).resendByLog(anyString(), anyString(), anyString());

        when(emailDeliveryLogRepository.findByStatusAndRetryCountLessThan("FAILED", 3))
            .thenReturn(List.of(log1, log2));

        scheduler.retryFailedEmails();

        assertThat(log1.getStatus()).isEqualTo("SENT");
        assertThat(log2.getStatus()).isEqualTo("FAILED");
        assertThat(log2.getRetryCount()).isEqualTo(3);
        verify(emailDeliveryLogRepository, times(2)).save(any());
    }
}
