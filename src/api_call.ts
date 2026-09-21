import { refreshAntigravityToken } from "./auth/antigravity";
import { refreshClaudeToken } from "./auth/claude";
import { refreshCodexToken } from "./auth/codex";
import { refreshKimiToken } from "./auth/kimi";
import { getCredentialByAuthIndex, saveCredential } from "./storage";
import { APICallRequest, APICallResponse, CredentialRecord, Env } from "./types";

export async function refreshCredential(env: Env, cred: CredentialRecord): Promise<CredentialRecord> {
  if (!cred.refresh_token) {
    return cred;
  }

  try {
    let refreshed: { access_token: string; refresh_token?: string; expires_in: number };

    if (cred.provider === "codex") {
      refreshed = await refreshCodexToken(cred.refresh_token);
    } else if (cred.provider === "claude") {
      refreshed = await refreshClaudeToken(cred.refresh_token);
    } else if (cred.provider === "antigravity") {
      refreshed = await refreshAntigravityToken(cred.refresh_token);
    } else if (cred.provider === "kimi") {
      refreshed = await refreshKimiToken(cred.refresh_token);
    } else {
      return cred;
    }

    cred.access_token = refreshed.access_token;
    if (refreshed.refresh_token) {
      cred.refresh_token = refreshed.refresh_token;
    }
    cred.expires_at = Date.now() + (refreshed.expires_in || 3600) * 1000;
    cred.last_refreshed_at = Date.now();
    cred.updated_at = Date.now();
    cred.status = "active";

    await saveCredential(env, cred);
  } catch (err) {
    console.error(`Failed to refresh token for credential ${cred.id}:`, err);
    cred.status = "error";
    await saveCredential(env, cred);
    throw err;
  }

  return cred;
}

export async function handleAPICall(env: Env, body: APICallRequest): Promise<APICallResponse> {
  const authIndex = body.auth_index || body.authIndex || body.AuthIndex || "";
  const method = (body.method || "GET").toUpperCase();
  const targetUrl = (body.url || "").trim();

  if (!targetUrl) {
    return {
      status_code: 400,
      body: JSON.stringify({ error: "missing url parameter" }),
    };
  }

  let cred: CredentialRecord | null = null;
  if (authIndex) {
    cred = await getCredentialByAuthIndex(env, authIndex);
  }

  let justRefreshed = false;

  // Optional Forward Proxy for chatgpt.com to bypass Cloudflare WAF bot challenges
  if (env.OPENAI_FORWARD_URL && targetUrl.includes("chatgpt.com")) {
    const forwardBase = env.OPENAI_FORWARD_URL.replace(/\/+$/, "");
    try {
      const forwardRes = await fetch(`${forwardBase}/v0/management/api-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_FORWARD_KEY || env.MANAGEMENT_KEY || ""}`,
        },
        body: JSON.stringify(body),
      });
      if (forwardRes.ok) {
        return (await forwardRes.json()) as APICallResponse;
      }
    } catch (e) {
      console.warn("OPENAI_FORWARD_URL request failed, falling back to direct fetch:", e);
    }
  }

  // Auto-refresh token if close to expiry (within 5 minutes)
  if (cred && cred.refresh_token) {
    const isExpiringSoon = Date.now() >= cred.expires_at - 5 * 60 * 1000;
    if (isExpiringSoon) {
      try {
        cred = await refreshCredential(env, cred);
        justRefreshed = true;
      } catch (e) {
        console.warn(`Preemptive token refresh failed for ${cred.name}:`, e);
      }
    }
  }

  // Build headers
  const reqHeaders: Record<string, string> = {};
  if (body.header) {
    for (const [k, v] of Object.entries(body.header)) {
      if (typeof v === "string") {
        let val = v;
        if (val.includes("$TOKEN$")) {
          const token = cred ? cred.access_token : "";
          val = val.replace(/\$TOKEN\$/g, token);
        }
        reqHeaders[k] = val;
      }
    }
  }

  // Ensure Accept header
  if (!reqHeaders["Accept"] && !reqHeaders["accept"]) {
    reqHeaders["Accept"] = "application/json";
  }

  const fetchOptions: RequestInit = {
    method,
    headers: reqHeaders,
  };

  if (body.data && method !== "GET" && method !== "HEAD") {
    fetchOptions.body = body.data;
  }

  let res: Response;
  try {
    res = await fetch(targetUrl, fetchOptions);
  } catch (err: any) {
    return {
      status_code: 502,
      body: JSON.stringify({ error: `upstream fetch failed: ${err.message}` }),
    };
  }

  // If 401 Unauthorized and not just refreshed, attempt token refresh once and retry
  if (res.status === 401 && cred && cred.refresh_token && !justRefreshed) {
    try {
      cred = await refreshCredential(env, cred);
      // Re-substitute new token in headers
      if (body.header) {
        for (const [k, v] of Object.entries(body.header)) {
          if (typeof v === "string" && v.includes("$TOKEN$")) {
            reqHeaders[k] = v.replace(/\$TOKEN\$/g, cred.access_token);
          }
        }
      }
      fetchOptions.headers = reqHeaders;
      res = await fetch(targetUrl, fetchOptions);
    } catch (e) {
      console.warn(`Retry after 401 token refresh failed for ${cred.name}:`, e);
    }
  }

  const resBody = await res.text();
  const resHeaders = Object.fromEntries(res.headers.entries());

  return {
    status_code: res.status,
    header: resHeaders,
    body: resBody,
  };
}
