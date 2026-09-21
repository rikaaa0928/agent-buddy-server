import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/index";
import { Env } from "../src/types";

const mockEnv: Env = {
  MANAGEMENT_KEY: "test-secret-key",
};

test("Unauthorized access to /v0/management/auth-files is rejected with 401", async () => {
  const req = new Request("http://localhost/v0/management/auth-files", {
    method: "GET",
  });
  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 401);
  const data = (await res.json()) as any;
  assert.equal(data.error, "unauthorized: invalid management key");
});

test("Authorized access with Bearer token succeeds", async () => {
  const req = new Request("http://localhost/v0/management/auth-files", {
    method: "GET",
    headers: {
      Authorization: "Bearer test-secret-key",
      Accept: "application/json",
    },
  });
  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;
  assert.ok(Array.isArray(data.files));
});

test("Authorized access with X-Management-Key header succeeds", async () => {
  const req = new Request("http://localhost/v0/management/auth-files", {
    method: "GET",
    headers: {
      "X-Management-Key": "test-secret-key",
      Accept: "application/json",
    },
  });
  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);
});

test("Import credential via POST /v0/management/auth-files", async () => {
  const req = new Request("http://localhost/v0/management/auth-files", {
    method: "POST",
    headers: {
      "X-Management-Key": "test-secret-key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "antigravity",
      name: "antigravity-test.json",
      email: "test@gmail.com",
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      project_id: "test-gcp-project-123",
    }),
  });
  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;
  assert.equal(data.status, "ok");
  assert.equal(data.name, "antigravity-test.json");
  assert.ok(data.auth_index);
});

test("GET /v0/management/auth-files lists the imported credential with project_id", async () => {
  const req = new Request("http://localhost/v0/management/auth-files", {
    method: "GET",
    headers: {
      Authorization: "Bearer test-secret-key",
    },
  });
  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;
  assert.ok(data.files.length >= 1);
  const found = data.files.find((f: any) => f.name === "antigravity-test.json");
  assert.ok(found);
  assert.equal(found.provider, "antigravity");
  assert.equal(found.project_id, "test-gcp-project-123");
  assert.equal(found.disabled, false);
});

test("POST /v0/management/api-call correctly proxies and replaces $TOKEN$", async () => {
  // Mock global fetch for this test
  const originalFetch = globalThis.fetch;
  let interceptedAuthHeader = "";
  let interceptedMethod = "";
  let interceptedUrl = "";

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    interceptedUrl = input.toString();
    interceptedMethod = init?.method || "GET";
    const headers = init?.headers as Record<string, string>;
    interceptedAuthHeader = headers?.["Authorization"] || "";

    return new Response(JSON.stringify({ simulated: "ok", tokenUsed: interceptedAuthHeader }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const req = new Request("http://localhost/v0/management/api-call", {
      method: "POST",
      headers: {
        "X-Management-Key": "test-secret-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_index: "antigravity-0", // our imported credential
        method: "POST",
        url: "https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary",
        header: {
          Authorization: "Bearer $TOKEN$",
          "Content-Type": "application/json",
        },
        data: JSON.stringify({ project: "test-gcp-project-123" }),
      }),
    });

    const res = await app.fetch(req, mockEnv);
    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.equal(data.status_code, 200);
    assert.ok(typeof data.body === "string");
    assert.ok(data.body.includes("simulated"));

    // Verify $TOKEN$ was replaced by the stored credential's access_token ("mock-access-token")
    assert.equal(interceptedAuthHeader, "Bearer mock-access-token");
    assert.equal(interceptedMethod, "POST");
    assert.equal(interceptedUrl, "https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OAuth URL generation endpoints return URLs with state", async () => {
  // Codex
  const codexReq = new Request("http://localhost/v0/management/codex-auth-url", {
    headers: { "X-Management-Key": "test-secret-key" },
  });
  const codexRes = await app.fetch(codexReq, mockEnv);
  assert.equal(codexRes.status, 200);
  const codexData = (await codexRes.json()) as any;
  assert.ok(codexData.url.includes("auth.openai.com"));
  assert.ok(codexData.state);

  // Claude
  const claudeReq = new Request("http://localhost/v0/management/anthropic-auth-url", {
    headers: { "X-Management-Key": "test-secret-key" },
  });
  const claudeRes = await app.fetch(claudeReq, mockEnv);
  assert.equal(claudeRes.status, 200);
  const claudeData = (await claudeRes.json()) as any;
  assert.ok(claudeData.url.includes("claude.ai"));
  assert.ok(claudeData.state);

  // Antigravity
  const agReq = new Request("http://localhost/v0/management/antigravity-auth-url", {
    headers: { "X-Management-Key": "test-secret-key" },
  });
  const agRes = await app.fetch(agReq, mockEnv);
  assert.equal(agRes.status, 200);
  const agData = (await agRes.json()) as any;
  assert.ok(agData.url.includes("accounts.google.com"));
  assert.ok(agData.state);
});

test("PATCH /v0/management/auth-files/status disables and re-enables credential", async () => {
  const req = new Request("http://localhost/v0/management/auth-files/status", {
    method: "PATCH",
    headers: {
      "X-Management-Key": "test-secret-key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "antigravity-test.json",
      disabled: true,
    }),
  });
  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);

  // Verify list reflects disabled
  const listReq = new Request("http://localhost/v0/management/auth-files", {
    headers: { "X-Management-Key": "test-secret-key" },
  });
  const listRes = await app.fetch(listReq, mockEnv);
  const listData = (await listRes.json()) as any;
  const item = listData.files.find((f: any) => f.name === "antigravity-test.json");
  assert.equal(item.disabled, true);
  assert.equal(item.status, "disabled");
});

test("DELETE /v0/management/auth-files removes credential", async () => {
  const req = new Request("http://localhost/v0/management/auth-files?name=antigravity-test.json", {
    method: "DELETE",
    headers: {
      "X-Management-Key": "test-secret-key",
    },
  });
  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);

  // Verify list no longer contains it
  const listReq = new Request("http://localhost/v0/management/auth-files", {
    headers: { "X-Management-Key": "test-secret-key" },
  });
  const listRes = await app.fetch(listReq, mockEnv);
  const listData = (await listRes.json()) as any;
  const item = listData.files.find((f: any) => f.name === "antigravity-test.json");
  assert.equal(item, undefined);
});

