import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Database, Loader2, Search, ShieldCheck, X } from 'lucide-react';
import { CollegeCard } from '@/components/colleges/CollegeCard';
import { CollegePreview } from '@/components/colleges/CollegePreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchCollegeDetail, fetchCollegePage } from '@/services/collegeDiscovery/api';
import type { FoundationOwnership } from '@/lib/types/college';

const states = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

const admissionRanges = {
  all: {}, selective: { admissionRateMax: 0.25 }, moderate: { admissionRateMin: 0.25, admissionRateMax: 0.6 }, broad: { admissionRateMin: 0.6 },
} as const;
const enrollmentRanges = {
  all: {}, small: { enrollmentMax: 4999 }, medium: { enrollmentMin: 5000, enrollmentMax: 14999 }, large: { enrollmentMin: 15000 },
} as const;

export default function CollegesGallery() {
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [state, setState] = useState('all');
  const [ownership, setOwnership] = useState<'all' | FoundationOwnership>('all');
  const [admission, setAdmission] = useState<keyof typeof admissionRanges>('all');
  const [enrollment, setEnrollment] = useState<keyof typeof enrollmentRanges>('all');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const queryInput = useMemo(() => ({
    q: debouncedSearch || undefined,
    state: state === 'all' ? undefined : state,
    ownership: ownership === 'all' ? undefined : ownership,
    ...admissionRanges[admission],
    ...enrollmentRanges[enrollment],
    limit: 24,
  }), [debouncedSearch, state, ownership, admission, enrollment]);

  const query = useInfiniteQuery({
    queryKey: ['foundation-colleges', queryInput],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchCollegePage({ ...queryInput, cursor: pageParam }, getToken),
    getNextPageParam: (lastPage) => lastPage.page.nextCursor ?? undefined,
    staleTime: 60_000,
  });

  const colleges = query.data?.pages.flatMap((page) => page.data) ?? [];
  const catalog = query.data?.pages[0];
  const hasFilters = Boolean(search || state !== 'all' || ownership !== 'all' || admission !== 'all' || enrollment !== 'all');
  const activeSlug = colleges.some((college) => college.slug === selectedSlug) ? selectedSlug : colleges[0]?.slug ?? null;
  const previewQuery = useQuery({
    queryKey: ['foundation-college', activeSlug],
    queryFn: () => fetchCollegeDetail(activeSlug!, getToken),
    enabled: Boolean(activeSlug),
    staleTime: 60_000,
  });

  const clearFilters = () => {
    setSearch(''); setDebouncedSearch(''); setState('all'); setOwnership('all'); setAdmission('all'); setEnrollment('all');
  };

  const selectCollege = (slug: string) => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      navigate(`/dashboard/colleges/${slug}`);
      return;
    }
    setSelectedSlug(slug);
  };

  return (
    <div className="min-h-full bg-slate-50/70 lg:flex lg:h-[calc(100svh-4rem)] lg:min-h-0 lg:flex-col lg:overflow-hidden">
      <section className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8 lg:py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">Explore colleges</h1>
              <span className="flex items-center gap-1.5 text-sm font-medium text-primary"><Database className="h-4 w-4" aria-hidden="true" />Official federal data</span>
              <p className="basis-full text-sm text-slate-600 lg:hidden">Search active four-year institutions and compare reported admissions, enrollment, and cost data.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-950">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
              <p>Provisional fields include their source and reporting year.</p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(280px,1.35fr)_repeat(4,minmax(135px,1fr))] lg:items-end">
            <div>
            <label htmlFor="college-search" className="sr-only">Search colleges</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <Input id="college-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search colleges" className="h-10 bg-white pl-10 pr-10" />
              {search && <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Clear search"><X className="h-4 w-4" /></button>}
            </div>
            </div>
              <FilterSelect label="State" compact value={state} onChange={setState}>
                <SelectItem value="all">All states</SelectItem>{states.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </FilterSelect>
              <FilterSelect label="Ownership" compact value={ownership} onChange={(value) => setOwnership(value as typeof ownership)}>
                <SelectItem value="all">All ownership types</SelectItem><SelectItem value="public">Public</SelectItem><SelectItem value="private_nonprofit">Private nonprofit</SelectItem><SelectItem value="private_for_profit">Private for-profit</SelectItem>
              </FilterSelect>
              <FilterSelect label="Admission rate" compact value={admission} onChange={(value) => setAdmission(value as keyof typeof admissionRanges)}>
                <SelectItem value="all">Any reported rate</SelectItem><SelectItem value="selective">Below 25%</SelectItem><SelectItem value="moderate">25% to 60%</SelectItem><SelectItem value="broad">60% and above</SelectItem>
              </FilterSelect>
              <FilterSelect label="Undergraduate enrollment" compact value={enrollment} onChange={(value) => setEnrollment(value as keyof typeof enrollmentRanges)}>
                <SelectItem value="all">Any reported size</SelectItem><SelectItem value="small">Under 5,000</SelectItem><SelectItem value="medium">5,000 to 14,999</SelectItem><SelectItem value="large">15,000 and above</SelectItem>
              </FilterSelect>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:px-8 lg:py-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 lg:hidden">
          <p className="text-sm text-slate-600" aria-live="polite">
            {query.isLoading ? 'Loading colleges…' : `Showing ${colleges.length.toLocaleString()} college${colleges.length === 1 ? '' : 's'}`}
          </p>
          {hasFilters && <Button type="button" variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1.5 h-4 w-4" />Clear filters</Button>}
        </div>

        {query.isLoading ? <CollegeListSkeleton /> : query.isError ? (
          <StatePanel icon={<AlertCircle className="h-5 w-5" />} title="College data is unavailable" body="The catalog could not be loaded right now. Your filters have been preserved." action={<Button onClick={() => query.refetch()}>Try again</Button>} />
        ) : colleges.length === 0 ? (
          <StatePanel icon={<Search className="h-5 w-5" />} title="No colleges match these filters" body="Try a broader admission range, another state, or fewer filters." action={<Button variant="outline" onClick={clearFilters}>Clear all filters</Button>} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(320px,390px)_minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col border-slate-200 lg:border-r">
              <div className="hidden shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:flex">
                <p className="text-sm font-medium text-slate-700" aria-live="polite">{`Showing ${colleges.length.toLocaleString()} college${colleges.length === 1 ? '' : 's'}`}</p>
                {hasFilters && <Button type="button" variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1 h-3.5 w-3.5" />Clear</Button>}
              </div>
              <div className="min-h-0 lg:overflow-y-auto" aria-label="College search results">
                {colleges.map((college) => <CollegeCard key={college.institution_id} college={college} selected={college.slug === activeSlug} onSelect={() => selectCollege(college.slug)} />)}
                {query.hasNextPage && <div className="bg-white p-4"><Button className="w-full" variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Load more colleges</Button></div>}
              </div>
            </div>
            <div className="hidden min-h-0 min-w-0 overflow-y-auto lg:block">
              <CollegePreview response={previewQuery.data} loading={previewQuery.isLoading} error={previewQuery.isError} onRetry={() => previewQuery.refetch()} onOpenProfile={() => activeSlug && navigate(`/dashboard/colleges/${activeSlug}`)} />
            </div>
          </div>
        )}

        {catalog && <p className="mt-8 text-center text-xs leading-5 text-slate-500 lg:hidden">Catalog sources: {catalog.sources.map((source) => source.producer).filter((value, index, all) => all.indexOf(value) === index).join(' and ')}. Projection {catalog.projectionVersionId.slice(0, 8)}.</p>}
      </section>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children, compact = false }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode; compact?: boolean }) {
  return <div><label className={compact ? 'sr-only' : 'mb-1.5 block text-xs font-medium text-slate-600'}>{label}</label><Select value={value} onValueChange={onChange}><SelectTrigger className="h-10 bg-white" aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></div>;
}

function CollegeListSkeleton() {
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid lg:min-h-[620px] lg:grid-cols-[minmax(320px,390px)_minmax(0,1fr)]" aria-label="Loading colleges"><div className="divide-y divide-slate-200 lg:border-r">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-[142px] animate-pulse p-4"><div className="h-5 w-2/3 rounded bg-slate-200" /><div className="mt-3 h-4 w-2/5 rounded bg-slate-100" /><div className="mt-7 h-4 w-4/5 rounded bg-slate-100" /></div>)}</div><div className="hidden animate-pulse p-7 lg:block"><div className="h-8 w-1/2 rounded bg-slate-200" /><div className="mt-4 h-4 w-1/3 rounded bg-slate-100" /><div className="mt-10 grid grid-cols-4 gap-1">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 bg-slate-100" />)}</div></div></div>;
}

function StatePanel({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">{icon}</div><h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{body}</p><div className="mt-5">{action}</div></div>;
}
