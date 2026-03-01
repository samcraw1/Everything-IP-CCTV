import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, SessionPayload } from "./auth";

export async function getOrgFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  return getSessionFromRequest(request);
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
