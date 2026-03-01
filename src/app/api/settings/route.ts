import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getOrgFromRequest, unauthorizedResponse } from "@/lib/api-auth";

// GET settings for the authenticated org
export async function GET(request: NextRequest) {
  const session = await getOrgFromRequest(request);
  if (!session) return unauthorizedResponse();

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("org_id", session.orgId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// UPDATE settings
export async function PATCH(request: NextRequest) {
  const session = await getOrgFromRequest(request);
  if (!session) return unauthorizedResponse();

  const body = await request.json();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, org_id, ...updates } = body;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("settings")
    .update(updates)
    .eq("org_id", session.orgId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
