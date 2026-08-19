import { apiFetch } from '@/lib/utils';
import type {
  CollegeCatalogSource,
  FoundationCollegeDetail,
  FoundationCollegeSummary,
  FoundationOwnership,
  CollegeMajorFacet,
  CollegeCategory,
  ApplicationStatus,
  FoundationCollegeListItem,
} from '@/lib/types/college';

export interface CollegeSearchInput {
  q?: string;
  state?: string;
  states?: string[];
  sizes?: Array<'small' | 'medium' | 'large'>;
  costs?: Array<'under15' | 'from15to25' | 'from25to40' | 'over40'>;
  ownership?: FoundationOwnership;
  admissionRateMin?: number;
  admissionRateMax?: number;
  enrollmentMin?: number;
  enrollmentMax?: number;
  netPriceMin?: number;
  netPriceMax?: number;
  major?: string;
  majors?: string[];
  cursor?: string | null;
  limit?: number;
}

export interface CollegePageResponse {
  data: FoundationCollegeSummary[];
  page: { limit: number; nextCursor: string | null; hasMore: boolean };
  projectionVersionId: string;
  sources: CollegeCatalogSource[];
  fieldContractStatus: 'provisional_pending_milestone_0';
}

export interface CollegeDetailResponse {
  data: FoundationCollegeDetail;
  projectionVersionId: string;
  sources: CollegeCatalogSource[];
  fieldContractStatus: 'provisional_pending_milestone_0';
}

async function authenticatedRequest<T>(path: string, getToken: () => Promise<string | null>) {
  return authenticatedMutation<T>(path, getToken);
}

async function authenticatedMutation<T>(path: string, getToken: () => Promise<string | null>, init: RequestInit = {}) {
  const token = await getToken();
  if (!token) throw new Error('AUTH_REQUIRED');
  const response = await apiFetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers, Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || 'College data request failed');
    Object.assign(error, { status: response.status, code: body.code });
    throw error;
  }
  return body as T;
}

export function fetchCollegePage(input: CollegeSearchInput, getToken: () => Promise<string | null>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(','));
    } else if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  return authenticatedRequest<CollegePageResponse>(`/api/v1/colleges?${params}`, getToken);
}

export function fetchCollegeDetail(slug: string, getToken: () => Promise<string | null>) {
  return authenticatedRequest<CollegeDetailResponse>(`/api/v1/colleges/${encodeURIComponent(slug)}`, getToken);
}

export function fetchCollegeFacets(getToken: () => Promise<string | null>) {
  return authenticatedRequest<{ majors: CollegeMajorFacet[] }>('/api/v1/colleges/facets', getToken);
}

export function fetchCollegeList(getToken: () => Promise<string | null>) {
  return authenticatedRequest<{ data: FoundationCollegeListItem[] }>('/api/v1/colleges/list', getToken);
}

export function addCollegeToList(institutionId: string, getToken: () => Promise<string | null>) {
  return authenticatedMutation<{ data: Omit<FoundationCollegeListItem, 'college'> }>(
    '/api/v1/colleges/list', getToken,
    { method: 'POST', body: JSON.stringify({ institutionId }) },
  );
}

export function updateCollegeListItem(
  institutionId: string,
  input: { category?: CollegeCategory; status?: ApplicationStatus },
  getToken: () => Promise<string | null>,
) {
  return authenticatedMutation<{ data: Omit<FoundationCollegeListItem, 'college'> }>(
    `/api/v1/colleges/list/${institutionId}`, getToken,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
}

export function removeCollegeFromList(institutionId: string, getToken: () => Promise<string | null>) {
  return authenticatedMutation<void>(`/api/v1/colleges/list/${institutionId}`, getToken, { method: 'DELETE' });
}
