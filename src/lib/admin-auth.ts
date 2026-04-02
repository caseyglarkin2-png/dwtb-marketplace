import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const ADMIN_COOKIE = "dwtb_admin_session";
const SESSION_TTL = 86400; // 24 hours in seconds

// Simple HMAC-like signing using Web Crypto
async function sign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verify(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expected = await sign(payload, secret);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("ADMIN_SECRET must be set and at least 16 characters");
  }
  return secret;
}

export async function createAdminSession(): Promise<void> {
  const secret = getSecret();
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL;
  const payload = `admin:${expires}`;
  const signature = await sign(payload, secret);
  const token = `${payload}:${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_TTL,
    path: "/",
  });
}

export async function validateAdminSession(): Promise<boolean> {
  try {
    const secret = getSecret();
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;
    if (!token) return false;

    const parts = token.split(":");
    if (parts.length !== 3) return false;

    const [prefix, expiresStr, signature] = parts;
    const payload = `${prefix}:${expiresStr}`;

    // Check signature
    const valid = await verify(payload, signature, secret);
    if (!valid) return false;

    // Check expiry
    const expires = parseInt(expiresStr, 10);
    if (isNaN(expires) || Math.floor(Date.now() / 1000) > expires) return false;

    return true;
  } catch {
    return false;
  }
}

export function checkAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  // Constant-time comparison
  if (password.length !== adminPassword.length) return false;
  let mismatch = 0;
  for (let i = 0; i < password.length; i++) {
    mismatch |= password.charCodeAt(i) ^ adminPassword.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

// For API routes: validate from request headers (cookie is auto-forwarded)
export async function validateAdminRequest(
  _request: NextRequest
): Promise<boolean> {
  return validateAdminSession();
}
