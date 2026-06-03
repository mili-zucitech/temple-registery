package com.templeregistry.security;

import com.templeregistry.entity.accesscontrol.enums.SubjectType;
import com.templeregistry.service.accesscontrol.PolicyEvaluationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * AOP aspect that enforces {@link DacvmGuard} policies at the service layer.
 *
 * <p>Evaluation runs <em>after</em> Spring Security's {@code @PreAuthorize} (which operates via
 * its own {@code MethodSecurityInterceptor}). This means the structural role check always
 * happens first — DACVM is a tightening layer, never a bypass.</p>
 *
 * <p>Fail-closed: if the policy evaluation service is unavailable, access is denied.</p>
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class PolicyEnforcementAspect {

    private final PolicyEvaluationService policyEvaluationService;

    @Around("@annotation(dacvmGuard)")
    public Object enforce(ProceedingJoinPoint joinPoint, DacvmGuard dacvmGuard) throws Throwable {
        String targetKey = dacvmGuard.value();
        ScopeHelper.Claims claims = resolveClaimsOrNull();

        if (claims == null) {
            // Should not happen — @PreAuthorize would have blocked anonymous access first.
            // Fail closed for safety.
            throw new AccessDeniedException("Authentication required for DACVM-protected resource.");
        }

        // Evaluate USER-level policy first, then fall through to ROLE-level
        String role = claims.role();
        String userIdStr = claims.userId() != null ? claims.userId().toString() : "";

        try {
            // Check user-level policy (USER subject type with userId)
            boolean allowedByUser = policyEvaluationService.isAllowed(
                    targetKey, SubjectType.USER.name(), userIdStr);
            // Check role-level policy
            boolean allowedByRole = policyEvaluationService.isAllowed(
                    targetKey, SubjectType.ROLE.name(), role);

            if (!allowedByUser || !allowedByRole) {
                log.warn("DACVM DENIED: target={} role={} userId={}", targetKey, role, claims.userId());
                throw new AccessDeniedException(
                        "Access to '" + targetKey + "' has been restricted by an administrator.");
            }
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            // Fail closed — unexpected evaluation error means deny
            log.error("DACVM evaluation error for target={}: {}", targetKey, e.getMessage());
            throw new AccessDeniedException("Policy evaluation failed. Access denied for safety.");
        }

        return joinPoint.proceed();
    }

    private ScopeHelper.Claims resolveClaimsOrNull() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) return null;
            Object principal = auth.getPrincipal();
            return (principal instanceof ScopeHelper.Claims c) ? c : null;
        } catch (Exception e) {
            return null;
        }
    }
}
