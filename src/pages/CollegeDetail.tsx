import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { AlertCircle, ArrowLeft, Building2, CalendarDays, Database, ExternalLink, FileQuestion, MapPin, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchCollegeDetail } from '@/services/collegeDiscovery/api';
import { formatCollegeCurrency, formatCollegePercent, ownershipLabel } from '@/services/collegeDiscovery/format';
import type { FoundationCollegeFact } from '@/lib/types/college';

const metricLabels: Record<string, string> = {
  undergraduate_enrollment: 'Undergraduate enrollment', admission_rate: 'Admission rate',
  tuition_in_state: 'In-state tuition', tuition_out_of_state: 'Out-of-state tuition',
  cost_of_attendance: 'Cost of attendance', net_price: 'Average net price',
  pell_share: 'Students receiving Pell Grants', completion_150pct: 'Completion within 150% of normal time',
  retention_full_time: 'Full-time retention', median_earnings_10yr: 'Median earnings 10 years after entry',
  official_name: 'Official name', city: 'City', state: 'State', zip: 'ZIP code',
  ownership: 'Ownership', institution_level: 'Institution level', institution_status: 'Operating status', website_url: 'Institution website',
};

export default function CollegeDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  const query = useQuery({
    queryKey: ['foundation-college', slug],
    queryFn: () => fetchCollegeDetail(slug, getToken),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });

  const factMap = useMemo(() => new Map(query.data?.data.facts.map((fact) => [fact.field_key, fact]) ?? []), [query.data]);

  if (query.isLoading) return <DetailSkeleton />;
  if (query.isError || !query.data) {
    const notFound = (query.error as Error & { status?: number })?.status === 404;
    return <div className="min-h-full bg-slate-50 px-4 py-16"><div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><AlertCircle className="mx-auto h-7 w-7 text-slate-400" /><h1 className="mt-4 text-xl font-semibold text-slate-950">{notFound ? 'College not found' : 'College data is unavailable'}</h1><p className="mt-2 text-sm text-slate-600">{notFound ? 'This URL may be outdated, or the college is outside the active catalog.' : 'We could not load this college right now. Please try again.'}</p><Button className="mt-6" onClick={() => notFound ? navigate('/dashboard/colleges') : query.refetch()}>{notFound ? 'Back to colleges' : 'Try again'}</Button></div></div>;
  }

  const { data: college, sources, projectionVersionId } = query.data;
  const website = factMap.get('website_url')?.display_value;
  const location = [college.city, college.state].filter(Boolean).join(', ') || 'Location unavailable';

  return (
    <div className="min-h-full bg-slate-50/70 pb-14">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="-ml-2 mb-5" onClick={() => navigate('/dashboard/colleges')}><ArrowLeft className="mr-2 h-4 w-4" />Back to colleges</Button>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-7 w-7" /></div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{college.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{location}</span>
                  <span>{ownershipLabel(college.ownership)}</span><span>Four-year institution</span>
                </div>
              </div>
            </div>
            {website && <Button variant="outline" asChild><a href={website} target="_blank" rel="noreferrer">Visit official website<ExternalLink className="ml-2 h-4 w-4" /></a></Button>}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>This profile shows reported federal data, not a ranking or admission prediction. Missing values stay missing rather than being estimated.</p></div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <section aria-labelledby="overview-heading">
          <div className="mb-4"><p className="text-sm font-medium text-primary">Reported overview</p><h2 id="overview-heading" className="mt-1 text-xl font-semibold text-slate-950">What the federal records say</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Admission rate" value={formatCollegePercent(college.admission_rate)} note={factNote(factMap.get('admission_rate'))} />
            <MetricCard label="Undergraduate enrollment" value={college.undergraduate_enrollment?.toLocaleString() ?? 'Unavailable'} note={factNote(factMap.get('undergraduate_enrollment'))} icon={<Users className="h-4 w-4" />} />
            <MetricCard label="Average net price" value={formatCollegeCurrency(college.net_price)} note={factNote(factMap.get('net_price'))} />
            <MetricCard label={college.ownership === 'public' ? 'Out-of-state tuition' : 'Published tuition'} value={formatCollegeCurrency(college.tuition_out_of_state)} note={factNote(factMap.get('tuition_out_of_state'))} />
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="facts-heading">
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">Field-by-field</p><h2 id="facts-heading" className="mt-1 text-xl font-semibold text-slate-950">Sources and reporting periods</h2></div><Database className="h-5 w-5 text-slate-400" /></div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Each displayed value keeps the release, reporting year, and quality state used to build this profile.</p>
            <div className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
              {college.facts.map((fact) => <FactRow key={fact.field_key} fact={fact} />)}
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">How to read this page</h2>
              <ul className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
                <li className="flex gap-3"><CalendarDays className="mt-1 h-4 w-4 shrink-0 text-primary" /><span>Years describe the source cohort, not necessarily the current application cycle.</span></li>
                <li className="flex gap-3"><FileQuestion className="mt-1 h-4 w-4 shrink-0 text-primary" /><span>“Unavailable” means the source did not provide a publishable value.</span></li>
                <li className="flex gap-3"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" /><span>Admission rate is descriptive. It does not predict an individual student’s result.</span></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Catalog releases</h2>
              <div className="mt-4 space-y-3">{sources.map((source) => <div key={`${source.producer}-${source.release}`}><p className="text-sm font-medium text-slate-800">{source.producer}</p><p className="mt-0.5 break-words text-xs leading-5 text-slate-500">{source.release}</p></div>)}</div>
              <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">Projection {projectionVersionId.slice(0, 8)} · Field contract provisional</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value, note, icon }: { label: string; value: string; note: string; icon?: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="flex items-center gap-2 text-sm text-slate-500">{icon}{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></div>;
}

