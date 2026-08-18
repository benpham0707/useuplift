import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Building2, ChevronRight, Loader2, MapPin, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { fetchCollegeList, removeCollegeFromList, updateCollegeListItem } from '@/services/collegeDiscovery/api';
import { formatCollegeCurrency } from '@/services/collegeDiscovery/format';
import type { ApplicationStatus, CollegeCategory, FoundationCollegeListItem } from '@/lib/types/college';

const sections: Array<{ key: CollegeCategory | 'uncategorized'; label: string; description: string; accent: string }> = [
  { key: 'uncategorized', label: 'Needs category', description: 'Newly saved colleges appear here until you choose a category.', accent: 'bg-amber-400' },
  { key: 'reach', label: 'Reach', description: 'Schools you have personally marked as reach options.', accent: 'bg-rose-500' },
  { key: 'match', label: 'Target', description: 'Schools you have personally marked as target options.', accent: 'bg-emerald-500' },
  { key: 'safety', label: 'Safety', description: 'Schools you have personally marked as safety options.', accent: 'bg-sky-500' },
];

const statusLabels: Record<ApplicationStatus, string> = {
  interested: 'Interested', researching: 'Researching', applying: 'Applying', applied: 'Applied',
  accepted: 'Accepted', denied: 'Denied', waitlisted: 'Waitlisted', enrolled: 'Enrolled',
};

export default function MyCollegeList() {
  const { getToken } = useClerkAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | 'all'>('all');

  const listQuery = useQuery({ queryKey: ['college-list'], queryFn: () => fetchCollegeList(getToken), staleTime: 30_000 });
  const items = useMemo(() => listQuery.data?.data ?? [], [listQuery.data]);
  const filteredItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return items.filter((item) => (!term || item.college.name.toLocaleLowerCase().includes(term) || item.college.state?.toLocaleLowerCase().includes(term)) && (status === 'all' || item.status === status));
  }, [items, search, status]);

  const updateMutation = useMutation({
    mutationFn: ({ institutionId, input }: { institutionId: string; input: { category?: CollegeCategory; status?: ApplicationStatus } }) => updateCollegeListItem(institutionId, input, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['college-list'] }),
    onError: () => toast({ title: 'Could not update My Colleges', description: 'Please try again.', variant: 'destructive' }),
  });
  const removeMutation = useMutation({
    mutationFn: (institutionId: string) => removeCollegeFromList(institutionId, getToken),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['college-list'] }); toast({ title: 'Removed from My Colleges' }); },
    onError: () => toast({ title: 'Could not remove college', description: 'Please try again.', variant: 'destructive' }),
  });

  const hasFilters = Boolean(search || status !== 'all');
  const clearFilters = () => { setSearch(''); setStatus('all'); };

  return <div className="min-h-svh bg-slate-50/70">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" className="-ml-3 mb-3" asChild><Link to="/dashboard/colleges"><ArrowLeft className="h-4 w-4" />Explore colleges</Link></Button>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-sm font-semibold text-primary">Your saved schools</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">My Colleges</h1><p className="mt-2 text-sm text-slate-600">Organize your list with categories and application statuses you control.</p></div>
          <div className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">{items.length} saved</div>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-lg"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search My Colleges" className="h-11 pl-10 pr-10" />{search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700" aria-label="Clear search"><X className="h-4 w-4" /></button>}</div>
        <Select value={status} onValueChange={(value) => setStatus(value as ApplicationStatus | 'all')}><SelectTrigger className="h-11 w-full sm:w-48" aria-label="Application status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="h-4 w-4" />Clear</Button>}
        <Button asChild className="sm:ml-auto"><Link to="/dashboard/colleges">Add colleges</Link></Button>
      </div>

      {listQuery.isLoading ? <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div> : listQuery.isError ? <StatePanel icon={<AlertCircle className="h-6 w-6" />} title="My Colleges is unavailable" body="We could not load your saved colleges." action={<Button onClick={() => listQuery.refetch()}>Try again</Button>} /> : items.length === 0 ? <StatePanel icon={<Building2 className="h-7 w-7" />} title="No colleges saved yet" body="Explore the database and add colleges you want to research." action={<Button asChild><Link to="/dashboard/colleges">Explore colleges</Link></Button>} /> : filteredItems.length === 0 ? <StatePanel icon={<Search className="h-6 w-6" />} title="No saved colleges match" body="Try another search or status." action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} /> : <div className="mt-6 space-y-7">{sections.map((section) => {
        const sectionItems = filteredItems.filter((item) => section.key === 'uncategorized' ? item.category === null : item.category === section.key);
        if (!sectionItems.length) return null;
        return <CollegeSection key={String(section.key)} {...section} items={sectionItems} busy={updateMutation.isPending || removeMutation.isPending} onOpen={(slug) => navigate(`/dashboard/colleges/${slug}`)} onCategory={(institutionId, category) => updateMutation.mutate({ institutionId, input: { category } })} onStatus={(institutionId, value) => updateMutation.mutate({ institutionId, input: { status: value } })} onRemove={(institutionId) => removeMutation.mutate(institutionId)} />;
      })}</div>}
    </main>
  </div>;
}

