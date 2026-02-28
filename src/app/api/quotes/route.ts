import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// GET quotes - optionally filter by lead_id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("lead_id");

  let query = supabase.from("quotes").select("*").order("created_at", { ascending: false });

  if (leadId) {
    query = query.eq("lead_id", leadId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// CREATE a new quote
export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = uuidv4();

  const quote = {
    id,
    lead_id: body.lead_id,
    scope_of_work: body.scope_of_work,
    line_items: body.line_items,
    subtotal: body.subtotal,
    tax: body.tax,
    total: body.total,
    terms: body.terms,
    valid_until: body.valid_until,
    notes: body.notes || null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("quotes").insert(quote).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update lead status to quoted
  await supabase
    .from("leads")
    .update({ status: "quoted", updated_at: new Date().toISOString() })
    .eq("id", body.lead_id);

  return NextResponse.json(data, { status: 201 });
}

// UPDATE a quote
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Quote ID required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("quotes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
