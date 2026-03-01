import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { verifyPassword, createSessionToken } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth-cookies";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: settings } = await supabase
    .from("settings")
    .select("owner_password_hash")
    .limit(1)
    .single();

  if (!settings?.owner_password_hash) {
    return NextResponse.json({ error: "No password set. Visit the login page to set one up." }, { status: 403 });
  }

  const valid = await verifyPassword(password, settings.owner_password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = await createSessionToken();
  await setSessionCookie(token);

  return NextResponse.json({ success: true });
}
