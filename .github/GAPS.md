# Temple Registry — Gaps & Loopholes Analysis

**Date:** 2026-04-07  
**Source:** Original Copilot instructions document reviewed and audited.  
**Status:** Resolved items are incorporated into the `.github/instructions/` files. Open items require team decisions.

---

## How to Use This Document

Each entry has:
- **Gap / Loophole** — what is missing or exploitable
- **Risk** — what goes wrong if it is not addressed
- **Resolution** — what was done or what needs to be done

Entries marked ✅ are already resolved in the instructions files.  
Entries marked ⚠️ require a team decision or further design work.  
Entries marked 🔴 are high-risk and must be addressed before the first production release.

---

## Gaps (Missing Specifications)

### G01 — No Global Exception Handler Pattern ✅
**Gap:** "No try-catch in controllers" was stated but no global handler was defined. Without one, unhandled exceptions produce stack traces in HTTP responses.  
**Risk:** Information leakage; poor developer experience; inconsistent error envelopes.  
**Resolution:** `backend.instructions.md` now mandates a single `@RestControllerAdvice` class (`GlobalExceptionHandler`) as the only exception catch point. Pattern and example provided.

---

### G02 — No `BaseEntity` / `@MappedSuperclass` Definition ✅
**Gap:** "Audit fields mandatory" was stated but no base class was defined. Developers would implement audit fields inconsistently.  
**Risk:** Missing `created_at`, `updated_at`, `is_deleted` on some entities; UUID generation inconsistency.  
**Resolution:** `backend.instructions.md` defines `BaseEntity` with `@PrePersist` / `@PreUpdate` lifecycle hooks, UUID generation via `UUID.randomUUID()`, and all mandatory audit fields.

---

### G03 — Flyway vs. Liquibase — Both Listed ✅
**Gap:** Both migration tools were listed in the tech stack with no decision.  
**Risk:** Teams use different tools; migrations may be duplicated or conflicting.  
**Resolution:** **Flyway** selected. `backend.instructions.md` specifies Flyway-only with naming convention `V{n}__{description}.sql` and directory `src/main/resources/db/migration/`.

---

### G04 — Zod vs. Yup — Both Listed ✅
**Gap:** Both validation libraries were listed with no decision.  
**Risk:** Both libraries imported; inconsistent schema definitions.  
**Resolution:** **Zod** selected. `frontend.instructions.md` mandates Zod as the single source of truth for TypeScript types + runtime validation.

---

### G05 — Frontend Token Storage Not Specified ✅
**Gap:** "Never use localStorage" was stated but no alternative was given.  
**Risk:** Developers default to `localStorage` or Redux state, both of which are XSS-vulnerable.  
**Resolution:** **httpOnly cookie** mandated. `frontend.instructions.md` specifies: JWT set by backend via `Set-Cookie`, `credentials: 'include'` on all API calls, never parse/decode the token on the frontend. Logout must call backend to clear the cookie.

---

### G06 — Application Roles Never Defined ⚠️
**Gap:** RBAC is required but no role constants are named anywhere.  
**Risk:** Developers create inconsistent role names (e.g., `ADMIN` vs `TEMPLE_ADMIN` vs `ROLE_TEMPLE_ADMIN`). Spring Security role prefix conventions ignored.  
**Resolution:** Added `// TODO` placeholders in `backend.instructions.md`. **Action required:** Define a `RoleConstants` class before implementing any `@PreAuthorize` annotations.

```java
// TODO: Define before Sprint 1
public final class RoleConstants {
    public static final String SUPER_ADMIN   = "ROLE_SUPER_ADMIN";
    public static final String TEMPLE_ADMIN  = "ROLE_TEMPLE_ADMIN";
    public static final String DEVOTEE       = "ROLE_DEVOTEE";
    public static final String AUDITOR       = "ROLE_AUDITOR";
}
```

---

### G07 — No Soft-Delete Hibernate Filter ✅
**Gap:** `is_deleted` was defined as mandatory but no Hibernate filter was specified. JPA queries would return soft-deleted records.  
**Risk:** Deleted records appear in all `findAll()` and `findById()` queries.  
**Resolution:** `backend.instructions.md` mandates `@Where(clause = "is_deleted = false")` on every entity and `@SQLDelete` for soft-delete on `deleteById`.

---

### G08 — No `PaginatedResponse<T>` Wrapper ✅
**Gap:** "Pagination mandatory" was stated but no standard response wrapper was defined. Each developer would invent their own response shape.  
**Risk:** Inconsistent pagination envelopes across endpoints; frontend can't depend on a stable shape.  
**Resolution:** `backend.instructions.md` defines `PaginatedResponse<T>` with `content`, `page`, `size`, `totalElements`, `totalPages`, `last` fields and a static `of(Page<T>)` factory method.

---

