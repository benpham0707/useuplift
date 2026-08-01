import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Building2, MapPin, Users } from 'lucide-react';
import type { FoundationCollegeSummary } from '@/lib/types/college';
import { formatCollegeCurrency, formatCollegePercent, ownershipLabel } from '@/services/collegeDiscovery/format';

export function CollegeCard({ college }: { college: FoundationCollegeSummary }) {
  const navigate = useNavigate();
  const location = [college.city, college.state].filter(Boolean).join(', ') || 'Location unavailable';

  return (
    <button
      type="button"
      onClick={() => navigate(`/dashboard/colleges/${college.slug}`)}
      className="group flex min-h-[250px] w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`View ${college.name}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-base font-semibold leading-snug text-slate-950 group-hover:text-primary">
              {college.name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{location}</span>
            </p>
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-primary" aria-hidden="true" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Admission rate" value={formatCollegePercent(college.admission_rate)} />
        <Stat label="Average net price" value={formatCollegeCurrency(college.net_price)} />
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Institution</p>
          <p className="mt-1 text-sm font-medium text-slate-700">{ownershipLabel(college.ownership)}</p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            <Users className="h-3 w-3" aria-hidden="true" /> Enrollment
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {college.undergraduate_enrollment?.toLocaleString() ?? 'Unavailable'}
          </p>
        </div>
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
