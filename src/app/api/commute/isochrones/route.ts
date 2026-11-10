import { z } from "zod";
import { cellToBoundary } from "h3-js";
import { prisma } from "@/lib/prisma";
import { cellFor } from "@/lib/geo/h3";
import { parseCommuteMode } from "@/lib/commute/modes";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = z
      .object({
        destLat: z.coerce.number(),
        destLng: z.coerce.number(),
        mode: z.string().optional(),
        slot: z.enum(["peak", "offpeak"]).optional(),
      })
      .parse({
        destLat: url.searchParams.get("destLat"),
        destLng: url.searchParams.get("destLng"),
        mode: url.searchParams.get("mode") ?? undefined,
        slot: url.searchParams.get("slot") ?? undefined,
      });

    const destH3 = cellFor(parsed.destLat, parsed.destLng);
    const mode = parseCommuteMode(parsed.mode);
    const edges = await prisma.commuteEdge.findMany({
      where: {
        destH3,
        mode,
        slot: parsed.slot ?? "peak",
      },
      include: { property: { select: { h3Cell: true, latitude: true, longitude: true } } },
      take: 2000,
    });

    const bands = [15, 30, 45];
    const isochrones = bands.map((minutes) => {
      const cells = new Set<string>();
      for (const edge of edges) {
        if (edge.minutes > minutes) continue;
        const cell = edge.property.h3Cell ?? cellFor(edge.property.latitude, edge.property.longitude);
        cells.add(cell);
      }
      const path = [...cells].flatMap((cell) =>
        cellToBoundary(cell, true).map(([lat, lng]) => ({ lat, lng })),
      );
      return { minutes, path };
    });

    return jsonOk({ isochrones });
  } catch (error) {
    return handleRouteError(error);
  }
}
