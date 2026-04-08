# Temple Registry — Copilot Instructions

## Architecture (non-negotiable)

**Backend:** Controller → Service → Service/Impl → Repository → Database  
**Frontend:** Page → Component → Hook → RTK Query API → Backend

Never invent alternate layers. Follow existing patterns in this codebase.

---

## Technology Stack

**Backend:** Java 21 · Spring Boot 3.x · Spring Data JPA · Spring Security + JWT · MapStruct · Lombok (controlled) · MySQL · Flyway · Swagger/OpenAPI  
**Frontend:** React 18 + TypeScript · Shadcn UI · Redux Toolkit · RTK Query · Zod · Axios (fallback only)

---

## API Contract

Base path: `/api/v1/`

**Success response:**
```json
{ "success": true, "message": "string", "data": {} }
```

**Error response:**
```json
{ "success": false, "message": "string", "errorCode": "TEMPLE_NOT_FOUND", "errors": [] }
```

No breaking changes in v1. Breaking changes require `/api/v2/`.

---

## Approval Workflow

All user-generated data flows: **Staging Table → Workflow → Main Table**

States: `DRAFT → SUBMITTED → APPROVED → REJECTED`

- Only `APPROVED` records are written to the main table.
- `REJECTED` status is immutable; enforce with a status-transition validator in the service layer.
- No direct writes to main table — every mutation goes through staging.

---

## Core Backend Rules

- Controllers: `ResponseEntity` only, `@Valid` on request bodies, no business logic, no try-catch.
- Services: all business logic lives here. Interface + Impl pattern. `@Transactional` on write methods; `@Transactional(readOnly = true)` on reads.
- All exceptions handled by a single `@RestControllerAdvice` — never catch in controllers.
- Entities always extend `BaseEntity` (UUID PK, audit fields, `is_deleted`). Never expose entities via APIs.
- Repositories: DB access only. Use `@EntityGraph` or `JOIN FETCH` to prevent N+1 queries.
- All DB schema changes via Flyway migrations only. Never modify the DB schema by hand.
- Authorization enforced at the service layer via `@PreAuthorize`. Deny by default.
- Pagination is mandatory on all list endpoints. Default page size: 10. Max: 100.

---

## Core Frontend Rules

- JWT stored in `httpOnly` cookie only. Never `localStorage`, `sessionStorage`, or Redux state.
- RTK Query for all server state and API calls. Redux slices for UI-only state only.
- Shadcn UI components exclusively. No MUI, Chakra, or other component libraries.
- No API calls inside components — all data fetching inside custom hooks.
- Every data-displaying component must handle loading, empty, and error states.
- Global RTK Query error-logger middleware handles API errors centrally.
- `<ErrorBoundary>` required at the application root.
- Zod for all form schema validation. Shadcn UI Form (built on React Hook Form + `zodResolver`) is the standard for all forms. Use `useFieldArray` from React Hook Form for dynamic field arrays.

---

## Naming Conventions

| Layer | Convention |
|---|---|
| Backend controller | `TempleController` |
| Backend service | `TempleService` / `TempleServiceImpl` |
| Backend DTOs | `CreateTempleRequest` / `TempleResponse` |
| Frontend page | `TempleListPage.tsx` |
| Frontend component | `TempleCard.tsx` |
| Frontend hook | `useTemple.ts` |
| Frontend API | `templeApi.ts` |

---

## Testing (mandatory)

- Every new service method must have a JUnit 5 + Mockito test in the same PR.
- Every new hook must have an RTL + Vitest test.
- Cover success, failure, and edge-case scenarios. No placeholder tests.
- Test naming: `should_<expected>_when_<condition>`

---

## Absolute Rules

- Do NOT guess requirements. If uncertain: ask, leave a `// TODO:` comment, or follow the nearest existing pattern.
- Do NOT add features, refactors, or comments beyond what was explicitly requested.
- Consistency over creativity. Match patterns already present in this codebase.
- No sensitive data in logs. No hardcoded secrets.
