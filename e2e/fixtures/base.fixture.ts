import { test as base } from '@playwright/test';
import { DbClient } from '../lib/db-client';
import { ApiClient } from '../lib/api-client';
import { TestContext } from '../lib/test-context';
import { DbAssertions } from '../lib/assertions';

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
    const client = new DbClient({
      host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: parseInt(process.env.DB_PORT || '4000'),
      user: process.env.DB_USER || '3Nkwm2fKtuGqoiu.root',
      password: process.env.DB_PASSWORD || '6sXYNlDhrX80xnDz',
      database: process.env.DB_NAME || 'test'
    });
    
    await client.connect();
    await use(client);
    await client.disconnect();
  },

  api: async ({ testContext }, use) => {
    const client = new ApiClient({
      baseURL: process.env.API_BASE_URL || 'http://localhost:8080/api/v1',
      testRunId: testContext.testRunId
    });

    await client.login('super_admin', 'password123');
    
    await use(client);
    await client.dispose();
  },

  dbAssert: async ({ db }, use) => {
    const assertions = new DbAssertions(db);
    await use(assertions);
  }
});

export { expect } from '@playwright/test';
