# Temple Registry E2E Test Platform

Deterministic end-to-end test system for governance workflows, permissions, status transitions, notifications, and timeline consistency.

## What This Covers

- Role-aware auth and permission boundaries (SA, DC, TA, Auditor, Viewer)
- Declaration lifecycle transitions and idempotency
- Trust governance re-submission and reject-edit behavior
- Validation guards (financial year, uniqueness, immutable-state updates)
- Notification and timeline consistency checks
- Existing UI workflows (auth, saved filters, directory behavior)

For the detailed module-by-module matrix, see [COMPLETE_E2E_COVERAGE_MATRIX.md](COMPLETE_E2E_COVERAGE_MATRIX.md).

## Architecture

- `fixtures/base.fixture.ts`: test context, DB client, API client, deterministic cleanup
- `fixtures/auth.fixture.ts`: authenticated browser contexts per role
- `fixtures/data.fixture.ts`: reusable temple/trust/declaration test data fixtures
- `lib/authenticated-request.ts`: raw authenticated `APIRequestContext` for exact status-code assertions
- `lib/role-api-client.ts`: role-based `ApiClient` creator for success-path workflow actions
- `setup/env.ts`: profile-driven environment resolution (`local`, `dev`, `staging`, `production`)

## Environment Setup

Create `e2e/.env` from `e2e/.env.example`.

Key variables:

- `E2E_TARGET`: `local | dev | staging | production`
- `E2E_READ_ONLY`: `true | false` (defaults to `true` for production target)
- `E2E_BASE_URL`: frontend URL
- `E2E_API_ORIGIN`: backend origin (without `/api/v1`)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `E2E_<ROLE>_USERNAME`, `E2E_<ROLE>_PASSWORD` for each role

## Running Tests

```bash
cd e2e
npm install

# Full run
npm test

# Targeted API lifecycle suites
npm test -- tests/auth-permissions.api.spec.ts tests/declaration-lifecycle.api.spec.ts tests/trust-governance.api.spec.ts tests/validation-and-transitions.api.spec.ts tests/timeline-notification.api.spec.ts

# UI mode
npm run test:ui

# Debug mode
npm run test:debug

# Report viewer
npm run report
```

## Stability and Determinism

- Deterministic IDs from `TestContext`
- Unique declaration year generation per run to avoid duplicate-year conflicts
- Poll-based async verification (`expect.poll`) for outbox/notification propagation
- Cleanup ordering managed centrally in `lib/test-context.ts`
- API-path normalization prevents `/auth/login` vs `/api/v1/auth/login` drift

## Retry and Parallelism

- Workers and retries are configurable via Playwright env:
	- `PLAYWRIGHT_WORKERS`
	- `PLAYWRIGHT_RETRIES`
- Defaults:
	- Local: 2 workers, 0 retries
	- CI: 4 workers, 1 retry

## Reporting

Configured reporters in `playwright.config.ts`:

- HTML: `playwright-report/`
- JSON: `test-results/results.json`
- JUnit: `test-results/junit.xml`

## CI

See [../.github/workflows/e2e-playwright.yml](../.github/workflows/e2e-playwright.yml) for the GitHub Actions workflow.

## Notes

- Production execution should use `E2E_READ_ONLY=true` and only read-safe suites.
- Some legacy suites still exist for backward compatibility and historical regression coverage.
