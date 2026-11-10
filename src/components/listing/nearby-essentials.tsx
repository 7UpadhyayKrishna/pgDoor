const LABELS: Record<string, string> = {
  FOOD: "Food",
  GROCERY: "Grocery",
  METRO: "Metro",
  HOSPITAL: "Hospital",
  GYM: "Gym",
  LAUNDRY: "Laundry",
  CAFE: "Cafe",
  ATM: "ATM",
  PARK: "Park",
  LIBRARY: "Library",
};

export function NearbyEssentials({
  places,
}: {
  places: { id: string; name: string; category: string; walkingMinutes: number }[];
}) {
  if (!places.length) return null;
  const byCat = new Map<string, typeof places>();
  for (const place of places) {
    const list = byCat.get(place.category) ?? [];
    list.push(place);
    byCat.set(place.category, list);
  }
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Nearby essentials</h2>
      <p className="mt-1 text-sm text-muted-foreground">Walking times from this PG</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[...byCat.entries()].map(([category, items]) => (
          <div key={category} className="rounded-[18px] bg-white p-4 shadow-card">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {LABELS[category] ?? category}
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              {items.slice(0, 3).map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="truncate">{item.name}</span>
                  <span className="shrink-0 text-muted-foreground">{item.walkingMinutes} min</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
