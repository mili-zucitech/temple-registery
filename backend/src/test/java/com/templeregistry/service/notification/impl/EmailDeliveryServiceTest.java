package com.templeregistry.service.notification.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.notification.EmailOutbox;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.notification.EmailOutboxRepository;
import com.templeregistry.service.notification.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailDeliveryServiceTest {

    @Mock private EmailService emailService;
    @Mock private EmailOutboxRepository emailOutboxRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private EmailDeliveryService service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void injectObjectMapper() throws Exception {
        // ObjectMapper is not injected via @Mock — inject it reflectively
        var field = EmailDeliveryService.class.getDeclaredField("objectMapper");
        field.setAccessible(true);
        field.set(service, objectMapper);
    }

    // ─── enqueue ─────────────────────────────────────────────────────────────

    @Test
    void should_save_outbox_row_when_user_email_is_found() {
        var user = User.builder().email("ta@temple.gov.in").build();
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(emailOutboxRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var request = EmailRequest.builder()
            .recipientId(10L)
            .subject("Test Subject")
            .templateKey("approval-notification")
            .metadata(Map.of("body", "Approved"))
            .entityType("TEMPLE_PROFILE")
            .entityId(5L)
            .build();

        service.enqueue(request);

        var captor = ArgumentCaptor.forClass(EmailOutbox.class);
        verify(emailOutboxRepository).save(captor.capture());

        EmailOutbox saved = captor.getValue();
        assertThat(saved.getRecipientEmail()).isEqualTo("ta@temple.gov.in");
        assertThat(saved.getTemplateKey()).isEqualTo("approval-notification");
        assertThat(saved.getStatus()).isEqualTo("PENDING");
        assertThat(saved.getContextJson()).contains("Approved");
    }

    @Test
    void should_skip_enqueue_when_user_not_found() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        var request = EmailRequest.builder()
            .recipientId(999L)
            .subject("Test")
            .templateKey("approval-notification")
            .metadata(Map.of())
            .build();

        service.enqueue(request);

        verifyNoInteractions(emailOutboxRepository);
    }

    @Test
    void should_skip_enqueue_when_recipient_id_is_null() {
        var request = EmailRequest.builder()
            .recipientId(null)
            .subject("Test")
            .templateKey("approval-notification")
            .metadata(Map.of())
            .build();

        service.enqueue(request);

        verifyNoInteractions(emailOutboxRepository);
    }

    // ─── processQueue ─────────────────────────────────────────────────────────

    @Test
    void should_send_email_and_mark_sent_when_delivery_succeeds() throws Exception {
        EmailOutbox outbox = buildOutbox("approval-notification", 0, 5);
        when(emailOutboxRepository.findPendingBatch(50)).thenReturn(List.of(outbox));
        when(emailOutboxRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(emailService).sendNotification(any(), any(), any(), any());

        service.processQueue();

        assertThat(outbox.getStatus()).isEqualTo("SENT");
        assertThat(outbox.getSentAt()).isNotNull();
        verify(emailOutboxRepository).save(outbox);
    }

    @Test
    void should_mark_failed_and_set_next_retry_when_smtp_throws() throws Exception {
        EmailOutbox outbox = buildOutbox("approval-notification", 0, 5);
        when(emailOutboxRepository.findPendingBatch(50)).thenReturn(List.of(outbox));
        when(emailOutboxRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("SMTP timeout")).when(emailService)
            .sendNotification(any(), any(), any(), any());

        service.processQueue();

        assertThat(outbox.getStatus()).isEqualTo("FAILED");
        assertThat(outbox.getRetryCount()).isEqualTo(1);
        assertThat(outbox.getNextRetryAt()).isNotNull();
        assertThat(outbox.getLastFailureReason()).contains("SMTP timeout");
    }

    @Test
    void should_mark_dead_letter_when_max_retries_exhausted() throws Exception {
        EmailOutbox outbox = buildOutbox("approval-notification", 4, 5); // attempt 5 → exhausted
        when(emailOutboxRepository.findPendingBatch(50)).thenReturn(List.of(outbox));
        when(emailOutboxRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("Permanent failure")).when(emailService)
            .sendNotification(any(), any(), any(), any());

        service.processQueue();

        assertThat(outbox.getStatus()).isEqualTo("DEAD_LETTER");
        assertThat(outbox.getRetryCount()).isEqualTo(5);
    }

    @Test
    void should_not_query_smtp_when_no_pending_rows() {
        when(emailOutboxRepository.findPendingBatch(50)).thenReturn(List.of());

        service.processQueue();

        verifyNoInteractions(emailService);
    }

    // ─── processRetries ───────────────────────────────────────────────────────

    @Test
    void should_retry_failed_row_and_mark_sent_on_success() throws Exception {
        EmailOutbox outbox = buildOutbox("submission-notification", 1, 5);
        outbox.setStatus("FAILED");
        outbox.setNextRetryAt(Instant.now().minusSeconds(1));

        when(emailOutboxRepository.findRetryableBatch(any(Instant.class), eq(20)))
            .thenReturn(List.of(outbox));
        when(emailOutboxRepository.countByStatus("DEAD_LETTER")).thenReturn(0L);
        when(emailOutboxRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(emailService).sendNotification(any(), any(), any(), any());

        service.processRetries();

        assertThat(outbox.getStatus()).isEqualTo("SENT");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private EmailOutbox buildOutbox(String templateKey, int retryCount, int maxRetries) {
        EmailOutbox outbox = new EmailOutbox();
        outbox.setId(1L);
        outbox.setRecipientUserId(10L);
        outbox.setRecipientEmail("user@temple.gov.in");
        outbox.setSubject("Test");
        outbox.setTemplateKey(templateKey);
        outbox.setContextJson("{\"body\":\"test\",\"year\":2025}");
        outbox.setStatus("PENDING");
        outbox.setPriority("MEDIUM");
        outbox.setRetryCount(retryCount);
        outbox.setMaxRetries(maxRetries);
        return outbox;
    }
}
