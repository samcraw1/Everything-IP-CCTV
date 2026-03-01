import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getOrgFromRequest, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const session = await getOrgFromRequest(request);
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("lead_id");

  if (!leadId) {
    return NextResponse.json({ error: "lead_id required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("schematics")
    .select("*")
    .eq("lead_id", leadId)
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await getOrgFromRequest(request);
  if (!session) return unauthorizedResponse();

  const body = await request.json();

  if (!body.lead_id) {
    return NextResponse.json({ error: "lead_id required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("schematics")
    .insert({
      lead_id: body.lead_id,
      org_id: session.orgId,
      name: body.name || "Site Schematic",
      canvas_data: body.canvas_data || {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getOrgFromRequest(request);
  if (!session) return unauthorizedResponse();

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Schematic ID required" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("schematics")
    .update(updates)
    .eq("id", id)
    .eq("org_id", session.orgId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const session = await getOrgFromRequest(request);
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Schematic ID required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("schematics")
    .delete()
    .eq("id", id)
    .eq("org_id", session.orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
