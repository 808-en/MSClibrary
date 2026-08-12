// functions/api/codes.js
// Secure 5-digit code management API for msclibrary
// Codes are stored as SHA-256 hashes in KV — never in plaintext.
// Each code has metadata: { label, page, startDate, endDate, created }
// page: "admin" (admin/librarian) or "teacher" (teacher controls)
// startDate: ISO string or null (activation start; null = always active from now)
// endDate: ISO string or null (activation end; null = never expires)

const CODE_REGEX = /^\d{5}$/;
const VALID_PAGES = ["admin", "teacher"];

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
  return !!(key && env.ADMIN_SECRET && key === env.ADMIN_SECRET);
}

function isCurrentlyActive(metadata) {
  if (!metadata) return true;
  const now = Date.now();
  const start = metadata.startDate ? new Date(metadata.startDate).getTime() : null;
  const end = metadata.endDate ? new Date(metadata.endDate).getTime() : null;

  // If start date is in the future, not yet active
  if (start && now < start) return false;
  // If end date has passed, expired (end date is inclusive: +1 day)
  if (end && now > end + 86_400_000) return false;
  return true;
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
// GET /api/codes?code=X → verify a code (public, returns valid + active + page)
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
    
    let result;
    try {
      result = await env.MSC_CODES.getWithMetadata(hash);
    } catch (e) {
      return json({ valid: false });
    }

    // Robust null check — getWithMetadata may return null OR { value: null }
    if (!result || result.value === null || result.value === undefined) {
      return json({ valid: false });
    }

    const metadata = result.metadata || {};
    const active = isCurrentlyActive(metadata);

    if (!active) {
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
      page: metadata.page || "admin",
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
      startDate: m.startDate || null,
      endDate: m.endDate || null,
      created: m.created || null,
      active: isCurrentlyActive(m),
    };
  });
  return json({ codes });
}

// POST /api/codes → add a code (admin only)
// Body: { "code": "12345", "label": "optional", "page": "admin"|"teacher",
//         "startDate": "2026-08-12" | null, "endDate": "2026-12-31" | null }
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
  const startDate = body.startDate ? String(body.startDate).trim() : null;
  const endDate = body.endDate ? String(body.endDate).trim() : null;

  if (!CODE_REGEX.test(code)) {
    return json({ error: "Code must be exactly 5 digits (0-9)." }, 400);
  }
  if (!VALID_PAGES.includes(page)) {
    return json({ error: "Page must be 'admin' or 'teacher'." }, 400);
  }

  // Validate date format if provided
  if (startDate && isNaN(new Date(startDate).getTime())) {
    return json({ error: "Invalid start date." }, 400);
  }
  if (endDate && isNaN(new Date(endDate).getTime())) {
    return json({ error: "Invalid end date." }, 400);
  }
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return json({ error: "Start date cannot be after end date." }, 400);
  }

  const hash = await sha256(code);
  const existing = await env.MSC_CODES.get(hash);
  if (existing !== null) {
    return json({ error: "This code already exists." }, 409);
  }

  await env.MSC_CODES.put(hash, "1", {
    metadata: { label, page, startDate, endDate, created: new Date().toISOString() },
  });

  return json({ success: true, message: "Code added." });
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