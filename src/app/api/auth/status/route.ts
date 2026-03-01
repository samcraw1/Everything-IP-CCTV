import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("settings")
    .select("owner_password_hash")
    .limit(1)
    .single();

  return NextResponse.json({
    passwordSet: !!data?.owner_password_hash,
  });
}
