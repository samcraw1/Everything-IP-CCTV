import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { response } = await request.json();

  if (!["accepted", "declined"].includes(response)) {
    return NextResponse.json({ error: "Invalid response" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Verify quote exists and hasn't been responded to
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, quote_status, lead_id")
    .eq("id", id)
    .single();

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.quote_status === "accepted" || quote.quote_status === "declined") {
    return NextResponse.json({ error: "Already responded" }, { status: 400 });
  }

  const { error } = await supabase
    .from("quotes")
    .update({
      quote_status: response,
      customer_response_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If accepted, update lead status to "booked"
  if (response === "accepted" && quote.lead_id) {
    await supabase
      .from("leads")
      .update({ status: "booked", updated_at: new Date().toISOString() })
      .eq("id", quote.lead_id);
  }

  return NextResponse.json({ success: true, status: response });
}
