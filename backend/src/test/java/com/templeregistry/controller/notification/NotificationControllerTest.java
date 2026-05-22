package com.templeregistry.controller.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.notification.NotificationResponse;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.notification.NotificationService;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = NotificationController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class})
class NotificationControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean NotificationService notificationService;
    @MockBean PaginationUtil paginationUtil;
    @MockBean ScopeHelper scopeHelper;

    private static final Long USER_ID = 42L;

    @BeforeEach
    void setupAuth() {
        // Put a ScopeHelper.Claims principal into SecurityContext so currentUserId() works
        ScopeHelper.Claims claims = new ScopeHelper.Claims(USER_ID, "TEMPLE_AUTHORITY",
                1L, 10L, "ta_user", "EDIT");
        var auth = new UsernamePasswordAuthenticationToken(claims, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private NotificationResponse sampleNotification(Long id) {
        return NotificationResponse.builder()
                .id(id)
                .title("Test Notification")
                .body("You have a new event.")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    class ListNotifications {

        @Test
        void should_return200WithPage_when_notificationsExist() throws Exception {
            when(paginationUtil.clampSize(10)).thenReturn(10);
            Page<NotificationResponse> page = new PageImpl<>(
                    List.of(sampleNotification(1L)),
                    PageRequest.of(0, 10), 1L);
            when(notificationService.listNotifications(eq(USER_ID), any())).thenReturn(page);

            mockMvc.perform(get("/api/v1/notifications"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].id").value(1));
        }

        @Test
        void should_return200EmptyPage_when_noNotifications() throws Exception {
            when(paginationUtil.clampSize(10)).thenReturn(10);
            Page<NotificationResponse> page = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0L);
            when(notificationService.listNotifications(eq(USER_ID), any())).thenReturn(page);

            mockMvc.perform(get("/api/v1/notifications"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalElements").value(0));
        }
    }

    @Nested
    class MarkRead {

        @Test
        void should_return200_when_notificationMarkedRead() throws Exception {
            doNothing().when(notificationService).markRead(1L, USER_ID);

            mockMvc.perform(post("/api/v1/notifications/1/read"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Notification marked as read."));
        }
    }

    @Nested
    class MarkAllRead {

        @Test
        void should_return200WithCount_when_markAllRead() throws Exception {
            when(notificationService.markAllRead(USER_ID)).thenReturn(5);

            mockMvc.perform(post("/api/v1/notifications/read-all"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("5 notification(s) marked as read."));
        }

        @Test
        void should_return200WithZero_when_nothingToMarkRead() throws Exception {
            when(notificationService.markAllRead(USER_ID)).thenReturn(0);

            mockMvc.perform(post("/api/v1/notifications/read-all"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("0 notification(s) marked as read."));
        }
    }

    @Nested
    class Acknowledge {

        @Test
        void should_return200_when_notificationAcknowledged() throws Exception {
            doNothing().when(notificationService).acknowledge(1L, USER_ID);

            mockMvc.perform(post("/api/v1/notifications/1/acknowledge"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Notification acknowledged."));
        }
    }

    @Nested
    class DeleteNotification {

        @Test
        void should_return200_when_notificationDeleted() throws Exception {
            doNothing().when(notificationService).deleteNotification(1L, USER_ID);

            mockMvc.perform(delete("/api/v1/notifications/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Notification deleted."));
        }
    }

    @Nested
    class ClearAll {

        @Test
        void should_return200WithCount_when_allCleared() throws Exception {
            when(notificationService.clearAll(USER_ID)).thenReturn(3);

            mockMvc.perform(delete("/api/v1/notifications/clear-all"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("3 notification(s) cleared."));
        }
    }

    @Nested
    class DeleteBulk {

        @Test
        void should_return200WithCount_when_bulkDeleted() throws Exception {
            when(notificationService.deleteBulk(anyList(), eq(USER_ID))).thenReturn(2);

            mockMvc.perform(delete("/api/v1/notifications/bulk")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("[1, 2]"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("2 notification(s) deleted."));
        }

        @Test
        void should_return200WithZero_when_emptyList() throws Exception {
            mockMvc.perform(delete("/api/v1/notifications/bulk")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("[]"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Nothing to delete."));
        }
    }

    @Nested
    class UnreadCount {

        @Test
        void should_return200WithCount() throws Exception {
            when(notificationService.countUnread(USER_ID)).thenReturn(7L);

            mockMvc.perform(get("/api/v1/notifications/unread-count"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").value(7));
        }
    }
}
