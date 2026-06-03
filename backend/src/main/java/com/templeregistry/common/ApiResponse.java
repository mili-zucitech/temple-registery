package com.templeregistry.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import org.slf4j.MDC;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final String message;
    private final T data;
    private final String errorCode;
    private final List<String> errors;
    private final String timestamp;
    private final String requestId;

    private ApiResponse(boolean success, String message, T data,
                        String errorCode, List<String> errors) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.errorCode = errorCode;
        this.errors = errors;
        this.timestamp = Instant.now().toString();
        this.requestId = resolveRequestId();
    }

    private static String resolveRequestId() {
        String requestId = MDC.get("requestId");
        if (requestId == null || requestId.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return requestId;
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, null, null);
    }

    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null, null, null);
    }

    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return new ApiResponse<>(false, message, null, errorCode, null);
    }

    public static <T> ApiResponse<T> validationError(String message, List<String> errors) {
        return new ApiResponse<>(false, message, null, "VALIDATION_ERROR", errors);
    }
}
