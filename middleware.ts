import { NextRequest, NextResponse } from "next/server";
import { getSubdomain } from "@/lib/subdomain";

/**
 * Host-based multi-tenant routing. A request to <sub>.<root> is rewritten
 * internally to /s/<sub>, preserving the path. The root domain serves the
 * landing page and /admin. Static assets and /api are left untouched.
 *
 * The rewrite is invisible to the user (URL stays on their subdomain), which is
 * exactly what makes "wrong-tenant" bugs subtle and worth a regression test.
 */
export function middleware(req: NextRequest) {
  // Header is authoritative behind the platform; fall back to the URL host.
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const subdomain = getSubdomain(host);

  // Root domain (or reserved host) → serve as-is.
  if (!subdomain) return NextResponse.next();

  const url = req.nextUrl.clone();
  // Avoid double-rewriting if something already targets /s/.
  if (url.pathname.startsWith(`/s/${subdomain}`)) return NextResponse.next();

  url.pathname = `/s/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
  // Surface the resolved tenant in a header so it shows up in runtime logs/traces.
  const res = NextResponse.rewrite(url);
  res.headers.set("x-tenant", subdomain);
  return res;
}

export const config = {
  // Run on everything except Next internals, static files, and API routes.
  matcher: ["/((?!_next/|api/|.*\\.[\\w]+$).*)"],
};
