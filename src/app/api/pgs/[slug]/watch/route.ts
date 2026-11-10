import { handleRouteError, jsonOk } from "@/lib/http";
import { getCurrentUser, requireUser } from "@/lib/session";
import { isWatching, unwatchProperty, watchProperty } from "@/modules/availability-watch";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { slug } = await context.params;
    const user = await getCurrentUser();
    if (!user) return jsonOk({ watching: false, signedIn: false });
    return jsonOk({ watching: await isWatching(user.id, slug), signedIn: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { slug } = await context.params;
    await watchProperty(user.id, slug);
    return jsonOk({ watching: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { slug } = await context.params;
    await unwatchProperty(user.id, slug);
    return jsonOk({ watching: false });
  } catch (error) {
    return handleRouteError(error);
  }
}
