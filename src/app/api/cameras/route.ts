import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getOrgFromRequest, unauthorizedResponse } from "@/lib/api-auth";
import { v4 as uuidv4 } from "uuid";

// GET cameras for a lead
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
    .from("cameras")
    .select("*")
    .eq("lead_id", leadId)
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// CREATE a camera
export async function POST(request: NextRequest) {
  const session = await getOrgFromRequest(request);
  if (!session) return unauthorizedResponse();

  const body = await request.json();

  if (!body.lead_id || !body.name || !body.ip_address) {
    return NextResponse.json({ error: "lead_id, name, and ip_address are required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("cameras")
    .insert({
      id: uuidv4(),
      lead_id: body.lead_id,
      org_id: session.orgId,
      name: body.name,
      ip_address: body.ip_address,
      web_url: body.web_url || null,
      brand: body.brand || null,
      location_note: body.location_note || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// UPDATE a camera
export async function PATCH(request: NextRequest) {
  const session = await getOrgFromRequest(request);
  if (!session) return unauthorizedResponse();

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Camera ID required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("cameras")
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

// DELETE a camera
export async function DELETE(request: NextRequest) {
  const session = await getOrgFromRequest(request);
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Camera ID required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("cameras")
    .delete()
    .eq("id", id)
    .eq("org_id", session.orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
