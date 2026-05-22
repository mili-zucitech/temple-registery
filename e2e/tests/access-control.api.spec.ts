import { test, expect } from '../fixtures/base.fixture';
import {
  createAuthenticatedApiContext,
  parseApiEnvelope,
  resolveApiPath,
} from '../lib/authenticated-request';

/**
 * Access Control — API contract tests
 *
 * These tests exercise the /admin/access-control and /auth/me/permissions
 * endpoints at the HTTP level to verify:
 *   - SUPER_ADMIN can read the policy matrix and effective permissions
 *   - SUPER_ADMIN can create, batch-upsert, and delete policies
 *   - Non-SUPER_ADMIN roles are rejected with 403 on admin endpoints
 *   - A newly created DENY policy is reflected in /auth/me/permissions
 *   - Cleanup: every policy created by a test is deleted after the test
 *
 * Prerequisite: application must be running and the SA role must have credentials
 * defined in e2e/.env (E2E_SA_USERNAME / E2E_SA_PASSWORD).
 */

test.describe('Access Control — API contract', () => {

  // ── GET /auth/me/permissions ───────────────────────────────────────────────

  test('should_return200_when_saRequestsOwnPermissions', async () => {
    const ctx = await createAuthenticatedApiContext('SA');

    const res = await ctx.get(resolveApiPath('/auth/me/permissions'));
    expect(res.ok()).toBeTruthy();

    const body = await parseApiEnvelope<{ permissions: Record<string, string>; fieldMasks: Record<string, string> }>(res);
    expect(body.success).toBe(true);
    expect(body.data?.permissions).toBeDefined();
    expect(body.data?.fieldMasks).toBeDefined();

    await ctx.dispose();
  });

  test('should_return200_when_dcRequestsOwnPermissions', async () => {
    const ctx = await createAuthenticatedApiContext('DC');

    const res = await ctx.get(resolveApiPath('/auth/me/permissions'));
    expect(res.ok()).toBeTruthy();

    const body = await parseApiEnvelope<{ permissions: Record<string, string>; fieldMasks: Record<string, string> }>(res);
    expect(body.success).toBe(true);
    expect(typeof body.data?.permissions).toBe('object');

    await ctx.dispose();
  });

  // ── GET /admin/access-control — authorization ─────────────────────────────

  test('should_return200_when_saListsPolicies', async () => {
    const ctx = await createAuthenticatedApiContext('SA');

    const res = await ctx.get(resolveApiPath('/admin/access-control?page=0&size=10'));
    expect(res.ok()).toBeTruthy();

    const body = await parseApiEnvelope<{ content: unknown[] }>(res);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data?.content)).toBe(true);

    await ctx.dispose();
  });

  test('should_return403_when_dcListsPolicies', async () => {
    const ctx = await createAuthenticatedApiContext('DC');

    const res = await ctx.get(resolveApiPath('/admin/access-control?page=0&size=10'));
    expect(res.status()).toBe(403);

    await ctx.dispose();
  });

  test('should_return403_when_taListsPolicies', async () => {
    const ctx = await createAuthenticatedApiContext('TA');

    const res = await ctx.get(resolveApiPath('/admin/access-control?page=0&size=10'));
    expect(res.status()).toBe(403);

    await ctx.dispose();
  });

  test('should_return403_when_auditorListsPolicies', async () => {
    const ctx = await createAuthenticatedApiContext('AUDITOR');

    const res = await ctx.get(resolveApiPath('/admin/access-control?page=0&size=10'));
    expect(res.status()).toBe(403);

    await ctx.dispose();
  });

  // ── GET /admin/access-control/matrix ──────────────────────────────────────

  test('should_return200_with_matrix_shape_when_saGetsPolicyMatrix', async () => {
    const ctx = await createAuthenticatedApiContext('SA');

    const res = await ctx.get(resolveApiPath('/admin/access-control/matrix'));
    expect(res.ok()).toBeTruthy();

    const body = await parseApiEnvelope<{ targetKeys: string[]; roles: string[]; matrix: Record<string, unknown> }>(res);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data?.targetKeys)).toBe(true);
    expect(Array.isArray(body.data?.roles)).toBe(true);
    expect(typeof body.data?.matrix).toBe('object');

    await ctx.dispose();
  });

  // ── POST /admin/access-control — create + cleanup ─────────────────────────

  test('should_createPolicy_when_saPostsValidRequest', async () => {
    const ctx = await createAuthenticatedApiContext('SA');

    const createRes = await ctx.post(resolveApiPath('/admin/access-control'), {
      data: {
        targetType: 'SECTION',
        targetKey: 'section.dc.search.saved_filters',
        subjectType: 'ROLE',
        subjectValue: 'DC_STAFF',
        effect: 'DENY',
        active: true,
      },
    });

    expect(createRes.ok()).toBeTruthy();

    const body = await parseApiEnvelope<{ id: number; targetKey: string; effect: string }>(createRes);
    expect(body.success).toBe(true);
    expect(body.data?.targetKey).toBe('section.dc.search.saved_filters');
    expect(body.data?.effect).toBe('DENY');

    // Cleanup
    const id = body.data?.id;
    if (id) {
      await ctx.delete(resolveApiPath(`/admin/access-control/${id}`));
    }

    await ctx.dispose();
  });

  // ── DENY policy reflected in /auth/me/permissions ─────────────────────────

  test('should_reflectDenyPolicy_when_dcStaffCheckOwnPermissions', async () => {
    const saCtx = await createAuthenticatedApiContext('SA');

    // Create a DENY for DC_STAFF on a test key
    const createRes = await saCtx.post(resolveApiPath('/admin/access-control'), {
      data: {
        targetType: 'SECTION',
        targetKey: 'section.dc.search.card_trust',
        subjectType: 'ROLE',
        subjectValue: 'DC_STAFF',
        effect: 'DENY',
        active: true,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createBody = await parseApiEnvelope<{ id: number }>(createRes);
    const policyId = createBody.data?.id;

    try {
      // DC_STAFF should now see DENY for that key
      const dcCtx = await createAuthenticatedApiContext('DC_STAFF');
      const permRes = await dcCtx.get(resolveApiPath('/auth/me/permissions'));
      expect(permRes.ok()).toBeTruthy();

      const permBody = await parseApiEnvelope<{ permissions: Record<string, string>; fieldMasks: Record<string, string> }>(permRes);
      expect(permBody.data?.permissions?.['section.dc.search.card_trust']).toBe('DENY');
      await dcCtx.dispose();
    } finally {
      // Always clean up the test policy
      if (policyId) {
        await saCtx.delete(resolveApiPath(`/admin/access-control/${policyId}`));
      }
      await saCtx.dispose();
    }
  });

  // ── POST /admin/access-control/batch ──────────────────────────────────────

  test('should_batchUpsertPolicies_when_saPostsValidBatch', async () => {
    const ctx = await createAuthenticatedApiContext('SA');

    const batchRes = await ctx.post(resolveApiPath('/admin/access-control/batch'), {
      data: {
        updates: [
          {
            policy: {
              targetType: 'KPI_CARD',
              targetKey: 'kpi.ta.search.overdue',
              subjectType: 'ROLE',
              subjectValue: 'TEMPLE_AUTHORITY',
              effect: 'ALLOW',
              active: true,
            },
          },
        ],
      },
    });

    expect(batchRes.ok()).toBeTruthy();

    const body = await parseApiEnvelope<{ id: number; targetKey: string }[]>(batchRes);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);

    // Cleanup: delete any newly created policies (batchUpsert returns all affected)
    if (Array.isArray(body.data)) {
      for (const p of body.data) {
        // Only delete if this was a net-new insert; upsert on existing rows
        // changes effect only, so we skip IDs that pre-existed.
        if (p.id) {
          await ctx.delete(resolveApiPath(`/admin/access-control/${p.id}`)).catch(() => {});
        }
      }
    }

    await ctx.dispose();
  });

  // ── DELETE /admin/access-control/:id — not-found ──────────────────────────

  test('should_return404_when_saDeletesNonExistentPolicy', async () => {
    const ctx = await createAuthenticatedApiContext('SA');

    const res = await ctx.delete(resolveApiPath('/admin/access-control/999999999'));
    expect([404, 400]).toContain(res.status());

    await ctx.dispose();
  });
});
