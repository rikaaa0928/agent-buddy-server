import { parseJwt } from "./pkce";

const AUTH_URL = "https://auth.openai.com/oauth/authorize";
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const REDIRECT_URI = "http://localhost:1455/auth/callback";

export function generateCodexAuthUrl(state: string, challenge: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: "openid email profile offline_access",
    state: state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "login",
    id_token_add_organizations: "true",
    codex_cli_simplified_flow: "true",
  });

  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodexCode(code: string, verifier: string) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code: code.trim(),
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier.trim(),
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "codex-tui/0.149.1 (Mac OS 26.5.2; arm64)",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI Codex token exchange failed (status ${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  return parseCodexTokenResponse(data);
}

export function parseCodexTokenResponse(data: {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
}) {
  let email: string | undefined;
  let accountId: string | undefined;
  let planType: string | undefined;

  if (data.id_token) {
    const claims = parseJwt(data.id_token);
    if (claims) {
      email = claims.email;
      const profile = claims["https://api.openai.com/profile"];
      if (profile && typeof profile === "object") {
        accountId = profile.account_id;
        if (!email && profile.email) email = profile.email;
      }
      const auth = claims["https://api.openai.com/auth"];
      if (auth && typeof auth === "object") {
        planType = auth.chatgpt_plan_type;
      }
    }
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in || 86400,
    id_token: data.id_token,
    email: email || "codex-user",
    account_id: accountId,
    plan_type: planType || "Codex",
  };
}

export async function refreshCodexToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken.trim(),
    scope: "openid profile email",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "codex-tui/0.149.1 (Mac OS 26.5.2; arm64)",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI Codex token refresh failed (status ${res.status}): ${errText}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in: number;
  };

  let email: string | undefined;
  let planType: string | undefined;

  if (data.id_token) {
    const claims = parseJwt(data.id_token);
    if (claims) {
      email = claims.email;
      const auth = claims["https://api.openai.com/auth"];
      if (auth && typeof auth === "object") {
        planType = auth.chatgpt_plan_type;
      }
    }
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_in: data.expires_in || 86400,
    email,
    plan_type: planType,
  };
}
