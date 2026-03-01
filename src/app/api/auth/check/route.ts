import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getSessionToken } from "@/lib/auth-cookies";

export async function GET() {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  const valid = await verifySessionToken(token);
  return NextResponse.json({ authenticated: valid });
}
