// functions/api/codes.js
// Secure 5-digit code management API for msclibrary
// Codes are stored as SHA-256 hashes in KV — never in plaintext.
// Each code has metadata: { label, page, duration, periods, created }
// page: "admin" (admin/librarian) or "teacher" (teacher controls)
// duration: "always" | "1w" | "2w" | "3w" | "1m" | "2m" | "3m" | "4m" | "5m" | "6m"
// periods: array of numbers 0-45 (class periods when code is active; empty = all)

const CODE_REGEX = /^\d{5}$/;
const VALID_PAGES = ["admin", "teacher"];
const VALID_DURATIONS = ["always", "1w", "2w", "3w", "1m", "2m", "3m", "4m", "5m", "6m"];

const DURATION_DAYS = {
  "always": null,
  "1w": 7, "2w": 14, "3w": 21,
  "1m": 30, "2m": 60, "3m": 90, "4m": 120, "5m": 150, "6m": 180,
};

const INACTIVE_MESSAGE = "Your password is not currently active, meaning your period of activity has either ended or your librarian duties and privileges have been revoked. If you believe this is a mistake, talk to your teacher or submit the form on the help page.";
const HELP_URL = "https://msclibrary.pages.dev/helpForum";

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    },
  });
}

async function isAdmin(request, env) {
  const key = request.headers.get("X-Admin-Key");
  return key && env.ADMIN_SECRET && key === env.ADMIN_SECRET;
}

function isExpired(metadata) {
  if (!metadata || !metadata.duration || metadata.duration === "always") return false;
  const days = DURATION_DAYS[metadata.duration];
  if (!days) return false;
  const created = new Date(metadata.created).getTime();
  const expiresAt = created + days * 24 * 60 * 60 * 1000;
  return Date.now() > expiresAt;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    },
  });
}

// GET /api/codes        → list all codes with metadata (admin only)
// GET /api/codes?code=X → verify a code (public, returns valid + active + page + periods)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const codeParam = url.searchParams.get("code");

  // Public verification endpoint
  if (codeParam) {
    if (!CODE_REGEX.test(codeParam)) {
      return json({ valid: false, error: "Code must be exactly 5 digits." }, 400);
    }
    const hash = await sha256(codeParam);
    const result = await env.MSC_CODES.getWithMetadata(hash);
    if (result === null) {
      return json({ valid: false });
    }
    if (isExpired(result.metadata)) {
      return json({
        valid: true,
        active: false,
        message: INACTIVE_MESSAGE,
        helpUrl: HELP_URL,
      });
    }
    return json({
      valid: true,
      active: true,
      page: result.metadata?.page || "admin",
      periods: result.metadata?.periods || [],
    });
  }

  // List all codes (admin only)
  if (!(await isAdmin(request, env))) {
    return json({ error: "Unauthorized" }, 401);
  }

  const keys = await env.MSC_CODES.list();
  const codes = keys.keys.map((k) => {
    const m = k.metadata || {};
    return {
      id: k.name,
      label: m.label || null,
      page: m.page || "admin",
      duration: m.duration || "always",
      periods: m.periods || [],
      created: m.created || null,
      expired: isExpired(m),
    };
  });
  return json({ codes });
}

// POST /api/codes → add a code (admin only)
// Body: { "code": "12345", "label": "optional", "page": "admin"|"teacher",
//         "duration": "always"|"1w"|..., "periods": [0,1,2] }
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!(await isAdmin(request, env))) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const code = String(body.code || "").trim();
  const label = body.label ? String(body.label).trim().slice(0, 100) : null;
  const page = String(body.page || "admin").trim();
  const duration = String(body.duration || "always").trim();
  const periods = Array.isArray(body.periods)
    ? body.periods.filter((p) => typeof p === "number" && p >= 0 && p <= 45)
    : [];

  if (!CODE_REGEX.test(code)) {
    return json({ error: "Code must be exactly 5 digits (0-9)." }, 400);
  }
  if (!VALID_PAGES.includes(page)) {
    return json({ error: "Page must be 'admin' or 'teacher'." }, 400);
  }
  if (!VALID_DURATIONS.includes(duration)) {
    return json({ error: "Invalid duration." }, 400);
  }

  const hash = await sha256(code);
  const existing = await env.MSC_CODES.get(hash);
  if (existing !== null) {
    return json({ error: "This code already exists." }, 409);
  }

  await env.MSC_CODES.put(hash, "1", {
    metadata: { label, page, duration, periods, created: new Date().toISOString() },
  });

  return json({ success: true, message: "Code added.", page, duration });
}

// DELETE /api/codes?delete_id=HASH     → remove by hash ID
// DELETE /api/codes  body: { "code": "12345" }            → remove by code
// DELETE /api/codes  body: { "delete_ids": ["hash1",...] } → batch delete
// DELETE /api/codes  body: { "delete_all": true }          → delete all
export async function onRequestDelete(context) {
  const { request, env } = context;

  if (!(await isAdmin(request, env))) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const deleteId = url.searchParams.get("delete_id");

  // Delete by hash ID (from admin panel list)
  if (deleteId) {
    const existing = await env.MSC_CODES.get(deleteId);
    if (existing === null) {
      return json({ error: "Code not found." }, 404);
    }
    await env.MSC_CODES.delete(deleteId);
    return json({ success: true, message: "Code removed." });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  // Delete all codes
  if (body.delete_all === true) {
    const keys = await env.MSC_CODES.list();
    for (const key of keys.keys) {
      await env.MSC_CODES.delete(key.name);
    }
    return json({ success: true, message: `Deleted ${keys.keys.length} code(s).` });
  }

  // Batch delete by IDs
  if (Array.isArray(body.delete_ids) && body.delete_ids.length > 0) {
    for (const id of body.delete_ids) {
      await env.MSC_CODES.delete(id);
    }
    return json({ success: true, message: `Deleted ${body.delete_ids.length} code(s).` });
  }

  // Delete by original code value
  const code = String(body.code || "").trim();
  if (!CODE_REGEX.test(code)) {
    return json({ error: "Code must be exactly 5 digits (0-9)." }, 400);
  }

  const hash = await sha256(code);
  const existing = await env.MSC_CODES.get(hash);
  if (existing === null) {
    return json({ error: "Code not found." }, 404);
  }

  await env.MSC_CODES.delete(hash);
  return json({ success: true, message: "Code removed." });
}