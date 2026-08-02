import { apiFetch } from '@/lib/utils';
import type {
  CollegeCatalogSource,
  FoundationCollegeDetail,
  FoundationCollegeSummary,
  FoundationOwnership,
} from '@/lib/types/college';

export interface CollegeSearchInput {
  q?: string;
  state?: string;
  ownership?: FoundationOwnership;
  admissionRateMin?: number;
  admissionRateMax?: number;
  enrollmentMin?: number;
  enrollmentMax?: number;
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
  const token = await getToken();
  if (!token) throw new Error('AUTH_REQUIRED');
  const response = await apiFetch(path, { headers: { Authorization: `Bearer ${token}` } });
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
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  return authenticatedRequest<CollegePageResponse>(`/api/v1/colleges?${params}`, getToken);
}

export function fetchCollegeDetail(slug: string, getToken: () => Promise<string | null>) {
  return authenticatedRequest<CollegeDetailResponse>(`/api/v1/colleges/${encodeURIComponent(slug)}`, getToken);
}
