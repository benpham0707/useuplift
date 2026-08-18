import express from 'express';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
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
    program_area_codes: ['11', '14'], program_area_labels: ['Computer Science', 'Engineering'],
  },
  listItem: {
    id: '33333333-3333-4333-8333-333333333333',
    institution_id: '22222222-2222-4222-8222-222222222222',
    category: null, status: 'interested', notes: null, position: null,
    added_at: '2026-08-17T00:00:00Z', updated_at: '2026-08-17T00:00:00Z',
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
      let operation = 'select';
      const filters = new Map<string, unknown>();
      const builder: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'order', 'limit', 'textSearch', 'ilike', 'gte', 'lte', 'gt', 'not', 'in', 'contains', 'upsert', 'update', 'delete']) {
        builder[method] = (...args: unknown[]) => {
          fixtures.calls.push({ table, method, args });
          if (method === 'eq') filters.set(String(args[0]), args[1]);
          if (['upsert', 'update', 'delete'].includes(method)) operation = method;
          return builder;
        };
      }
      builder.maybeSingle = async () => {
        if (table === 'projection_control') return { data: { active_projection_version_id: fixtures.projectionId }, error: null };
        if (table === 'college_profiles') {
          const slug = filters.get('slug');
          const institutionId = filters.get('institution_id');
          return { data: slug === fixtures.college.slug || institutionId === fixtures.college.institution_id ? fixtures.college : null, error: null };
        }
        if (table === 'user_college_list_items' && ['upsert', 'update'].includes(operation)) return { data: fixtures.listItem, error: null };
        return { data: null, error: null };
      };
      builder.single = async () => ({ data: fixtures.listItem, error: null });
      builder.then = (resolve: (value: unknown) => void) => {
        if (table === 'college_profiles') resolve({ data: [fixtures.college], error: null });
        else if (table === 'college_profile_facts') resolve({ data: fixtures.facts, error: null });
        else if (table === 'projection_version_releases') resolve({ data: fixtures.sources, error: null });
        else if (table === 'user_college_list_items') resolve({ data: operation === 'delete' ? null : [fixtures.listItem], error: null });
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
    app.use(express.json());
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

  it.each([
    'enrollmentMin=15000&enrollmentMax=4999',
    'netPriceMin=40000&netPriceMax=14999',
  ])('rejects an inverted %s range', async (query) => {
    const response = await fetch(`${baseUrl}/colleges?${query}`, {
      headers: { Authorization: 'Bearer fixture' },
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'INVALID_QUERY' });
  });

  it('rejects malformed cursors and detail slugs', async () => {
    const headers = { Authorization: 'Bearer fixture' };
    const cursor = await fetch(`${baseUrl}/colleges?cursor=not-a-cursor`, { headers });
    expect(cursor.status).toBe(400);
    expect(await cursor.json()).toMatchObject({ code: 'INVALID_CURSOR' });

    const detail = await fetch(`${baseUrl}/colleges/Invalid%20Slug`, { headers });
    expect(detail.status).toBe(400);
    expect(await detail.json()).toMatchObject({ code: 'INVALID_SLUG' });
  });

  it('applies a valid alphabetical cursor', async () => {
    fixtures.calls.length = 0;
    const cursor = Buffer.from(JSON.stringify({ slug: 'howard-university' }), 'utf8').toString('base64url');
    const response = await fetch(`${baseUrl}/colleges?cursor=${cursor}`, {
      headers: { Authorization: 'Bearer fixture' },
    });
    expect(response.status).toBe(200);
    expect(fixtures.calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: 'college_profiles', method: 'gt', args: ['slug', 'howard-university'] }),
    ]));
  });

  it('applies name, size, net-price, and major filters without ranking', async () => {
    fixtures.calls.length = 0;
    const response = await fetch(`${baseUrl}/colleges?q=Milestone&enrollmentMax=4999&netPriceMax=24999&major=11`, {
      headers: { Authorization: 'Bearer fixture' },
    });
    expect(response.status).toBe(200);
    expect(fixtures.calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: 'college_profiles', method: 'ilike' }),
      expect.objectContaining({ table: 'college_profiles', method: 'lte', args: ['undergraduate_enrollment', 4999] }),
      expect.objectContaining({ table: 'college_profiles', method: 'lte', args: ['net_price', 24999] }),
      expect.objectContaining({ table: 'college_profiles', method: 'contains', args: ['program_area_codes', ['11']] }),
    ]));
    expect(fixtures.calls.some((call) => call.method === 'order' && call.args[0] === 'slug')).toBe(true);
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

  it('serves available major facets', async () => {
    const response = await fetch(`${baseUrl}/colleges/facets`, { headers: { Authorization: 'Bearer fixture' } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ majors: [
      { code: '11', label: 'Computer Science' }, { code: '14', label: 'Engineering' },
    ] });
  });

  it('reads, adds, updates, and removes only the authenticated user list', async () => {
    const headers = { Authorization: 'Bearer fixture', 'Content-Type': 'application/json' };
    const list = await fetch(`${baseUrl}/colleges/list`, { headers });
    expect(list.status).toBe(200);
    expect(await list.json()).toMatchObject({ data: [{ institution_id: fixtures.college.institution_id, college: { name: fixtures.college.name } }] });

    const add = await fetch(`${baseUrl}/colleges/list`, { method: 'POST', headers, body: JSON.stringify({ institutionId: fixtures.college.institution_id }) });
    expect(add.status).toBe(201);
    const update = await fetch(`${baseUrl}/colleges/list/${fixtures.college.institution_id}`, { method: 'PATCH', headers, body: JSON.stringify({ category: 'reach' }) });
    expect(update.status).toBe(200);
    const remove = await fetch(`${baseUrl}/colleges/list/${fixtures.college.institution_id}`, { method: 'DELETE', headers });
    expect(remove.status).toBe(204);
    expect(fixtures.calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: 'user_college_list_items', method: 'eq', args: ['user_id', 'user_test123'] }),
    ]));
  });

  it('rejects invalid list additions and mutations', async () => {
    const headers = { Authorization: 'Bearer fixture', 'Content-Type': 'application/json' };
    const add = await fetch(`${baseUrl}/colleges/list`, {
      method: 'POST', headers, body: JSON.stringify({ institutionId: 'not-a-uuid' }),
    });
    expect(add.status).toBe(400);
    expect(await add.json()).toMatchObject({ code: 'INVALID_LIST_ITEM' });

    const update = await fetch(`${baseUrl}/colleges/list/${fixtures.college.institution_id}`, {
      method: 'PATCH', headers, body: JSON.stringify({ category: 'recommended' }),
    });
    expect(update.status).toBe(400);
    expect(await update.json()).toMatchObject({ code: 'INVALID_LIST_UPDATE' });

    const remove = await fetch(`${baseUrl}/colleges/list/not-a-uuid`, { method: 'DELETE', headers });
    expect(remove.status).toBe(400);
    expect(await remove.json()).toMatchObject({ code: 'INVALID_LIST_ITEM' });
  });
});