### G09 — UUID Generation Strategy Not Specified ✅
**Gap:** `CHAR(36)` was specified for PK storage but it was not decided whether UUID generation is app-side or DB-side.  
**Risk:** DB-generated UUIDs vary by MySQL version; may conflict with JPA identity strategy.  
**Resolution:** App-generated via `UUID.randomUUID()` in `@PrePersist`. `backend.instructions.md` specifies this explicitly; never use `@GeneratedValue(strategy = GenerationType.IDENTITY)`.

---

### G10 — Section 17 Numbering Conflict (Minor) ✅
**Gap:** The original document had two "Section 17" entries (Testing and Test Enforcement Rule).  
**Risk:** Confused readers; section references in code comments would be ambiguous.  
**Resolution:** The instructions files reorganise all testing rules into a single `testing.instructions.md`. Section numbering is not used in the generated files.

---

### G11 — No CORS Policy ✅
**Gap:** No CORS configuration was mentioned. Without it, frontend–backend communication is blocked in development and can be misconfigured in production.  
**Risk:** Browser blocks requests; developers add `@CrossOrigin("*")` on controllers as a workaround, which is insecure.  
**Resolution:** `backend.instructions.md` mandates a `WebMvcConfigurer` `CorsConfig` bean with allowed origins sourced from `application-{profile}.yml`. `@CrossOrigin` on controllers is prohibited.

---

### G12 — No Rate Limiting / Throttling Mention ⚠️
**Gap:** No rate limiting strategy defined.  
**Risk:** Unauthenticated endpoints (login, OTP, registration) are vulnerable to brute-force attacks.  
**Resolution:** Not yet implemented in instructions. **Action required:** Decide on approach:
- Option A: Spring Boot + Bucket4j (in-process rate limiting)
- Option B: API Gateway / Load Balancer level throttling

Apply at minimum to: `/api/v1/auth/login`, `/api/v1/auth/register`, any OTP endpoint.

---

### G13 — No Environment Configuration Strategy ✅
**Gap:** No guidance on managing environment-specific config or secrets.  
**Risk:** Hardcoded passwords/URLs committed to version control; production credentials in dev config files.  
**Resolution:** `backend.instructions.md` specifies `application.yml` for defaults, `application-{profile}.yml` for environment-specific config, environment variables or secrets manager for credentials, and explicitly prohibits committing `application-prod.yml` with real credentials.

---

### G14 — N+1 Prevention Guidance Was Vague ✅
**Gap:** "Avoid N+1" was stated but no mechanism was specified.  
**Risk:** Lazy-loaded associations trigger N+1 queries in loops without developers realising.  
**Resolution:** `backend.instructions.md` mandates `@EntityGraph` or `JOIN FETCH` on every query that fetches associations. Explicitly prohibits relying on lazy loading to resolve associations inside loops.

---

### G15 — "antd Insufficient" Criterion Undefined ✅
**Gap:** React Hook Form was listed as "only when antd Form is insufficient" but the trigger condition was not defined.  
**Risk:** React Hook Form used arbitrarily; Ant Design Form abandoned; two form libraries in the codebase.  
**Resolution:** `frontend.instructions.md` defines the exact trigger: **React Hook Form is permitted only for dynamic field arrays (`useFieldArray`)**. All other forms use Ant Design Form.

---

### G16 — No `<ErrorBoundary>` Rule ✅
**Gap:** Error boundaries not mentioned at all.  
**Risk:** Uncaught React render errors crash the entire application with a blank screen.  
**Resolution:** `frontend.instructions.md` mandates `<ErrorBoundary>` at the application root.

---

### G17 — No File Upload Rules ✅
**Gap:** File uploads not addressed in either backend or frontend rules.  
**Risk:** Unrestricted file types and sizes uploaded; MIME type spoofing not prevented; BLOBs stored in DB.  
**Resolution:**
- `backend.instructions.md`: max 5 MB, allowed types `image/jpeg / image/png / application/pdf`, store file path (not binary) in DB.
- `frontend.instructions.md`: `antd Upload` + `beforeUpload` client-side validation with same constraints.

---

### G18 — Soft-Delete Cascade Undefined ✅
**Gap:** "Soft delete mandatory" but no rule for what happens when a parent entity is soft-deleted.  
**Risk:** Parent deleted → children remain visible and queryable as orphans.  
**Resolution:** `backend.instructions.md` mandates: when a parent is soft-deleted, all children in the same aggregate must be soft-deleted within the same transaction.

---

### G19 — No i18n / Localization Strategy ⚠️
**Gap:** No internationalization strategy mentioned.  
**Risk:** Retrofitting i18n after the fact is expensive. Hardcoded strings in components create technical debt.  
**Resolution (interim):** All user-facing strings should be extracted into constants files now (e.g., `src/constants/messages.ts`) even if i18n is not a v1 requirement. This makes future i18n adoption low-cost. **Action required:** Decide if i18n is a v2 requirement and whether to adopt `react-i18next` now.

---

