import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Bookmark,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ListFilter,
  Loader2,
  MapPin,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CollegePreview } from '@/components/colleges/CollegePreview';
import { useToast } from '@/hooks/use-toast';
import {
  addCollegeToList,
  fetchCollegeDetail,
  fetchCollegeFacets,
  fetchCollegeList,
  fetchCollegePage,
} from '@/services/collegeDiscovery/api';
import { formatCollegeCurrency } from '@/services/collegeDiscovery/format';
import type { FoundationCollegeSummary } from '@/lib/types/college';

const states = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
type SizeBand = 'small' | 'medium' | 'large';
type CostBand = 'under15' | 'from15to25' | 'from25to40' | 'over40';
const stateOptions = states.map((value) => ({ value, label: value }));
const sizeOptions: Array<{ value: SizeBand; label: string }> = [
  { value: 'small', label: 'Small · under 5k' },
  { value: 'medium', label: 'Medium · 5k–15k' },
  { value: 'large', label: 'Large · 15k+' },
];
const costOptions: Array<{ value: CostBand; label: string }> = [
  { value: 'under15', label: 'Under $15k' },
  { value: 'from15to25', label: '$15k–$25k' },
  { value: 'from25to40', label: '$25k–$40k' },
  { value: 'over40', label: '$40k+' },
];

