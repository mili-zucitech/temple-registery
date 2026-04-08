---
applyTo: "**/*.{test,spec}.{ts,tsx,java}"
---

# Testing Standards — Temple Registry

## Core Principle

Every feature = a tested feature.  
No code change is complete without corresponding test updates.

---

## Backend — JUnit 5 + Mockito

### Scope
Test the **service layer** exclusively. Do not write unit tests for controllers (those are integration/slice tests) or repositories (those are data-layer tests).

### Scope

- Unit tests target the **service layer** exclusively.
- Controller tests use `@WebMvcTest` (slice). Repository tests use `@DataJpaTest` (slice). Full-context `@SpringBootTest` is for integration tests only.

### File Location

Mirror source tree under `src/test/java/`. Suffix: `*Test.java`.

### Test Class Setup

- Annotate with `@ExtendWith(MockitoExtension.class)`.
- Declare dependencies with `@Mock`. Inject into the class under test with `@InjectMocks`.
- Static import: `import static org.assertj.core.api.Assertions.*;`

### Test Naming Convention

`should_<expectedBehavior>_when_<condition>`

Examples:
- `should_returnTempleResponse_when_createCalledWithValidRequest`
- `should_throwEntityNotFoundException_when_templeIdDoesNotExist`
- `should_softDeleteTemple_when_deleteCalledWithValidId`
- `should_throwIllegalStateException_when_transitioningFromRejectedStatus`

### Required Test Scenarios Per Method

Every service method must have at minimum:

| Scenario | What to test |
|---|---|
| ✅ Success | Happy path — correct input → correct output |
| ❌ Failure | Domain failure — entity not found, constraint violation, invalid state |
| ⚠️ Edge case | Boundary values, null inputs, empty collections, max pagination |



### Assertions

- Use **AssertJ** (`assertThat`, `assertThatThrownBy`) — never bare JUnit `assertEquals` or `assertTrue`.
- Use `ArgumentCaptor` to verify complex objects passed to mocked repositories.

### Prohibited

- No `@SpringBootTest` in unit tests — that starts the full context (use it for integration tests only).
- No `Thread.sleep()` in tests.
- No placeholder tests: `@Test void test() {}` or `assertTrue(true)`.
- No assertions that always pass.

---

## Frontend — Vitest + React Testing Library

### File Location

Co-locate test files with source files. Suffix: `.test.ts` / `.test.tsx`.

### Test Utility

Define a `renderWithProviders` helper in `src/test/utils.tsx` that wraps with the Redux store, RTK Query provider, and Router. Use this in all `render()` and `renderHook()` calls. Never instantiate the store inline per test.

### Test Naming Convention

`should_<expectedBehavior>_when_<condition>` (inside `describe` blocks per function/component).

### Hook Tests — `renderHook`

- Use `renderHook` from `@testing-library/react` with the `renderWithProviders` wrapper for all hook tests.
- Mock at the HTTP layer using **MSW v2** (`http.get`, `http.post`, `HttpResponse.json`). Never mock RTK Query hooks directly with `vi.mock`.
- MSW server lifecycle: `beforeAll(server.listen)` · `afterEach(server.resetHandlers)` · `afterAll(server.close)`.

### Page Tests

- Render pages using `renderWithProviders`. Focus on what the user sees, not implementation details.
- Required states per page test: **loading**, **error**, **empty**, **data-populated**.

### Component Tests

- Test behavior and rendered output from the user's perspective.
- Use `const user = userEvent.setup()` then `await user.click(...)` (RTL v14+ / React 18 API). Never use the legacy `userEvent.click(element)` directly.

### Required Test Scenarios Per Unit

| Scenario | Frontend equivalent |
|---|---|
| ✅ Success | Data loads and renders correctly |
| ❌ Failure | Error state is shown (API error, validation error) |
| ⚠️ Edge case | Loading state, empty state, boundary values |

### Mock Strategy

- Use **MSW v2** (`http.get`, `http.post`, `HttpResponse.json`) for all HTTP mocking in frontend tests.
- Never mock RTK Query hooks directly (`vi.mock('./templeApi')`). Mock the HTTP layer via MSW instead.
- Exception: pure component tests receiving all data as props do not need MSW.

### Prohibited

- No `await new Promise(resolve => setTimeout(resolve, 500))` delay hacks.
- No snapshot tests as the primary assertion mechanism — snapshots are brittle. Test specific elements.
- No placeholder tests.
- Never mock `console.error` to suppress warnings — fix the root cause instead.
- Never skip tests for known failures (`it.skip`, `xit`). Fix or delete them.

---

## Test Coverage Expectations

| Layer | Minimum |
|---|---|
| Backend service methods | Every public method: success + failure + 1 edge case |
| Frontend hooks | Every exported hook: success, error, and loading state |
| Frontend pages | loading, error, empty, data-present states |
| Frontend components | Render + user interaction |

Coverage tools (Jest/Vitest `--coverage`, JaCoCo for Java) should be wired into CI. Coverage reports are required on PRs that introduce new service methods or hooks.

---

## When Updating Existing Code

- If you modify a service method, update its existing test to reflect the new behavior.
- If you add a new code path (e.g., a new `if` branch or exception), add a new test case for it.
- If you fix a bug, add a regression test proving the bug is fixed.
- Do NOT delete tests unless the code they test has been deleted.
