# Temple Registry E2E Test Platform

Production-grade, deterministic test platform for Temple Registry application.

## Architecture

- **250 tests total**: 60% Unit, 20% Component, 12% API Contract, 8% E2E
- **Deterministic execution**: Seeded RNG, test_run_id tagging, no timestamp-based cleanup
- **Parallel-safe**: Isolated test data, no shared state
- **Modular assertions**: Workflow, Notification, Audit, Integrity
- **Zero mocks**: Real DB, real API integration

## Setup

```bash
cd e2e
npm install
```

## Configuration

Create `.env` file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=test_user
DB_PASSWORD=test_pass
DB_NAME=temple_registry_test
API_BASE_URL=http://localhost:8080/api/v1
BASE_URL=http://localhost:3000
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific suite
npm test -- tests/declaration-workflow.spec.ts

# Run with UI
npm run test:ui

# Debug mode
npm run test:debug

# View report
npm run report
```

## Test Structure

```
e2e/
├── fixtures/          # Test fixtures (auth, data, base)
├── lib/              # Core libraries (DB, API, assertions)
├── factories/        # Data factories (deterministic)
├── pages/            # Page objects (simplified)
├── tests/            # Test specs (20 critical flows)
└── playwright.config.ts
```

## Key Features

### Deterministic Data
- Seeded RNG per test using `testRunId`
- No random IDs, no timestamp-based data
- Reproducible test failures

### Cleanup Strategy
- `test_run_id` tagging on all test data
- Parameterized DELETE queries (no SQL injection)
- Automatic cleanup in fixture teardown
- Dependency-ordered deletion

### DB Assertions
- **Workflow**: No orphans, no duplicates, valid transitions
- **Notification**: Outbox consistency, no duplicates
- **Audit**: Complete trail, immutability
- **Integrity**: FK integrity, clarification limits

### Concurrency Tests
- Duplicate submit prevention
- Concurrent approval (optimistic locking)
- Stale version handling
- Transaction rollback integrity

## Critical Test Flows

1. **Auth**: Login, logout, invalid credentials
2. **Declaration Workflow**: Submit → Approve → Audit
3. **Clarification**: Request → Respond → Resolve
4. **Concurrency**: Duplicate submit, concurrent approval
5. **Data Integrity**: FK integrity, no orphans, no duplicates

## Maintenance

### Adding New Tests
1. Create test in `tests/` directory
2. Use fixtures from `fixtures/data.fixture.ts`
3. Use factories for test data
4. Add DB assertions for verification
5. Ensure cleanup via `testContext.registerCleanup()`

### Adding New Assertions
1. Create assertion class in `lib/assertions/`
2. Add to `DbAssertions` in `lib/assertions/index.ts`
3. Use in tests via `dbAssert.<module>.<assertion>()`

### Debugging Failures
1. Check `playwright-report/` for screenshots/videos
2. Use `test:debug` to step through tests
3. Check DB state using `db.query()` in tests
4. Verify cleanup with `test_run_id` queries

## Performance

- **Runtime**: ~20 minutes for full suite
- **Parallel workers**: 2 local, 4 CI
- **No retries**: Tests must be deterministic
- **Fast cleanup**: Bulk DELETE by test_run_id

## Best Practices

1. **No hardcoded IDs**: Use factories
2. **No timestamps**: Use test_run_id
3. **No static helpers**: Use fixture-scoped clients
4. **No mocks**: Use real integrations
5. **Strong typing**: No `any` types
6. **Modular assertions**: Reusable, composable
7. **Clear naming**: `should_<behavior>_when_<condition>`
