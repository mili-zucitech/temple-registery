import { ApiClient } from './api-client';
import { env, RoleKey } from '../setup/env';

export async function createRoleApiClient(testRunId: string, role: RoleKey): Promise<ApiClient> {
  const client = new ApiClient({
    baseURL: env.apiV1Base,
    testRunId,
  });

  const credential = env.roles[role];
  await client.login(credential.username, credential.password);
  return client;
}
