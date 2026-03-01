import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { hashPassword, verifySessionToken } from "@/lib/auth";
import { getSessionToken, setSessionCookie } from "@/lib/auth-cookies";
import { createSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { new_password } = await request.json();

  if (!new_password || new_password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: settings } = await supabase
    .from("settings")
    .select("id, owner_password_hash")
    .limit(1)
    .single();

  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 500 });
  }

  // If password already exists, require valid session
  if (settings.owner_password_hash) {
    const token = await getSessionToken();
    if (!token || !(await verifySessionToken(token))) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
  }

  const hash = await hashPassword(new_password);
  const { error } = await supabase
    .from("settings")
    .update({ owner_password_hash: hash })
    .eq("id", settings.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create session so user is logged in after setting password
  const sessionToken = await createSessionToken();
  await setSessionCookie(sessionToken);

  return NextResponse.json({ success: true });
}
