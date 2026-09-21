const AUTH_URL = "https://claude.ai/oauth/authorize";
const TOKEN_URL = "https://platform.claude.com/v1/oauth/token";
const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const REDIRECT_URI = "http://localhost:54545/callback";
const SCOPE = "user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload";

export function generateClaudeAuthUrl(state: string, challenge: string): string {
  const params = new URLSearchParams({
    code: "true",
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: state,
  });

  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeClaudeCode(codeRaw: string, verifier: string, state: string) {
  let code = codeRaw.trim();
  let explicitState = state;

  // Claude callback code may contain #state
  if (code.includes("#")) {
    const parts = code.split("#");
    code = parts[0];
    if (parts[1]) {
      explicitState = parts[1];
    }
  }

  const reqBody = {
    grant_type: "authorization_code",
    code: code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier.trim(),
    state: explicitState,
  };

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      "User-Agent": "axios/1.15.2",
    },
    body: JSON.stringify(reqBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude token exchange failed (status ${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  return parseClaudeTokenResponse(data);
}

export async function parseClaudeTokenResponse(data: {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  organization?: {
    uuid?: string;
    name?: string;
  };
  account?: {
    uuid?: string;
    email_address?: string;
  };
}) {
  let email = data.account?.email_address;
  const orgName = data.organization?.name;

  // Try fetching profile if email is empty
  if (!email && data.access_token) {
    try {
      const profileRes = await fetch("https://api.anthropic.com/api/oauth/profile", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          "User-Agent": "axios/1.15.2",
          Accept: "application/json",
        },
      });
      if (profileRes.ok) {
        const profile = (await profileRes.json()) as any;
        email = profile.account?.email;
      }
    } catch {
      // ignore advisory profile fetch error
    }
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in || 3600,
    email: email || (orgName ? `Claude (${orgName})` : "Claude Account"),
    account_id: data.account?.uuid,
    plan_type: "Pro",
  };
}

export async function refreshClaudeToken(refreshToken: string) {
  const reqBody = {
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken.trim(),
    scope: SCOPE,
  };

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      "User-Agent": "axios/1.15.2",
    },
    body: JSON.stringify(reqBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude token refresh failed (status ${res.status}): ${errText}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_in: data.expires_in || 3600,
  };
}