export default function CollegesGallery() {
  const { getToken } = useClerkAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<SizeBand[]>([]);
  const [selectedCosts, setSelectedCosts] = useState<CostBand[]>([]);
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const listQuery = useQuery({ queryKey: ['college-list'], queryFn: () => fetchCollegeList(getToken), staleTime: 30_000 });
  const facetsQuery = useQuery({ queryKey: ['college-facets'], queryFn: () => fetchCollegeFacets(getToken), staleTime: 300_000 });
  const queryInput = useMemo(() => ({
    q: debouncedSearch || undefined,
    states: selectedStates.length ? selectedStates : undefined,
    sizes: selectedSizes.length ? selectedSizes : undefined,
    costs: selectedCosts.length ? selectedCosts : undefined,
    majors: selectedMajors.length ? selectedMajors : undefined,
    limit: 24,
  }), [debouncedSearch, selectedStates, selectedSizes, selectedCosts, selectedMajors]);
  const searchQuery = useInfiniteQuery({
    queryKey: ['foundation-colleges', queryInput],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchCollegePage({ ...queryInput, cursor: pageParam }, getToken),
    getNextPageParam: (lastPage) => lastPage.page.nextCursor ?? undefined,
    staleTime: 60_000,
  });

  const savedItems = useMemo(() => listQuery.data?.data ?? [], [listQuery.data]);
  const savedIds = useMemo(() => new Set(savedItems.map((item) => item.institution_id)), [savedItems]);
  const results = searchQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const activeSlug = results.some((college) => college.slug === selectedSlug) ? selectedSlug : results[0]?.slug ?? null;
  const activeCollege = results.find((college) => college.slug === activeSlug);
  const detailQuery = useQuery({
    queryKey: ['foundation-college', activeSlug],
    queryFn: () => fetchCollegeDetail(activeSlug!, getToken),
    enabled: Boolean(activeSlug),
    staleTime: 60_000,
  });

  const addMutation = useMutation({
    mutationFn: (institutionId: string) => addCollegeToList(institutionId, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['college-list'] });
      toast({ title: 'Added to My Colleges', description: 'New colleges start in Needs category.' });
    },
    onError: () => toast({ title: 'Could not add college', description: 'Please try again.', variant: 'destructive' }),
  });

  const hasFilters = Boolean(search || selectedStates.length || selectedSizes.length || selectedCosts.length || selectedMajors.length);
  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedStates([]);
    setSelectedSizes([]);
    setSelectedCosts([]);
    setSelectedMajors([]);
    setSelectedSlug(null);
  };
  const openCollege = (college: FoundationCollegeSummary) => {
    if (window.matchMedia('(max-width: 1023px)').matches) navigate(`/dashboard/colleges/${college.slug}`);
    else setSelectedSlug(college.slug);
  };
  const activeSaved = activeCollege ? savedIds.has(activeCollege.institution_id) : false;
  const activeAdding = Boolean(activeCollege && addMutation.isPending && addMutation.variables === activeCollege.institution_id);

  return (
    <div className="flex min-h-svh flex-col bg-white lg:h-svh lg:min-h-0 lg:overflow-hidden">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">College database</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Explore colleges</h1>
            <p className="mt-1 text-sm text-slate-600">Search official federal records and build your own list.</p>
          </div>
          <Button asChild variant="outline" className="w-full justify-between sm:w-auto sm:justify-center">
            <Link to="/dashboard/colleges/my-list">
              <Bookmark className="h-4 w-4" />My Colleges
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{savedItems.length}</span>
            </Link>
          </Button>
        </div>
      </header>

      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-[minmax(14rem,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_5rem] xl:items-center">
          <div className="relative col-span-2 min-w-0 sm:col-span-4 xl:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by college name" className="h-11 pl-10 pr-10" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700" aria-label="Clear search"><X className="h-4 w-4" /></button>}
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-4 sm:grid-cols-4 xl:contents">
            <MultiFilter values={selectedStates} onChange={setSelectedStates} label="States" placeholder="All states" selectedLabel="states" options={stateOptions} />
            <MultiFilter values={selectedSizes} onChange={setSelectedSizes} label="Sizes" placeholder="Any size" selectedLabel="sizes" options={sizeOptions} />
            <MultiFilter values={selectedCosts} onChange={setSelectedCosts} label="Average net prices" placeholder="Any net price" selectedLabel="prices" options={costOptions} />
            <MultiFilter values={selectedMajors} onChange={setSelectedMajors} label="Major areas" placeholder="Any major" selectedLabel="majors" options={facetsQuery.data?.majors.map((item) => ({ value: item.code, label: item.label })) ?? []} />
          </div>
          <div className={`${hasFilters ? 'flex' : 'hidden xl:flex'} col-span-2 h-9 items-center justify-end sm:col-span-4 xl:col-span-1 xl:justify-start`}>
            <Button variant="ghost" size="sm" onClick={clearFilters} className={!hasFilters ? 'invisible w-20' : 'w-20'} disabled={!hasFilters} aria-hidden={!hasFilters}><X className="h-4 w-4" />Clear</Button>
          </div>
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 bg-white lg:min-h-0 lg:grid-cols-[380px_minmax(0,1fr)] lg:border-x lg:border-slate-200 xl:grid-cols-[400px_minmax(0,1fr)]">
        <section className="min-w-0 lg:flex lg:min-h-0 lg:flex-col lg:border-r lg:border-slate-200" aria-labelledby="college-results-heading">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-3">
            <h2 id="college-results-heading" className="text-sm font-semibold text-slate-800">{results.length}{searchQuery.hasNextPage ? '+' : ''} colleges</h2>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><ListFilter className="h-3.5 w-3.5" />Alphabetical</span>
          </div>
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto" aria-label="College search results">
            {searchQuery.isLoading ? <SearchSkeleton /> : searchQuery.isError ? <CompactState icon={<AlertCircle className="h-5 w-5" />} title="College search is unavailable" action={<Button variant="outline" size="sm" onClick={() => searchQuery.refetch()}>Try again</Button>} /> : results.length === 0 ? <CompactState icon={<Search className="h-5 w-5" />} title="No colleges match these filters" action={<Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>} /> : <>
              {results.map((college) => <CollegeResult key={college.institution_id} college={college} active={college.slug === activeSlug} added={savedIds.has(college.institution_id)} adding={addMutation.isPending && addMutation.variables === college.institution_id} onSelect={() => openCollege(college)} onAdd={() => addMutation.mutate(college.institution_id)} />)}
              {searchQuery.hasNextPage && <div className="p-4"><Button variant="outline" className="w-full" onClick={() => searchQuery.fetchNextPage()} disabled={searchQuery.isFetchingNextPage}>{searchQuery.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}Load more colleges</Button></div>}
            </>}
          </div>
        </section>

        <section className="hidden min-w-0 bg-white lg:block lg:min-h-0 lg:overflow-y-auto" aria-label="Selected college details">
          {activeSlug ? <CollegePreview response={detailQuery.data} loading={detailQuery.isLoading} error={detailQuery.isError} onRetry={() => detailQuery.refetch()} onOpenProfile={() => navigate(`/dashboard/colleges/${activeSlug}`)} saved={activeSaved} adding={activeAdding} onAdd={() => activeCollege && addMutation.mutate(activeCollege.institution_id)} /> : <CompactState icon={<Building2 className="h-5 w-5" />} title="Select a college to view its details" />}
        </section>
      </main>

      <footer className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500 sm:px-6 lg:px-8">
        <p className="mx-auto max-w-[1600px]">Major availability reflects reported bachelor’s completions. Average net price is historical and is not a personalized estimate.</p>
      </footer>
    </div>
  );
}

