export function PgCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] rounded-[18px] bg-[#e8eaee]" />
      <div className="mt-3 h-4 w-2/3 rounded bg-[#e8eaee]" />
      <div className="mt-2 h-3 w-1/2 rounded bg-[#e8eaee]" />
      <div className="mt-2 h-3 w-1/3 rounded bg-[#e8eaee]" />
    </div>
  );
}
