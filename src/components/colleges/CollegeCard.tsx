import { ArrowRight, Building2, MapPin } from 'lucide-react';
import type { FoundationCollegeSummary } from '@/lib/types/college';
import { formatCollegeCurrency, formatCollegePercent, ownershipLabel } from '@/services/collegeDiscovery/format';

interface CollegeCardProps {
  college: FoundationCollegeSummary;
  selected: boolean;
  onSelect: () => void;
}

export function CollegeCard({ college, selected, onSelect }: CollegeCardProps) {
  const location = [college.city, college.state].filter(Boolean).join(', ') || 'Location unavailable';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full border-b border-slate-200 px-4 py-4 text-left transition focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${selected ? 'bg-primary/[0.06] shadow-[inset_3px_0_0_hsl(var(--primary))]' : 'bg-white hover:bg-slate-50'}`}
      aria-current={selected ? 'true' : undefined}
      aria-label={`${selected ? 'Selected' : 'Preview'} ${college.name}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
          <Building2 className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="line-clamp-2 text-[15px] font-semibold leading-5 text-slate-950 group-hover:text-primary">{college.name}</h2>
            <ArrowRight className={`mt-0.5 h-4 w-4 shrink-0 transition ${selected ? 'text-primary' : 'text-slate-300 group-hover:text-primary'}`} aria-hidden="true" />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">{ownershipLabel(college.ownership)} · Four-year</p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 text-xs">
            <div><span className="text-slate-500">Admission </span><span className="font-semibold text-slate-800">{formatCollegePercent(college.admission_rate)}</span></div>
            <div><span className="text-slate-500">Net price </span><span className="font-semibold text-slate-800">{formatCollegeCurrency(college.net_price)}</span></div>
          </div>
        </div>
      </div>
    </button>
  );
}
