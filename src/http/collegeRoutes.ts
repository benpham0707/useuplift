import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth } from './middleware/auth';
import { supabaseAdmin } from '@/supabase/admin';

const searchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  state: z.string().trim().regex(/^[A-Z]{2}$/).optional(),
  ownership: z.enum(['public', 'private_nonprofit', 'private_for_profit', 'other']).optional(),
  level: z.enum(['two_year', 'four_year', 'less_than_two_year', 'other']).optional(),
  admissionRateMin: z.coerce.number().min(0).max(1).optional(),
  admissionRateMax: z.coerce.number().min(0).max(1).optional(),
  enrollmentMin: z.coerce.number().int().min(0).optional(),
  enrollmentMax: z.coerce.number().int().min(0).optional(),
  netPriceMin: z.coerce.number().min(0).optional(),
  netPriceMax: z.coerce.number().min(0).optional(),
  major: z.string().regex(/^[0-9]{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  cursor: z.string().trim().max(300).optional(),
}).superRefine((value, context) => {
  if (value.admissionRateMin !== undefined && value.admissionRateMax !== undefined &&
      value.admissionRateMin > value.admissionRateMax) {
    context.addIssue({ code: 'custom', path: ['admissionRateMin'], message: 'must not exceed admissionRateMax' });
  }
  if (value.enrollmentMin !== undefined && value.enrollmentMax !== undefined &&
      value.enrollmentMin > value.enrollmentMax) {
    context.addIssue({ code: 'custom', path: ['enrollmentMin'], message: 'must not exceed enrollmentMax' });
  }
  if (value.netPriceMin !== undefined && value.netPriceMax !== undefined &&
      value.netPriceMin > value.netPriceMax) {
    context.addIssue({ code: 'custom', path: ['netPriceMin'], message: 'must not exceed netPriceMax' });
  }
});

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200);
const cursorSchema = z.object({ slug: slugSchema });
const institutionIdSchema = z.string().uuid();
const listUpdateSchema = z.object({
  category: z.enum(['reach', 'match', 'safety']).nullable().optional(),
  status: z.enum(['interested', 'researching', 'applying', 'applied', 'accepted', 'denied', 'waitlisted', 'enrolled']).optional(),
}).refine((value) => value.category !== undefined || value.status !== undefined, 'At least one field is required');

function encodeCursor(slug: string) {
  return Buffer.from(JSON.stringify({ slug }), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string) {
  try {
    return cursorSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))).slug;
  } catch {
    throw new Error('INVALID_CURSOR');
  }
}

async function activeProjectionVersion() {
  const { data, error } = await supabaseAdmin
    .from('projection_control')
    .select('active_projection_version_id')
    .eq('singleton', true)
    .maybeSingle();
  if (error) throw error;
  return data?.active_projection_version_id ?? null;
}

async function catalogSources(projectionVersionId: string) {
  const { data, error } = await supabaseAdmin
    .from('projection_version_releases')
    .select('data_releases(source_release_name,source_published_at,data_sources(producer_name))')
    .eq('projection_version_id', projectionVersionId);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const release = row.data_releases;
    return {
      producer: release?.data_sources?.producer_name ?? 'Official federal source',
      release: release?.source_release_name ?? 'Unknown release',
      publishedAt: release?.source_published_at ?? null,
    };
  });
}

function sendInternalError(res: Response, error: unknown) {
  console.error('[CollegeAPI] Request failed', error);
  return res.status(500).json({ error: 'College data is temporarily unavailable', code: 'COLLEGE_DATA_UNAVAILABLE' });
}

const router = Router();

// The generated database type intentionally trails additive migrations. Keep
// these server-only tables behind the authenticated API until types regenerate.
const db = supabaseAdmin as unknown as {
  from(table: string): ReturnType<typeof supabaseAdmin.from>;
};

router.get('/facets', requireAuth, async (_req: Request, res: Response) => {
  try {
    const projectionVersionId = await activeProjectionVersion();
    if (!projectionVersionId) return res.status(503).json({ error: 'College catalog is not active', code: 'COLLEGE_CATALOG_INACTIVE' });
    const { data, error } = await db
      .from('college_profiles')
      .select('program_area_codes,program_area_labels')
      .eq('projection_version_id', projectionVersionId)
      .gt('undergraduate_enrollment', 0)
      .not('program_area_codes', 'eq', '{}');
    if (error) throw error;
    const majors = new Map<string, string>();
    for (const row of data ?? []) {
      row.program_area_codes.forEach((code: string, index: number) => majors.set(code, row.program_area_labels[index]));
    }
    res.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600');
    return res.json({ majors: [...majors].map(([code, label]) => ({ code, label })).sort((a, b) => a.label.localeCompare(b.label)) });
  } catch (error) {
    return sendInternalError(res, error);
  }
});

