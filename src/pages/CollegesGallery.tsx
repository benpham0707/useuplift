import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { AlertCircle, Database, Loader2, Search, ShieldCheck, X } from 'lucide-react';
import { CollegeCard } from '@/components/colleges/CollegeCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchCollegePage } from '@/services/collegeDiscovery/api';
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
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [state, setState] = useState('all');
  const [ownership, setOwnership] = useState<'all' | FoundationOwnership>('all');
  const [admission, setAdmission] = useState<keyof typeof admissionRanges>('all');
  const [enrollment, setEnrollment] = useState<keyof typeof enrollmentRanges>('all');

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

  const clearFilters = () => {
    setSearch(''); setDebouncedSearch(''); setState('all'); setOwnership('all'); setAdmission('all'); setEnrollment('all');
  };

  return (
    <div className="min-h-full bg-slate-50/70">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                <Database className="h-4 w-4" aria-hidden="true" /> Official federal college data
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Explore colleges with the source attached</h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                Search active four-year institutions and compare reported admissions, enrollment, and cost data without rankings or hidden match labels.
              </p>
            </div>
            <div className="flex max-w-md items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>Fields are provisional while student research is underway. Open a college to see its exact source and reporting year.</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label htmlFor="college-search" className="sr-only">Search colleges</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <Input id="college-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by college, city, or state" className="h-11 pl-10 pr-10" />
              {search && <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Clear search"><X className="h-4 w-4" /></button>}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FilterSelect label="State" value={state} onChange={setState}>
                <SelectItem value="all">All states</SelectItem>{states.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </FilterSelect>
              <FilterSelect label="Ownership" value={ownership} onChange={(value) => setOwnership(value as typeof ownership)}>
                <SelectItem value="all">All ownership types</SelectItem><SelectItem value="public">Public</SelectItem><SelectItem value="private_nonprofit">Private nonprofit</SelectItem><SelectItem value="private_for_profit">Private for-profit</SelectItem>
              </FilterSelect>
              <FilterSelect label="Admission rate" value={admission} onChange={(value) => setAdmission(value as keyof typeof admissionRanges)}>
                <SelectItem value="all">Any reported rate</SelectItem><SelectItem value="selective">Below 25%</SelectItem><SelectItem value="moderate">25% to 60%</SelectItem><SelectItem value="broad">60% and above</SelectItem>
              </FilterSelect>
              <FilterSelect label="Undergraduate enrollment" value={enrollment} onChange={(value) => setEnrollment(value as keyof typeof enrollmentRanges)}>
                <SelectItem value="all">Any reported size</SelectItem><SelectItem value="small">Under 5,000</SelectItem><SelectItem value="medium">5,000 to 14,999</SelectItem><SelectItem value="large">15,000 and above</SelectItem>
              </FilterSelect>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600" aria-live="polite">
            {query.isLoading ? 'Loading colleges…' : `Showing ${colleges.length.toLocaleString()} college${colleges.length === 1 ? '' : 's'}`}
          </p>
          {hasFilters && <Button type="button" variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1.5 h-4 w-4" />Clear filters</Button>}
        </div>

        {query.isLoading ? <CollegeGridSkeleton /> : query.isError ? (
          <StatePanel icon={<AlertCircle className="h-5 w-5" />} title="College data is unavailable" body="The catalog could not be loaded right now. Your filters have been preserved." action={<Button onClick={() => query.refetch()}>Try again</Button>} />
        ) : colleges.length === 0 ? (
          <StatePanel icon={<Search className="h-5 w-5" />} title="No colleges match these filters" body="Try a broader admission range, another state, or fewer filters." action={<Button variant="outline" onClick={clearFilters}>Clear all filters</Button>} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {colleges.map((college) => <CollegeCard key={college.institution_id} college={college} />)}
            </div>
            {query.hasNextPage && <div className="mt-8 flex justify-center"><Button variant="outline" size="lg" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Load more colleges</Button></div>}
          </>
        )}

        {catalog && <p className="mt-8 text-center text-xs leading-5 text-slate-500">Catalog sources: {catalog.sources.map((source) => source.producer).filter((value, index, all) => all.indexOf(value) === index).join(' and ')}. Projection {catalog.projectionVersionId.slice(0, 8)}.</p>}
      </section>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label><Select value={value} onValueChange={onChange}><SelectTrigger className="h-10 bg-white"><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></div>;
}

function CollegeGridSkeleton() {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Loading colleges">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="h-[250px] animate-pulse rounded-2xl border border-slate-200 bg-white"><div className="m-5 h-11 w-11 rounded-xl bg-slate-100" /><div className="mx-5 mt-5 h-16 rounded-xl bg-slate-100" /><div className="mx-5 mt-8 h-10 rounded bg-slate-100" /></div>)}</div>;
}

function StatePanel({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">{icon}</div><h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{body}</p><div className="mt-5">{action}</div></div>;
}
