package com.templeregistry.service.notification.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * SSE (Server-Sent Events) real-time push service.
 *
 * Users subscribe via GET /api/v2/notifications/stream.
 * The server pushes badge count updates and notification previews in real-time.
 *
 * Connection management:
 *   - Emitters expire after 30 minutes (configurable).
 *   - On disconnect, emitter is removed from the registry.
 *   - Multiple browser tabs = multiple emitters per userId.
 */
@Service
@Slf4j
public class SseNotificationService {

    // userId → list of active emitters (multiple tabs per user)
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L; // 30 minutes

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);

        emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(()    -> remove(userId, emitter));
        emitter.onError(e       -> remove(userId, emitter));

        log.debug("[SSE] User {} subscribed (active emitters: {})", userId,
            emitters.getOrDefault(userId, new CopyOnWriteArrayList<>()).size());

        // Send keep-alive immediately to prevent browser timeout on first connect
        try {
            emitter.send(SseEmitter.event().name("connected").data("{\"status\":\"ok\"}"));
        } catch (IOException e) {
            remove(userId, emitter);
        }

        return emitter;
    }

    public void push(Long userId, String title, String body) {
        CopyOnWriteArrayList<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) return;

        String payload = String.format("{\"title\":\"%s\",\"body\":\"%s\"}",
            escapeJson(title), escapeJson(body));

        userEmitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().name("notification").data(payload));
            } catch (Exception e) {
                remove(userId, emitter);
            }
        });
    }

    public void pushBadgeCount(Long userId, long unreadCount) {
        CopyOnWriteArrayList<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) return;

        String payload = String.format("{\"unreadCount\":%d}", unreadCount);
        userEmitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().name("badge").data(payload));
            } catch (Exception e) {
                remove(userId, emitter);
            }
        });
    }

    private void remove(Long userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.get(userId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) emitters.remove(userId);
        }
    }

    private String escapeJson(String s) {
        return s == null ? "" : s.replace("\"", "\\\"").replace("\n", "\\n");
    }
}
