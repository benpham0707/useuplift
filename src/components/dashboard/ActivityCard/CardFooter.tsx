import { Clock, Sparkles, CheckCircle2, Lightbulb } from "lucide-react";

export const CardFooter = ({ hours, essays, checks, insights }: {
  hours: number;
  essays: number;
  checks: number;
  insights: number;
}) => {
  const itemBase = "flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800";
  const textBase = "text-xs font-semibold text-slate-600 dark:text-slate-300";
  const labelBase = "text-slate-400 dark:text-slate-500 font-medium ml-0.5";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Hours */}
      <div className={itemBase}>
        <Clock size={16} className="text-indigo-500 stroke-[2.5]" />
        <span className={textBase}>{hours}h <span className={labelBase}>logged</span></span>
      </div>

      {/* Essay */}
      {essays > 0 && (
        <div className={itemBase}>
          <Sparkles size={16} className="text-purple-500 stroke-[2.5]" />
          <span className={textBase}>{essays} <span className={labelBase}>Essay</span></span>
        </div>
      )}

      {/* Checks */}
      {checks > 0 && (
        <div className={itemBase}>
          <CheckCircle2 size={16} className="text-emerald-500 stroke-[2.5]" />
          <span className={textBase}>{checks} <span className={labelBase}>Verified</span></span>
        </div>
      )}

      {/* Insights */}
      {insights > 0 && (
        <div className={itemBase}>
          <Lightbulb size={16} className="text-amber-500 stroke-[2.5]" />
          <span className={textBase}>{insights} <span className={labelBase}>Insights</span></span>
        </div>
      )}
    </div>
  );
};
