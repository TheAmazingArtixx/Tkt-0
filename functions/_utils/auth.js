// Utilitaires d'authentification partagés par les fonctions API.
// Cookie de session signé en HMAC-SHA256, pas besoin de stocker la session côté serveur.

async function hmac(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionCookie(secret) {
  const exp = Date.now() + 1000 * 60 * 60 * 12; // session valable 12h
  const payload = `${exp}`;
  const sig = await hmac(secret, payload);
  const token = `${payload}.${sig}`;
  return `session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`;
}

export function clearSessionCookie() {
  return "session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";
}

export async function verifySession(request, secret) {
  if (!secret) return false;
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/session=([^;]+)/);
  if (!match) return false;
  const [payload, sig] = match[1].split(".");
  if (!payload || !sig) return false;
  const expected = await hmac(secret, payload);
  if (expected !== sig) return false;
  if (Date.now() > Number(payload)) return false;
  return true;
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
