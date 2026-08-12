const CODE_REGEX = /^\d{5}$/;

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

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const codeParam = url.searchParams.get("code");

  if (codeParam) {
    if (!CODE_REGEX.test(codeParam)) {
      return json({ valid: false, error: "Code must be exactly 5 digits." }, 400);
    }
    const hash = await sha256(codeParam);
    const stored = await env.MSC_CODES.get(hash);
    return json({ valid: stored !== null });
  }

  if (!(await isAdmin(request, env))) {
    return json({ error: "Unauthorized" }, 401);
  }

  const keys = await env.MSC_CODES.list();
  const codes = keys.keys.map((k) => ({
    id: k.name,
    label: k.metadata?.label || null,
    created: k.metadata?.created || null,
  }));
  return json({ codes });
}

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

  if (!CODE_REGEX.test(code)) {
    return json({ error: "Code must be exactly 5 digits (0-9)." }, 400);
  }

  const hash = await sha256(code);
  const existing = await env.MSC_CODES.get(hash);
  if (existing !== null) {
    return json({ error: "This code already exists." }, 409);
  }

  await env.MSC_CODES.put(hash, "1", {
    metadata: { label, created: new Date().toISOString() },
  });

  return json({ success: true, message: "Code added." });
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  if (!(await isAdmin(request, env))) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const deleteId = url.searchParams.get("delete_id");

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
