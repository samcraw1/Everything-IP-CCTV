import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DEFAULT_PRICING, DEFAULT_TERMS } from "@/types";
import { v4 as uuidv4 } from "uuid";

// GET settings (returns single row or creates default)
export async function GET() {
  const { data, error } = await supabase.from("settings").select("*").limit(1).single();

  if (error && error.code === "PGRST116") {
    // No settings row exists, create default
    const defaults = {
      id: uuidv4(),
      business_name: "Everything IP CCTV",
      business_phone: "",
      business_email: "",
      business_address: "",
      logo_url: null,
      pricing: DEFAULT_PRICING,
      tax_rate: 8.25,
      default_terms: DEFAULT_TERMS,
      validity_days: 30,
    };

    const { data: created, error: createError } = await supabase
      .from("settings")
      .insert(defaults)
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json(created);
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Strip sensitive fields
  if (data) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { owner_password_hash, ...safeData } = data;
    return NextResponse.json(safeData);
  }

  return NextResponse.json(data);
}

// UPDATE settings
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Settings ID required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("settings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
