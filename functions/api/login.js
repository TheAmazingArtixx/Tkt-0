import { createSessionCookie, jsonResponse } from "../_utils/auth.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { password } = body;

  if (!env.ADMIN_PASSWORD) {
    return jsonResponse(
      { ok: false, error: "ADMIN_PASSWORD n'est pas configuré sur le serveur." },
      500
    );
  }

  if (!password || password !== env.ADMIN_PASSWORD) {
    return jsonResponse({ ok: false, error: "Mot de passe incorrect." }, 401);
  }

  const cookie = await createSessionCookie(env.SESSION_SECRET);
  return jsonResponse({ ok: true }, 200, { "Set-Cookie": cookie });
}
