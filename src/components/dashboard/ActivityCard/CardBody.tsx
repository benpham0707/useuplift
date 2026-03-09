export const CardBody = ({ description }: { description: string }) => {
  return (
    <div className="pr-4 md:pr-12">
      <p className="text-[15px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium italic line-clamp-2">
        &ldquo;{description}&rdquo;
      </p>
    </div>
  );
};
