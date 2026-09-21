const CLIENT_ID = "17e5f671-d194-4dfb-9706-5516cb48c098";
const DEVICE_CODE_URL = "https://auth.kimi.com/api/oauth/device_authorization";
const TOKEN_URL = "https://auth.kimi.com/api/oauth/token";

export async function startKimiDeviceFlow() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
  });

  const res = await fetch(DEVICE_CODE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Kimi device authorization request failed (status ${res.status}): ${errText}`);
  }

  const data = (await res.json()) as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete?: string;
    expires_in: number;
    interval?: number;
  };

  return {
    device_code: data.device_code,
    user_code: data.user_code,
    verification_uri: data.verification_uri,
    verification_uri_complete:
      data.verification_uri_complete ||
      `${data.verification_uri}?user_code=${encodeURIComponent(data.user_code)}`,
    expires_in: data.expires_in || 900,
    interval: data.interval || 5,
  };
}

export async function pollKimiToken(deviceCode: string): Promise<
  | { status: "pending" }
  | {
      status: "success";
      access_token: string;
      refresh_token: string;
      expires_in: number;
      email?: string;
      plan_type?: string;
    }
  | { status: "error"; message: string }
> {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    device_code: deviceCode.trim(),
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = (await res.json()) as any;

  if (res.status === 400 && data.error === "authorization_pending") {
    return { status: "pending" };
  }

  if (!res.ok) {
    return {
      status: "error",
      message: data.error_description || data.error || `HTTP ${res.status}`,
    };
  }

  return {
    status: "success",
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in || 2592000,
    email: "Kimi User",
    plan_type: "Kimi Coding",
  };
}

export async function refreshKimiToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken.trim(),
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Kimi token refresh failed (status ${res.status}): ${errText}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_in: data.expires_in || 2592000,
  };
}
