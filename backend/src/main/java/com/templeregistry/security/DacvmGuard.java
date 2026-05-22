package com.templeregistry.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a service method as protected by the DACVM policy engine.
 *
 * <p>The {@link PolicyEnforcementAspect} intercepts methods annotated with {@code @DacvmGuard}
 * and evaluates the named {@code targetKey} against the current principal's effective policies.
 * If the policy engine returns DENY, {@link org.springframework.security.access.AccessDeniedException}
 * is thrown and handled by {@link com.templeregistry.exception.GlobalExceptionHandler} as HTTP 403.</p>
 *
 * <p>This annotation is intentionally applied <em>in addition to</em> existing {@code @PreAuthorize}
 * annotations — it never replaces structural role-based access control.</p>
 *
 * <p>Usage example:</p>
 * <pre>{@code
 *   @DacvmGuard("report.dc.export.temples")
 *   @PreAuthorize(RoleConstants.CAN_READ_ALL)
 *   public byte[] exportTemples(...) { ... }
 * }</pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DacvmGuard {
    /** The namespaced target key to evaluate, e.g. {@code "report.dc.export.temples"}. */
    String value();
}
