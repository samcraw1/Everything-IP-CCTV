import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getSessionFromCookies } from "@/lib/auth-cookies";

export async function GET() {
  const session = await getSessionFromCookies();

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const supabase = getServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("name, email, role")
    .eq("id", session.userId)
    .single();

  const { data: org } = await supabase
    .from("organizations")
    .select("name, plan")
    .eq("id", session.orgId)
    .single();

  if (!user || !org) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    user: { name: user.name, email: user.email, role: user.role },
    org: { name: org.name, plan: org.plan },
  });
}
