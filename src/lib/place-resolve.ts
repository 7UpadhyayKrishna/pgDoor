export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type CityLike = {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  areas: { id: string; name: string; latitude: number | null; longitude: number | null }[];
};

export function resolveCityAndArea(
  cities: CityLike[],
  place: {
    latitude: number;
    longitude: number;
    cityName: string | null;
    areaName: string | null;
  },
) {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cityAliases: Record<string, string[]> = {
    gurgaon: ["gurgaon", "gurugram"],
    delhi: ["delhi", "newdelhi", "nctofdelhi"],
    noida: ["noida"],
    "greater-noida": ["greaternoida"],
  };

  // "Greater Noida" contains "noida", so prefer exact, then the longest contained alias.
  const aliasScore = (needle: string, alias: string) => {
    if (needle === alias) return 1000;
    if (needle.includes(alias)) return alias.length;
    if (alias.includes(needle)) return needle.length / 2;
    return 0;
  };

  let city: CityLike | null = null;
  if (place.cityName) {
    const needle = normalize(place.cityName);
    let bestScore = 0;
    for (const c of cities) {
      const aliases = cityAliases[c.slug] ?? [normalize(c.name)];
      const score = Math.max(...aliases.map((a) => aliasScore(needle, a)));
      if (score > bestScore) {
        bestScore = score;
        city = c;
      }
    }
  }

  if (!city) {
    let best = Infinity;
    for (const c of cities) {
      if (c.latitude == null || c.longitude == null) continue;
      const d = haversineKm(place.latitude, place.longitude, c.latitude, c.longitude);
      if (d < best) {
        best = d;
        city = c;
      }
    }
  }

  if (!city) {
    return { cityId: "", areaId: "" };
  }

  let area =
    place.areaName
      ? city.areas.find((a) => {
          const aName = normalize(a.name);
          const needle = normalize(place.areaName!);
          return aName.includes(needle) || needle.includes(aName);
        })
      : undefined;

  if (!area) {
    let best = Infinity;
    for (const a of city.areas) {
      if (a.latitude == null || a.longitude == null) continue;
      const d = haversineKm(place.latitude, place.longitude, a.latitude, a.longitude);
      if (d < best) {
        best = d;
        area = a;
      }
    }
  }

  return {
    cityId: city.id,
    areaId: area?.id ?? city.areas[0]?.id ?? "",
  };
}
