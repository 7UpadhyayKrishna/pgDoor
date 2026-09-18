import { PgCardSkeleton } from "@/components/search/pg-card-skeleton";

export default function Loading() {
  return (
    <div className="container-pg grid gap-8 py-8 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <PgCardSkeleton key={i} />
      ))}
    </div>
  );
}