function CollegeSection({ label, description, accent, items, busy, onOpen, onCategory, onStatus, onRemove }: { label: string; description: string; accent: string; items: FoundationCollegeListItem[]; busy: boolean; onOpen: (slug: string) => void; onCategory: (institutionId: string, category: CollegeCategory) => void; onStatus: (institutionId: string, status: ApplicationStatus) => void; onRemove: (institutionId: string) => void }) {
  const sectionId = `section-${label.toLocaleLowerCase().replaceAll(' ', '-')}`;
  return <section aria-labelledby={sectionId}>
    <div className="mb-3 flex items-start gap-3"><span className={`mt-1 h-9 w-1 rounded-full ${accent}`} aria-hidden="true" /><div><div className="flex items-center gap-2"><h2 id={sectionId} className="text-lg font-semibold text-slate-950">{label}</h2><span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-medium text-slate-600">{items.length}</span></div><p className="mt-0.5 text-sm text-slate-500">{description}</p></div></div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="hidden grid-cols-[minmax(240px,1.4fr)_minmax(140px,.65fr)_150px_150px_44px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid"><span>College</span><span>Location</span><span>Category</span><span>Status</span><span className="sr-only">Actions</span></div>
      <div className="divide-y divide-slate-200">{items.map((item) => <CollegeRow key={item.id} item={item} busy={busy} onOpen={() => onOpen(item.college.slug)} onCategory={(category) => onCategory(item.institution_id, category)} onStatus={(status) => onStatus(item.institution_id, status)} onRemove={() => onRemove(item.institution_id)} />)}</div>
    </div>
  </section>;
}

function CollegeRow({ item, busy, onOpen, onCategory, onStatus, onRemove }: { item: FoundationCollegeListItem; busy: boolean; onOpen: () => void; onCategory: (category: CollegeCategory) => void; onStatus: (status: ApplicationStatus) => void; onRemove: () => void }) {
  const location = [item.college.city, item.college.state].filter(Boolean).join(', ') || 'Unavailable';
  return <div className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(240px,1.4fr)_minmax(140px,.65fr)_150px_150px_44px] lg:items-center">
    <button className="group flex min-w-0 items-center gap-3 text-left" onClick={onOpen}><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500"><Building2 className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate font-semibold text-slate-950 group-hover:text-primary">{item.college.name}</p><p className="mt-1 text-xs text-slate-500">{formatCollegeCurrency(item.college.net_price)} avg. net price</p></div><ChevronRight className="ml-auto h-4 w-4 text-slate-300 lg:hidden" /></button>
    <p className="flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="h-3.5 w-3.5 shrink-0" />{location}</p>
    <Select value={item.category ?? 'uncategorized'} onValueChange={(value) => onCategory(value === 'uncategorized' ? null : value as CollegeCategory)}><SelectTrigger className="h-9 text-xs" aria-label={`Category for ${item.college.name}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="uncategorized">Needs category</SelectItem><SelectItem value="reach">Reach</SelectItem><SelectItem value="match">Target</SelectItem><SelectItem value="safety">Safety</SelectItem></SelectContent></Select>
    <Select value={item.status} onValueChange={(value) => onStatus(value as ApplicationStatus)}><SelectTrigger className="h-9 text-xs" aria-label={`Status for ${item.college.name}`}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
    <Button variant="ghost" size="icon" className="h-9 w-9 justify-self-end text-slate-400 hover:text-red-600" onClick={onRemove} disabled={busy} aria-label={`Remove ${item.college.name}`}><Trash2 className="h-4 w-4" /></Button>
  </div>;
}

function StatePanel({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">{icon}</div><h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{body}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
