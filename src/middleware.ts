import { NextRequest, NextResponse } from "next/server";
import { getSessionTokenFromRequest, verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/quote",
  "/api/auth",
  "/api/quote",
];

const PUBLIC_PREFIXES = [
  "/_next",
  "/favicon.ico",
  "/manifest.json",
  "/sw.js",
  "/icon-",
];

function isPublicPath(pathname: string): boolean {
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  for (const path of PUBLIC_PATHS) {
    if (pathname === path || pathname.startsWith(path + "/")) return true;
  }
  // Static file extensions
  if (/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$/.test(pathname)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = getSessionTokenFromRequest(request);
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await verifySessionToken(token);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
