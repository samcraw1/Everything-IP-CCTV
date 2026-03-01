import { NextRequest, NextResponse } from "next/server";
import { getSessionTokenFromRequest, verifySessionToken } from "@/lib/auth";

const PUBLIC_PREFIXES = [
  "/login",
  "/quote/",
  "/api/auth/",
  "/api/quote/",
  "/_next/",
  "/favicon",
  "/manifest",
  "/icon-",
  "/sw.js",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files (anything with a file extension)
  if (pathname.includes(".") && !pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check session
  const token = getSessionTokenFromRequest(request);

  if (!token) {
    return handleUnauthorized(request);
  }

  const valid = await verifySessionToken(token);
  if (!valid) {
    return handleUnauthorized(request);
  }

  return NextResponse.next();
}

function handleUnauthorized(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