test("Web UI renders authScreen and keeps dashboard hidden by default", async () => {
  for (const path of ["/", "/management.html"]) {
    const req = new Request(`http://localhost${path}`, { method: "GET" });
    const res = await app.fetch(req, mockEnv);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('id="authScreen"'));
    assert.ok(text.includes('id="dashboardScreen"'));
    assert.ok(text.includes('id="dashboardScreen" class="hidden'));
    assert.ok(text.includes("Agent Buddy"));
  }
});

test("Key verification endpoint /v0/management/verify works", async () => {
  // Valid key
  const validReq = new Request("http://localhost/v0/management/verify", {
    headers: { Authorization: "Bearer test-secret-key" },
  });
  const validRes = await app.fetch(validReq, mockEnv);
  assert.equal(validRes.status, 200);

  // Invalid key
  const invalidReq = new Request("http://localhost/v0/management/verify", {
    headers: { Authorization: "Bearer wrong-key" },
  });
  const invalidRes = await app.fetch(invalidReq, mockEnv);
  assert.equal(invalidRes.status, 401);
});

test("Auto-generates MANAGEMENT_KEY on first visit and enforces login on subsequent visits", async () => {
  const emptyEnv: Env = {};

  // First visit
  const initReq1 = new Request("http://localhost/v0/system/init-info", { method: "GET" });
  const initRes1 = await app.fetch(initReq1, emptyEnv);
  assert.equal(initRes1.status, 200);
  const data1 = (await initRes1.json()) as any;
  assert.equal(data1.first_visit, true);
  assert.equal(data1.auto_generated, true);
  assert.ok(data1.key.startsWith("cb_sec_"));

  // Verify the auto-generated key can authenticate
  const verifyReq = new Request("http://localhost/v0/management/verify", {
    headers: { Authorization: `Bearer ${data1.key}` },
  });
  const verifyRes = await app.fetch(verifyReq, emptyEnv);
  assert.equal(verifyRes.status, 200);

  // Subsequent visit: must NOT return the key and MUST require login!
  const initReq2 = new Request("http://localhost/v0/system/init-info", { method: "GET" });
  const initRes2 = await app.fetch(initReq2, emptyEnv);
  assert.equal(initRes2.status, 200);
  const data2 = (await initRes2.json()) as any;
  assert.equal(data2.first_visit, false);
  assert.equal(data2.require_login, true);
  assert.equal(data2.key, undefined);
});
