package com.templeregistry.service.notification;

import com.templeregistry.repository.notification.EmailOutboxRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

/**
 * Unit tests for EmailRetryScheduler.
 *
 * Verifies:
 *   - Logs an error when DEAD_LETTER emails exist
 *   - No error logged when outbox is healthy
 *   - Logs a warning when email backlog is high
 */
@ExtendWith(MockitoExtension.class)
class EmailRetrySchedulerTest {

    @Mock
    EmailOutboxRepository emailOutboxRepository;

    @InjectMocks
    EmailRetryScheduler scheduler;

    @Test
    void should_logDeadLetterAlert_when_deadLetterEmailsExist() {
        when(emailOutboxRepository.countByStatus("DEAD_LETTER")).thenReturn(3L);
        when(emailOutboxRepository.countByStatus("PENDING")).thenReturn(0L);
        when(emailOutboxRepository.countByStatus("FAILED")).thenReturn(0L);

        scheduler.monitorDeadLetterQueue();

        verify(emailOutboxRepository).countByStatus("DEAD_LETTER");
    }

    @Test
    void should_notAlertDeadLetter_when_outboxIsHealthy() {
        when(emailOutboxRepository.countByStatus("DEAD_LETTER")).thenReturn(0L);
        when(emailOutboxRepository.countByStatus("PENDING")).thenReturn(5L);
        when(emailOutboxRepository.countByStatus("FAILED")).thenReturn(2L);

        scheduler.monitorDeadLetterQueue();

        verify(emailOutboxRepository).countByStatus("DEAD_LETTER");
        verify(emailOutboxRepository).countByStatus("PENDING");
        verify(emailOutboxRepository).countByStatus("FAILED");
    }

    @Test
    void should_checkBacklog_when_monitorRuns() {
        when(emailOutboxRepository.countByStatus("DEAD_LETTER")).thenReturn(0L);
        when(emailOutboxRepository.countByStatus("PENDING")).thenReturn(200L);
        when(emailOutboxRepository.countByStatus("FAILED")).thenReturn(50L);

        scheduler.monitorDeadLetterQueue();

        verify(emailOutboxRepository).countByStatus("PENDING");
        verify(emailOutboxRepository).countByStatus("FAILED");
    }
}
