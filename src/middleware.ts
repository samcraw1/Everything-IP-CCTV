import { NextResponse } from "next/server";

// Auth disabled — all routes are public
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
