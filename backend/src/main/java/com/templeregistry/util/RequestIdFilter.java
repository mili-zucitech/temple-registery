package com.templeregistry.util;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Servlet filter that injects a unique request-id into MDC for structured log correlation.
 * Reads X-Request-ID header if provided by client/gateway; generates one otherwise.
 */
@Component
@Order(1)
public class RequestIdFilter implements Filter {

    static final String REQUEST_ID_HEADER = "X-Request-ID";
    static final String MDC_KEY = "requestId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        String requestId = null;
        if (request instanceof HttpServletRequest httpReq) {
            requestId = httpReq.getHeader(REQUEST_ID_HEADER);
        }
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }
        MDC.put(MDC_KEY, requestId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
