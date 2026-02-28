import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// GET all leads
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,customer_address.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// CREATE a new lead
export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = uuidv4();
  const now = new Date().toISOString();

  const lead = {
    id,
    customer_name: body.customer_name,
    customer_phone: body.customer_phone || "",
    customer_address: body.customer_address || "",
    brain_dump: body.brain_dump || "",
    audio_url: body.audio_url || null,
    audio_transcription: body.audio_transcription || null,
    photo_urls: body.photo_urls || null,
    photo_analysis: body.photo_analysis || null,
    status: "new",
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from("leads").insert(lead).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// UPDATE lead (status change, etc.)
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