router.get('/list', requireAuth, async (req: Request, res: Response) => {
  try {
    const projectionVersionId = await activeProjectionVersion();
    if (!projectionVersionId) return res.status(503).json({ error: 'College catalog is not active', code: 'COLLEGE_CATALOG_INACTIVE' });
    const { data: items, error: listError } = await db
      .from('user_college_list_items')
      .select('id,institution_id,category,status,notes,position,added_at,updated_at')
      .eq('user_id', req.auth!.userId)
      .order('added_at', { ascending: false });
    if (listError) throw listError;
    const institutionIds = (items ?? []).map((item: { institution_id: string }) => item.institution_id);
    if (!institutionIds.length) {
      res.set('Cache-Control', 'private, no-store');
      return res.json({ data: [] });
    }
    const { data: colleges, error: collegeError } = await db
      .from('college_profiles')
      .select('institution_id,unitid,name,slug,city,state,ownership,institution_level,undergraduate_enrollment,admission_rate,tuition_in_state,tuition_out_of_state,net_price,coverage_score,program_area_codes,program_area_labels')
      .eq('projection_version_id', projectionVersionId)
      .in('institution_id', institutionIds);
    if (collegeError) throw collegeError;
    const collegeMap = new Map((colleges ?? []).map((college: { institution_id: string }) => [college.institution_id, college]));
    res.set('Cache-Control', 'private, no-store');
    return res.json({ data: (items ?? []).flatMap((item: { institution_id: string }) => {
      const college = collegeMap.get(item.institution_id);
      return college ? [{ ...item, college }] : [];
    }) });
  } catch (error) {
    return sendInternalError(res, error);
  }
});

router.post('/list', requireAuth, async (req: Request, res: Response) => {
  const parsed = z.object({ institutionId: institutionIdSchema }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid college list item', code: 'INVALID_LIST_ITEM' });
  try {
    const projectionVersionId = await activeProjectionVersion();
    if (!projectionVersionId) return res.status(503).json({ error: 'College catalog is not active', code: 'COLLEGE_CATALOG_INACTIVE' });
    const { data: college, error: collegeError } = await db.from('college_profiles').select('institution_id')
      .eq('projection_version_id', projectionVersionId).eq('institution_id', parsed.data.institutionId)
      .gt('undergraduate_enrollment', 0).maybeSingle();
    if (collegeError) throw collegeError;
    if (!college) return res.status(404).json({ error: 'College not found', code: 'COLLEGE_NOT_FOUND' });
    const { data, error } = await db.from('user_college_list_items')
      .upsert({ user_id: req.auth!.userId, institution_id: parsed.data.institutionId }, { onConflict: 'user_id,institution_id', ignoreDuplicates: true })
      .select('id,institution_id,category,status,notes,position,added_at,updated_at').maybeSingle();
    if (error) throw error;
    if (data) return res.status(201).json({ data });
    const { data: existing, error: existingError } = await db.from('user_college_list_items')
      .select('id,institution_id,category,status,notes,position,added_at,updated_at')
      .eq('user_id', req.auth!.userId).eq('institution_id', parsed.data.institutionId).single();
    if (existingError) throw existingError;
    return res.status(200).json({ data: existing });
  } catch (error) {
    return sendInternalError(res, error);
  }
});

router.patch('/list/:institutionId', requireAuth, async (req: Request, res: Response) => {
  const institutionId = institutionIdSchema.safeParse(req.params.institutionId);
  const update = listUpdateSchema.safeParse(req.body);
  if (!institutionId.success || !update.success) return res.status(400).json({ error: 'Invalid college list update', code: 'INVALID_LIST_UPDATE' });
  try {
    const { data, error } = await db.from('user_college_list_items').update(update.data)
      .eq('user_id', req.auth!.userId).eq('institution_id', institutionId.data)
      .select('id,institution_id,category,status,notes,position,added_at,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'College is not in your list', code: 'LIST_ITEM_NOT_FOUND' });
    return res.json({ data });
  } catch (error) {
    return sendInternalError(res, error);
  }
});

router.delete('/list/:institutionId', requireAuth, async (req: Request, res: Response) => {
  const institutionId = institutionIdSchema.safeParse(req.params.institutionId);
  if (!institutionId.success) return res.status(400).json({ error: 'Invalid college list item', code: 'INVALID_LIST_ITEM' });
  try {
    const { error } = await db.from('user_college_list_items').delete()
      .eq('user_id', req.auth!.userId).eq('institution_id', institutionId.data);
    if (error) throw error;
    return res.status(204).send();
  } catch (error) {
    return sendInternalError(res, error);
  }
});

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid college search parameters', code: 'INVALID_QUERY', issues: parsed.error.issues });
  }

  try {
    const projectionVersionId = await activeProjectionVersion();
    if (!projectionVersionId) {
      return res.status(503).json({ error: 'College catalog is not active', code: 'COLLEGE_CATALOG_INACTIVE' });
    }

    const input = parsed.data;
    const sources = await catalogSources(projectionVersionId);
    let query = supabaseAdmin
      .from('college_profiles')
      .select('institution_id,unitid,name,slug,city,state,ownership,institution_level,undergraduate_enrollment,admission_rate,tuition_in_state,tuition_out_of_state,net_price,coverage_score,program_area_codes,program_area_labels')
      .eq('projection_version_id', projectionVersionId)
      .gt('undergraduate_enrollment', 0)
      .order('slug', { ascending: true })
      .limit(input.limit + 1);

    if (input.q) {
      const literalName = input.q.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
      query = query.ilike('name', `%${literalName}%`);
    }
    if (input.state) query = query.eq('state', input.state);
    if (input.ownership) query = query.eq('ownership', input.ownership);
    if (input.level) query = query.eq('institution_level', input.level);
    if (input.admissionRateMin !== undefined) query = query.gte('admission_rate', input.admissionRateMin);
    if (input.admissionRateMax !== undefined) query = query.lte('admission_rate', input.admissionRateMax);
    if (input.enrollmentMin !== undefined) query = query.gte('undergraduate_enrollment', input.enrollmentMin);
    if (input.enrollmentMax !== undefined) query = query.lte('undergraduate_enrollment', input.enrollmentMax);
    if (input.netPriceMin !== undefined) query = query.gte('net_price', input.netPriceMin);
    if (input.netPriceMax !== undefined) query = query.lte('net_price', input.netPriceMax);
    if (input.major) query = query.contains('program_area_codes', [input.major]);
    if (input.cursor) query = query.gt('slug', decodeCursor(input.cursor));

    const { data, error } = await query;
    if (error) throw error;
    const rows = data ?? [];
    const hasMore = rows.length > input.limit;
    const colleges = hasMore ? rows.slice(0, input.limit) : rows;
    const nextCursor = hasMore && colleges.length
      ? encodeCursor(colleges[colleges.length - 1].slug)
      : null;

    res.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
    return res.json({
      data: colleges,
      page: { limit: input.limit, nextCursor, hasMore },
      projectionVersionId,
      sources,
      fieldContractStatus: 'provisional_pending_milestone_0',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CURSOR') {
      return res.status(400).json({ error: 'Invalid pagination cursor', code: 'INVALID_CURSOR' });
    }
    return sendInternalError(res, error);
  }
});

