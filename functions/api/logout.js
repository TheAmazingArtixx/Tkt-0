import { clearSessionCookie, jsonResponse } from "../_utils/auth.js";

export async function onRequestPost() {
  return jsonResponse({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
}
