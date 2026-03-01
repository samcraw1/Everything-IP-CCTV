import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { verifyPassword, createSessionToken } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth-cookies";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Look up user by email
  const { data: user, error } = await supabase
    .from("users")
    .select("id, org_id, email, name, password_hash, role")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Fetch org details
  const { data: org } = await supabase
    .from("organizations")
    .select("name, plan")
    .eq("id", user.org_id)
    .single();

  const token = await createSessionToken(user.id, user.org_id);
  await setSessionCookie(token);

  return NextResponse.json({
    success: true,
    user: { name: user.name, email: user.email, role: user.role },
    org: { name: org?.name, plan: org?.plan },
  });
}