router.get('/:slug', requireAuth, async (req: Request, res: Response) => {
  const parsedSlug = slugSchema.safeParse(req.params.slug);
  if (!parsedSlug.success) {
    return res.status(400).json({ error: 'Invalid college slug', code: 'INVALID_SLUG' });
  }

  try {
    const projectionVersionId = await activeProjectionVersion();
    if (!projectionVersionId) {
      return res.status(503).json({ error: 'College catalog is not active', code: 'COLLEGE_CATALOG_INACTIVE' });
    }
    const { data: college, error: collegeError } = await supabaseAdmin
      .from('college_profiles')
      .select('institution_id,unitid,name,slug,aliases,city,state,zip,ownership,institution_level,setting,undergraduate_enrollment,admission_rate,tuition_in_state,tuition_out_of_state,net_price,coverage_score,program_area_codes,program_area_labels,generated_at')
      .eq('projection_version_id', projectionVersionId)
      .gt('undergraduate_enrollment', 0)
      .eq('slug', parsedSlug.data)
      .maybeSingle();
    if (collegeError) throw collegeError;
    if (!college) return res.status(404).json({ error: 'College not found', code: 'COLLEGE_NOT_FOUND' });

    const sources = await catalogSources(projectionVersionId);

    const { data: facts, error: factsError } = await supabaseAdmin
      .from('college_profile_facts')
      .select('field_key,display_value,source_name,source_release,period_start,period_end,academic_year,cohort_key,cohort_label,quality_status,is_estimate,is_suppressed,retrieved_at')
      .eq('projection_version_id', projectionVersionId)
      .eq('institution_id', college.institution_id)
      .order('field_key');
    if (factsError) throw factsError;

    res.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
    return res.json({
      data: { ...college, facts: facts ?? [] },
      projectionVersionId,
      sources,
      fieldContractStatus: 'provisional_pending_milestone_0',
    });
  } catch (error) {
    return sendInternalError(res, error);
  }
});

export default router;
