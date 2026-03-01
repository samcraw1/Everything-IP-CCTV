import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { hashPassword, createSessionToken } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth-cookies";
import { DEFAULT_PRICING, DEFAULT_TERMS } from "@/types";
import { v4 as uuidv4 } from "uuid";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

export async function POST(request: NextRequest) {
  const { email, password, name, business_name } = await request.json();

  if (!email || !password || !name || !business_name) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const emailNorm = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailNorm)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Check email uniqueness
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", emailNorm)
    .single();

  if (existingUser) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  // Generate unique slug
  let slug = slugify(business_name);
  if (!slug) slug = "org";
  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existingOrg) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Create organization
  const orgId = uuidv4();
  const { error: orgError } = await supabase
    .from("organizations")
    .insert({ id: orgId, name: business_name.trim(), slug });

  if (orgError) {
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }

  // Create default settings for the org
  const { error: settingsError } = await supabase
    .from("settings")
    .insert({
      id: uuidv4(),
      org_id: orgId,
      business_name: business_name.trim(),
      business_phone: "",
      business_email: emailNorm,
      business_address: "",
      logo_url: null,
      pricing: DEFAULT_PRICING,
      tax_rate: 8.25,
      default_terms: DEFAULT_TERMS,
      validity_days: 30,
    });

  if (settingsError) {
    // Clean up org if settings creation fails
    await supabase.from("organizations").delete().eq("id", orgId);
    return NextResponse.json({ error: "Failed to create settings" }, { status: 500 });
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const userId = uuidv4();
  const { error: userError } = await supabase
    .from("users")
    .insert({
      id: userId,
      org_id: orgId,
      email: emailNorm,
      password_hash: passwordHash,
      name: name.trim(),
      role: "owner",
    });

  if (userError) {
    // Clean up org and settings
    await supabase.from("settings").delete().eq("org_id", orgId);
    await supabase.from("organizations").delete().eq("id", orgId);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  // Create session
  const token = await createSessionToken(userId, orgId);
  await setSessionCookie(token);

  return NextResponse.json({
    success: true,
    user: { name: name.trim(), email: emailNorm, role: "owner" },
    org: { name: business_name.trim(), plan: "free" },
  });
}