function FactRow({ fact }: { fact: FoundationCollegeFact }) {
  const value = displayFactValue(fact);
  return <div className="grid gap-2 py-4 sm:grid-cols-[minmax(150px,.7fr)_minmax(140px,.55fr)_minmax(220px,1fr)] sm:items-center"><div><p className="text-sm font-medium text-slate-800">{metricLabels[fact.field_key] ?? fact.field_key.replaceAll('_', ' ')}</p><Badge variant="secondary" className="mt-1.5 font-normal">{fact.quality_status}</Badge></div><p className="text-sm font-semibold text-slate-950">{value}</p><div className="text-xs leading-5 text-slate-500"><p>{fact.source_name ?? 'Official federal source'} · {fact.source_release ?? 'Release unavailable'}</p><p>{fact.academic_year ? `Academic year ${fact.academic_year}` : fact.period_end ? `Reported ${fact.period_end.slice(0, 4)}` : 'Reporting period unavailable'}</p></div></div>;
}

function displayFactValue(fact: FoundationCollegeFact) {
  if (fact.is_suppressed) return 'Suppressed by source';
  if (fact.display_value === null) return 'Unavailable';
  const number = Number(fact.display_value);
  if (!Number.isFinite(number)) return fact.display_value;
  if (['admission_rate','pell_share','completion_150pct','retention_full_time'].includes(fact.field_key)) return formatCollegePercent(number);
  if (['tuition_in_state','tuition_out_of_state','cost_of_attendance','net_price','median_earnings_10yr'].includes(fact.field_key)) return formatCollegeCurrency(number);
  if (fact.field_key === 'undergraduate_enrollment') return number.toLocaleString();
  return fact.display_value;
}

function factNote(fact?: FoundationCollegeFact) {
  if (!fact) return 'No publishable source value';
  if (fact.is_suppressed) return 'Suppressed by source';
  return fact.academic_year ? `${fact.source_name ?? 'Federal source'}, ${fact.academic_year}` : fact.source_name ?? 'Official federal source';
}

function DetailSkeleton() {
  return <div className="min-h-full animate-pulse bg-slate-50"><div className="border-b bg-white"><div className="mx-auto max-w-6xl px-4 py-10"><div className="h-8 w-64 rounded bg-slate-200" /><div className="mt-4 h-5 w-44 rounded bg-slate-100" /></div></div><div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 rounded-2xl border bg-white" />)}</div></div>;
}
