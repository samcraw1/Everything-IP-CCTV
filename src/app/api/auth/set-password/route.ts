import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { getSessionFromCookies } from "@/lib/auth-cookies";

export async function POST(request: Request) {
  const { current_password, new_password } = await request.json();

  if (!new_password || new_password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, password_hash")
    .eq("id", session.userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify current password
  if (current_password) {
    const valid = await verifyPassword(current_password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }
  }

  const hash = await hashPassword(new_password);
  const { error } = await supabase
    .from("users")
    .update({ password_hash: hash })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
