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
});

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200);
const cursorSchema = z.object({ slug: slugSchema });

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

function sendInternalError(res: Response, error: unknown) {
  console.error('[CollegeAPI] Request failed', error);
  return res.status(500).json({ error: 'College data is temporarily unavailable', code: 'COLLEGE_DATA_UNAVAILABLE' });
}

const router = Router();

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
    let query = supabaseAdmin
      .from('college_profiles')
      .select('institution_id,unitid,name,slug,city,state,ownership,institution_level,undergraduate_enrollment,admission_rate,tuition_in_state,tuition_out_of_state,net_price,coverage_score')
      .eq('projection_version_id', projectionVersionId)
      .order('slug', { ascending: true })
      .limit(input.limit + 1);

    if (input.q) query = query.textSearch('search_document', input.q, { config: 'simple', type: 'plain' });
    if (input.state) query = query.eq('state', input.state);
    if (input.ownership) query = query.eq('ownership', input.ownership);
    if (input.level) query = query.eq('institution_level', input.level);
    if (input.admissionRateMin !== undefined) query = query.gte('admission_rate', input.admissionRateMin);
    if (input.admissionRateMax !== undefined) query = query.lte('admission_rate', input.admissionRateMax);
    if (input.enrollmentMin !== undefined) query = query.gte('undergraduate_enrollment', input.enrollmentMin);
    if (input.enrollmentMax !== undefined) query = query.lte('undergraduate_enrollment', input.enrollmentMax);
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
      .select('institution_id,unitid,name,slug,aliases,city,state,zip,ownership,institution_level,setting,undergraduate_enrollment,admission_rate,tuition_in_state,tuition_out_of_state,net_price,coverage_score,generated_at')
      .eq('projection_version_id', projectionVersionId)
      .eq('slug', parsedSlug.data)
      .maybeSingle();
    if (collegeError) throw collegeError;
    if (!college) return res.status(404).json({ error: 'College not found', code: 'COLLEGE_NOT_FOUND' });

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
      fieldContractStatus: 'provisional_pending_milestone_0',
    });
  } catch (error) {
    return sendInternalError(res, error);
  }
});

export default router;
