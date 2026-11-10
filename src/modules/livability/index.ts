import { livabilityScore, safetyScore, walkDecay } from "@/lib/commute/livability";
import { nearbyForProperty } from "@/modules/pois";
import { prisma } from "@/lib/prisma";

export async function computePropertyScores(propertyId: string, lat: number, lng: number) {
  const places = await nearbyForProperty(propertyId, lat, lng);
  const minutes = (category: string) =>
    places.find((p) => p.category === category)?.walkingMinutes ?? null;

  const live = livabilityScore({
    food: { minutes: minutes("FOOD") },
    grocery: { minutes: minutes("GROCERY") },
    metro: { minutes: minutes("METRO") },
    hospital: { minutes: minutes("HOSPITAL") },
    gym: { minutes: minutes("GYM") },
    laundry: { minutes: minutes("LAUNDRY") },
    cafe: { minutes: minutes("CAFE") },
    atm: { minutes: minutes("ATM") },
    park: { minutes: minutes("PARK") },
  });

  const reviews = await prisma.review.findMany({
    where: { propertyId, verifiedStay: true },
    include: { scores: true },
  });
  const womenScores = reviews.map((r) => r.scores?.safety ?? 0).filter((n) => n > 0);
  const womenReviewAvg = womenScores.length
    ? womenScores.reduce((a, b) => a + b, 0) / womenScores.length
    : null;

  const safe = safetyScore({
    lightingDensity: 0.5,
    nightActivity: places.some((p) => p.category === "CAFE" && p.walkingMinutes <= 10) ? 0.6 : 0.3,
    policeMinutes: minutes("POLICE") ?? 18,
    womenReviewAvg,
    lastMileWalkMinutes: minutes("METRO") ?? 15,
  });

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      livabilityScore: live.score,
      livabilityBreakdown: live.breakdown,
      safetyScore: safe.score,
      safetyBreakdown: safe.breakdown,
    },
  });

  return { livability: live, safety: safe, walkDecay };
}