### G20 — Staging Table Structure Undefined ⚠️
**Gap:** The approval workflow is described functionally but no structural schema guidance for staging tables was given.  
**Risk:** Developers create inconsistent staging table designs across modules.  
**Resolution:** `backend.instructions.md` defines staging table columns:  
```
id CHAR(36) PK, all main table columns mirrored, status VARCHAR(20) (indexed),
submitted_at DATETIME, reviewed_at DATETIME, reviewed_by VARCHAR(100),
FK to main table (nullable until APPROVED)
```
**Action required:** Create a `BaseWorkflowEntity` that staging entities can extend, mirroring the pattern of `BaseEntity`.

---

## Loopholes (Rules That Can Be Bypassed Unintentionally)

### L01 — "No try-catch in controllers" Without a Global Handler 🔴 ✅
**Loophole:** Removing try-catch from controllers without a `@RestControllerAdvice` causes Spring Boot to return default error responses (with stack traces in development mode).  
**How it breaks:** Default Spring error response leaks class names and potentially sensitive state.  
**Fix:** `GlobalExceptionHandler` with `@RestControllerAdvice` is now mandatory (see G01). Must be created before any controller.

---

### L02 — "Authorization at Service Layer" With No Annotation Spec 🔴 ✅
**Loophole:** Stating "authorization enforced at service layer" without specifying the mechanism allows developers to skip it or implement it inconsistently.  
**How it breaks:** All endpoints are accessible to all authenticated users.  
**Fix:** `backend.instructions.md` mandates `@PreAuthorize` at the service method level for every method that modifies state. Global method security must be enabled: `@EnableMethodSecurity` on the security config class.

---

### L03 — "No Direct Main Table Writes" Has No Enforcement Mechanism 🔴 ⚠️
**Loophole:** The rule is stated but nothing prevents a developer from autowiring `TempleRepository` directly into a service and writing to the main table.  
**How it breaks:** Workflow bypassed entirely; unreviewed data in the main table.  
**Fix options:**
- Option A: Repository access control — rename main table repositories to `TempleReadRepository` (read-only) and restrict `save()` / `delete()` to a dedicated `WorkflowService`.
- Option B: Code review checklist item: "Does this PR write to a main table repository outside of WorkflowService?"
- **Recommended:** Option A. **Action required:** Implement access pattern before Sprint 1.

---

### L04 — "REJECTED Status Is Immutable" Has No Guard ✅
**Loophole:** The immutability is stated as a rule but nothing enforces it in code.  
**How it breaks:** An update call can change a REJECTED record's status to DRAFT, bypassing the audit trail.  
**Fix:** `backend.instructions.md` defines a `validateTransition()` method pattern in the service layer that throws `IllegalStateException` when attempting to transition out of `REJECTED`.

---

### L05 — "< 500ms Response Target" Is Unverifiable ⚠️
**Loophole:** A performance target without measurement is aspirational, not enforceable.  
**How it breaks:** Nobody measures; performance regressions go undetected until production.  
**Fix:** **Action required:** Integrate Spring Boot Actuator + Micrometer + a metrics backend (e.g., Prometheus + Grafana, or AWS CloudWatch). Add a `@Timed` annotation on service methods for automatic histogram collection. Set up alerting for p95 > 500ms.

---

### L06 — "No Sensitive Data in Logs" Without a Sanitizer ⚠️
**Loophole:** "No sensitive data in logs" is stated but no mechanism prevents it. A developer calling `log.info("User: {}", user)` on a full entity exposes passwords, PII, and tokens.  
**How it breaks:** Passwords, JWT tokens, and PII in log files. Potential compliance violations (GDPR, PCI-DSS).  
**Fix options:**
- Option A: `@JsonIgnore` on sensitive entity fields + custom `toString()` on entities (never use Lombok `@ToString` on entities with sensitive fields).
- Option B: MDC pattern — log only IDs and action names, never full objects.
- Option C: Log sanitizer utility: `LogSanitizer.mask(value)` for fields like password, token, cardNumber.
- **Recommended:** Option B + `@ToString(exclude = {"password", "token"})` on relevant classes.

---

## Summary of Open Action Items

| ID | Action | Priority | Owner |
|---|---|---|---|
| G06 | Define `RoleConstants` class with all application roles | 🔴 High | Architect/Team Lead |
| G12 | Choose and implement rate limiting strategy | 🔴 High | Backend Team |
| G19 | Decide on i18n strategy (v1 or v2) | 🟡 Medium | Product Owner |
| G20 | Create `BaseWorkflowEntity` for staging tables | 🟡 Medium | Backend Team |
| L03 | Implement repository access pattern to enforce workflow | 🔴 High | Backend Team |
| L05 | Set up Actuator + Micrometer + alerting for p95 latency | 🟡 Medium | DevOps/Backend |
| L06 | Implement log sanitization strategy | 🟡 Medium | Backend Team |