function CollegeResult({ college, active, added, adding, onSelect, onAdd }: { college: FoundationCollegeSummary; active: boolean; added: boolean; adding: boolean; onSelect: () => void; onAdd: () => void }) {
  return <div className={`group relative border-b border-slate-200 transition-colors ${active ? 'bg-primary/5' : 'bg-white hover:bg-slate-50'}`}>
    {active && <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />}
    <button className="w-full px-4 py-5 pr-16 text-left" onClick={onSelect} aria-current={active ? 'true' : undefined}>
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${active ? 'border-primary/20 bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-500'}`}><Building2 className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-5 text-slate-950 group-hover:text-primary">{college.name}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" />{[college.city, college.state].filter(Boolean).join(', ') || 'Location unavailable'}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600"><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{college.undergraduate_enrollment?.toLocaleString() ?? 'Size unavailable'}</span><span>{formatCollegeCurrency(college.net_price)} avg. net price</span></div>
          {college.program_area_labels.length > 0 && <p className="mt-2 line-clamp-1 text-xs text-slate-500">{college.program_area_labels.slice(0, 3).join(' · ')}</p>}
        </div>
      </div>
    </button>
    <Button type="button" variant={added ? 'secondary' : 'ghost'} size="icon" className="absolute right-3 top-4 h-9 w-9" onClick={(event) => { event.stopPropagation(); onAdd(); }} disabled={added || adding} aria-label={added ? `${college.name} is in My Colleges` : `Add ${college.name} to My Colleges`}>
      {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
    </Button>
    <ChevronRight className="absolute bottom-5 right-4 h-4 w-4 text-slate-300 lg:hidden" />
  </div>;
}

function MultiFilter<T extends string>({ values, onChange, label, placeholder, selectedLabel, options }: {
  values: T[];
  onChange: (values: T[]) => void;
  label: string;
  placeholder: string;
  selectedLabel: string;
  options: Array<{ value: T; label: string }>;
}) {
  const selectedText = values.length === 0
    ? placeholder
    : values.length === 1
      ? options.find((option) => option.value === values[0])?.label ?? values[0]
      : `${values.length} ${selectedLabel}`;

  const toggle = (value: T) => {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  return <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className="h-11 min-w-0 justify-between px-3 font-normal" aria-label={`${label}: ${selectedText}`}>
        <span className="truncate">{selectedText}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-56 p-1">
      <div className="max-h-64 overflow-y-auto py-1" aria-label={label}>
        {options.map((option) => <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-slate-100">
          <Checkbox checked={values.includes(option.value)} onCheckedChange={() => toggle(option.value)} />
          <span className="min-w-0 flex-1 truncate">{option.label}</span>
        </label>)}
      </div>
    </PopoverContent>
  </Popover>;
}

function CompactState({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return <div className="flex min-h-64 items-center justify-center px-6 py-12 text-center"><div><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">{icon}</div><p className="mt-3 text-sm font-medium text-slate-700">{title}</p>{action && <div className="mt-4">{action}</div>}</div></div>;
}

function SearchSkeleton() {
  return <div>{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-36 animate-pulse border-b border-slate-200 p-5"><div className="h-4 w-2/3 rounded bg-slate-200" /><div className="mt-3 h-3 w-1/3 rounded bg-slate-100" /><div className="mt-7 h-3 w-4/5 rounded bg-slate-100" /></div>)}</div>;
}
