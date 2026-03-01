import { NextRequest } from "next/server";

const SESSION_COOKIE = "eip_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

// --- Password hashing with PBKDF2 (Web Crypto API, Edge-safe) ---

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const saltHex = Buffer.from(salt).toString("hex");
  const hashHex = Buffer.from(hash).toString("hex");
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, expectedHashHex] = stored.split(":");
  if (!saltHex || !expectedHashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hashHex = Buffer.from(hash).toString("hex");
  return hashHex === expectedHashHex;
}

// --- Session tokens: HMAC-signed userId.orgId.timestamp.nonce ---

export interface SessionPayload {
  userId: string;
  orgId: string;
}

export async function createSessionToken(userId: string, orgId: string): Promise<string> {
  const payload = `${userId}.${orgId}.${Date.now()}.${crypto.randomUUID()}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigHex = Buffer.from(signature).toString("hex");
  return `${payload}.${sigHex}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return null;
    const payload = token.substring(0, lastDot);
    const sigHex = token.substring(lastDot + 1);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(getSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = Buffer.from(sigHex, "hex");
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
    if (!valid) return null;

    // payload is "userId.orgId.timestamp.nonce"
    const parts = payload.split(".");
    if (parts.length < 4) return null;
    const userId = parts[0];
    const orgId = parts[1];
    const timestamp = parseInt(parts[2], 10);
    const age = (Date.now() - timestamp) / 1000;
    if (age >= SESSION_MAX_AGE) return null;

    return { userId, orgId };
  } catch {
    return null;
  }
}

// --- Cookie reading for middleware (Edge-compatible) ---

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_COOKIE_MAX_AGE = SESSION_MAX_AGE;

export function getSessionTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;
  return verifySessionToken(token);
}
