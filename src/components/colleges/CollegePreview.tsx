import { AlertCircle, ArrowUpRight, Building2, Check, Database, Loader2, MapPin, Plus, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CollegeDetailResponse } from '@/services/collegeDiscovery/api';
import { formatCollegeCurrency, formatCollegePercent, ownershipLabel } from '@/services/collegeDiscovery/format';

interface CollegePreviewProps {
  response?: CollegeDetailResponse;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onOpenProfile: () => void;
  saved?: boolean;
  adding?: boolean;
  onAdd?: () => void;
}

export function CollegePreview({ response, loading, error, onRetry, onOpenProfile, saved = false, adding = false, onAdd }: CollegePreviewProps) {
  if (loading) return <PreviewState icon={<Loader2 className="h-5 w-5 animate-spin" />} title="Loading college profile…" />;
  if (error || !response) return <PreviewState icon={<AlertCircle className="h-5 w-5" />} title="Preview unavailable" body="The college list is still available while this profile reloads." action={<Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>} />;

  const { data: college, sources, projectionVersionId } = response;
  const facts = new Map(college.facts.map((fact) => [fact.field_key, fact]));
  const location = [college.city, college.state].filter(Boolean).join(', ') || 'Location unavailable';
  const reportingYear = latestReportingYear(college.facts);

  return (
    <article className="min-w-0 bg-white">
      <header className="border-b border-slate-200 px-5 py-5 xl:px-7">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" aria-hidden="true" /></div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight text-slate-950 xl:text-2xl">{college.name}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{location}</span><span aria-hidden="true">·</span><span>{ownershipLabel(college.ownership)}</span><span aria-hidden="true">·</span><span>Four-year</span></p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {onAdd && <Button size="sm" variant={saved ? 'secondary' : 'default'} onClick={onAdd} disabled={saved || adding}>{adding ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{saved ? 'Added to My Colleges' : 'Add to My Colleges'}</Button>}
            <Button variant="outline" size="sm" onClick={onOpenProfile}>View full profile<ArrowUpRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-5 py-5 xl:px-7">
        <section aria-labelledby="programs-heading">
          <SectionHeading number="1" id="programs-heading">Reported program areas</SectionHeading>
          {college.program_area_labels.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{college.program_area_labels.map((label) => <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">{label}</span>)}</div> : <p className="mt-3 text-sm text-slate-500">No bachelor’s program areas are available in this release.</p>}
        </section>

        <section className="border-t border-slate-200 pt-5" aria-labelledby="overview-preview-heading">
          <SectionHeading number="2" id="overview-preview-heading">Reported undergraduate overview</SectionHeading>
          <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Admission rate" value={formatCollegePercent(college.admission_rate)} note={factNote(facts.get('admission_rate'))} />
            <Metric label="Undergraduate enrollment" value={college.undergraduate_enrollment?.toLocaleString() ?? 'Unavailable'} note={factNote(facts.get('undergraduate_enrollment'))} icon={<Users className="h-3.5 w-3.5" />} />
            <Metric label="Average net price" value={formatCollegeCurrency(college.net_price)} note={factNote(facts.get('net_price'))} />
            <Metric label={college.ownership === 'public' ? 'Out-of-state tuition' : 'Published tuition'} value={formatCollegeCurrency(college.tuition_out_of_state)} note={factNote(facts.get('tuition_out_of_state'))} />
          </div>
        </section>

        <section className="border-t border-slate-200 pt-5" aria-labelledby="context-heading">
          <SectionHeading number="3" id="context-heading">Source and reporting context</SectionHeading>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-[minmax(0,1fr)_110px] bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500"><span>Official source</span><span>Reporting year</span></div>
            {sources.map((source) => <div key={`${source.producer}-${source.release}`} className="grid grid-cols-[minmax(0,1fr)_110px] gap-3 border-t border-slate-200 px-4 py-3 text-sm"><div className="min-w-0"><p className="font-medium text-slate-800">{source.producer}</p><p className="mt-0.5 truncate text-xs text-slate-500">{source.release}</p></div><p className="text-slate-600">{reportingYear}</p></div>)}
          </div>
        </section>

        <section className="border-t border-slate-200 pt-5" aria-labelledby="verify-heading">
          <SectionHeading number="4" id="verify-heading">What to verify next</SectionHeading>
          <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-600"><li>Review current costs using the college’s official net price calculator.</li><li>Confirm application requirements and deadlines on the official website.</li><li>Explore undergraduate programs, campus setting, and support services.</li></ul>
        </section>

        <footer className="flex flex-col gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Missing values remain unavailable rather than estimated.</p>
          <p className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" />Projection {projectionVersionId.slice(0, 8)}</p>
        </footer>
      </div>
    </article>
  );
}

function SectionHeading({ number, id, children }: { number: string; id: string; children: React.ReactNode }) {
  return <h3 id={id} className="flex items-center gap-2 text-sm font-semibold text-slate-900"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{number}</span>{children}</h3>;
}

function Metric({ label, value, note, icon }: { label: string; value: string; note: string; icon?: React.ReactNode }) {
  return <div className="min-w-0 bg-white px-4 py-4"><p className="flex items-center gap-1.5 text-xs text-slate-500">{icon}{label}</p><p className="mt-1.5 text-base font-semibold text-slate-950">{value}</p><p className="mt-1 truncate text-[11px] text-slate-500">{note}</p></div>;
}

function PreviewState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return <div className="flex min-h-[540px] items-center justify-center bg-white p-8 text-center"><div><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">{icon}</div><h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>{body && <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">{body}</p>}{action && <div className="mt-4">{action}</div>}</div></div>;
}

function factNote(fact: { source_name: string | null; academic_year: number | null } | undefined) {
  if (!fact) return 'No publishable value';
  return fact.academic_year ? `${fact.source_name ?? 'Federal source'}, ${fact.academic_year}` : fact.source_name ?? 'Official federal source';
}

function latestReportingYear(facts: Array<{ academic_year: number | null }>) {
  const years = facts.map((fact) => fact.academic_year).filter((year): year is number => year !== null);
  return years.length ? String(Math.max(...years)) : 'Unavailable';
}
