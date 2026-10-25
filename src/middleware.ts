import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/constants";
import { isPrelaunch, isPrelaunchBlockedApi, isPrelaunchBlockedPage } from "@/lib/launch";

function secret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "dev-session-secret-pgdoor-local-only",
  );
}

async function readRole(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: String(payload.sub), role: String(payload.role) };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const auth = await readRole(request);

  if (isPrelaunch() && auth?.role !== "ADMIN") {
    if (isPrelaunchBlockedApi(pathname)) {
      return NextResponse.json({ error: "Not available until launch" }, { status: 404 });
    }
    if (isPrelaunchBlockedPage(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ownerApp =
    pathname.startsWith("/owners/dashboard") ||
    pathname.startsWith("/owners/properties") ||
    pathname.startsWith("/owners/leads") ||
    pathname.startsWith("/owners/availability");

  if (ownerApp && !auth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (ownerApp && auth && auth.role !== "OWNER" && auth.role !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/owners/register";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin")) {
    if (!auth) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (auth.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if ((pathname.startsWith("/account") || pathname === "/saved") && !auth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|uploads/|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|json|txt)$).*)"],
};
