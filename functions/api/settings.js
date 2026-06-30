import { verifySession, jsonResponse } from "../_utils/auth.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT key, value FROM settings").all();
  const settings = {};
  for (const row of results) settings[row.key] = row.value;
  return jsonResponse({ ok: true, settings });
}

export async function onRequestPut({ request, env }) {
  const authed = await verifySession(request, env.SESSION_SECRET);
  if (!authed) return jsonResponse({ ok: false, error: "Non autorisé." }, 401);

  const data = await request.json().catch(() => null);
  if (!data) return jsonResponse({ ok: false, error: "Données invalides." }, 400);

  const allowedKeys = ["radio_show_name", "radio_stream_url", "radio_enabled"];
  for (const key of allowedKeys) {
    if (key in data) {
      await env.DB.prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      )
        .bind(key, String(data[key]))
        .run();
    }
  }

  return jsonResponse({ ok: true });
}
