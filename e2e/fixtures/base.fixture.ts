import { test as base } from '@playwright/test';
import { DbClient } from '../lib/db-client';
import { ApiClient } from '../lib/api-client';
import { TestContext } from '../lib/test-context';
import { DbAssertions } from '../lib/assertions';
import { env } from '../setup/env';

export type BaseFixtures = {
  testContext: TestContext;
  db: DbClient;
  api: ApiClient;
  dbAssert: DbAssertions;
};

export const test = base.extend<BaseFixtures>({
  testContext: async ({}, use, testInfo) => {
    const context = new TestContext(testInfo.testId);
    await use(context);
    await context.cleanup();
  },

  db: async ({ testContext }, use) => {
    const client = new DbClient(env.db);
    
    await client.connect();
    await use(client);
    await client.disconnect();
  },

  api: async ({ testContext }, use) => {
    const client = new ApiClient({
      baseURL: env.apiV1Base,
      testRunId: testContext.testRunId
    });

    await client.login(env.roles.SA.username, env.roles.SA.password);
    
    await use(client);
    await client.dispose();
  },

  dbAssert: async ({ db }, use) => {
    const assertions = new DbAssertions(db);
    await use(assertions);
  }
});

export { expect } from '@playwright/test';
