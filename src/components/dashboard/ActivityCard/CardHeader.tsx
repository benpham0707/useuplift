import { cn } from "@/lib/utils";

export const CardHeader = ({ index, title, tier, category }: {
  index: number;
  title: string;
  tier: string;
  category: string;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 w-full">
      <span className="font-mono text-sm font-bold text-slate-300 dark:text-slate-600 tracking-widest italic">
        #{String(index + 1).padStart(2, '0')}
      </span>
      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-indigo-950 dark:group-hover:text-indigo-200 transition-colors">
        {title}
      </h2>
      <div className="flex gap-2 items-center ml-1">
        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
          {tier}
        </span>
        <span className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
          category === "Core Identity"
            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        )}>
          {category}
        </span>
      </div>
    </div>
  );
};
