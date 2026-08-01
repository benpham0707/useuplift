import express from 'express';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  projectionId: '11111111-1111-4111-8111-111111111111',
  college: {
    institution_id: '22222222-2222-4222-8222-222222222222',
    unitid: 999004,
    name: 'Milestone Four University',
    slug: 'milestone-four-university',
    aliases: [], city: 'Oakland', state: 'CA', zip: '94601',
    ownership: 'private_nonprofit', institution_level: 'four_year', setting: null,
    undergraduate_enrollment: 4200, admission_rate: 0.42,
    tuition_in_state: null, tuition_out_of_state: null, net_price: 21000,
    coverage_score: 0.3, generated_at: '2026-08-01T00:00:00Z',
  },
  facts: [{
    field_key: 'admission_rate', display_value: '0.42',
    source_name: 'Fixture producer', source_release: 'fixture-2026',
    period_start: null, period_end: null, academic_year: 2025,
    cohort_key: 'all', cohort_label: 'all', quality_status: 'verified',
    is_estimate: false, is_suppressed: false, retrieved_at: '2026-08-01T00:00:00Z',
  }],
  sources: [{ data_releases: { source_release_name: 'fixture-2026', source_published_at: '2026-06-01T00:00:00Z', data_sources: { producer_name: 'Fixture producer' } } }],
}));

vi.mock('@/http/security', () => ({
  verifyClerkJWT: vi.fn(async () => ({ valid: true, userId: 'user_test123', claims: {} })),
  logSecurityEvent: vi.fn(),
  isValidClerkUserId: vi.fn(() => true),
}));

vi.mock('@/supabase/admin', () => ({
  supabaseAdmin: {
    from(table: string) {
      let slug: string | undefined;
      const builder: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'order', 'limit', 'textSearch', 'gte', 'lte', 'gt']) {
        builder[method] = (...args: unknown[]) => {
          if (method === 'eq' && args[0] === 'slug') slug = String(args[1]);
          return builder;
        };
      }
      builder.maybeSingle = async () => {
        if (table === 'projection_control') return { data: { active_projection_version_id: fixtures.projectionId }, error: null };
        if (table === 'college_profiles') return { data: slug === fixtures.college.slug ? fixtures.college : null, error: null };
        return { data: null, error: null };
      };
      builder.then = (resolve: (value: unknown) => void) => {
        if (table === 'college_profiles') resolve({ data: [fixtures.college], error: null });
        else if (table === 'college_profile_facts') resolve({ data: fixtures.facts, error: null });
        else if (table === 'projection_version_releases') resolve({ data: fixtures.sources, error: null });
        else resolve({ data: [], error: null });
      };
      return builder;
    },
  },
}));

import collegeRouter from '@/http/collegeRoutes';

describe('college API', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use('/colleges', collegeRouter);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it('rejects unauthenticated access', async () => {
    const response = await fetch(`${baseUrl}/colleges`);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: 'AUTH_REQUIRED' });
  });

  it('validates bounded query ranges after authentication', async () => {
    const response = await fetch(`${baseUrl}/colleges?admissionRateMin=0.8&admissionRateMax=0.2`, {
      headers: { Authorization: 'Bearer fixture' },
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'INVALID_QUERY' });
  });

  it('serves an authenticated page with version and provisional contract state', async () => {
    const response = await fetch(`${baseUrl}/colleges?limit=24`, {
      headers: { Authorization: 'Bearer fixture' },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      projectionVersionId: fixtures.projectionId,
      fieldContractStatus: 'provisional_pending_milestone_0',
      sources: [{ producer: 'Fixture producer', release: 'fixture-2026' }],
      data: [{ slug: fixtures.college.slug }],
    });
  });

  it('serves field-level provenance on authenticated detail', async () => {
    const response = await fetch(`${baseUrl}/colleges/${fixtures.college.slug}`, {
      headers: { Authorization: 'Bearer fixture' },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { slug: fixtures.college.slug, facts: [{ field_key: 'admission_rate', source_release: 'fixture-2026' }] },
    });
  });
});
