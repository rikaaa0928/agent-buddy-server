export type ProviderType = "codex" | "claude" | "antigravity" | "kimi";

export interface Env {
  MANAGEMENT_KEY?: string;
  AUTH_KV?: KVNamespace;
}

export interface CredentialRecord {
  id: string;              // Unique identifier
  auth_index: string;      // CLIProxyAPI index, e.g. "codex-0"
  name: string;            // Filename / Display name, e.g. "codex-user@gmail.com.json"
  provider: ProviderType;
  type: ProviderType;
  status: "active" | "disabled" | "error";
  disabled: boolean;
  email?: string;
  account_id?: string;
  project_id?: string;     // Crucial for Antigravity live quota queries
  plan_type?: string;      // e.g. "plus", "pro", "team"
  access_token: string;
  refresh_token?: string;
  expires_at: number;      // Unix timestamp in ms
  created_at: number;
  updated_at: number;
  last_refreshed_at?: number;
  metadata?: Record<string, any>;
}

export interface OAuthSession {
  state: string;
  provider: ProviderType;
  pkce_verifier?: string;
  created_at: number;
  expires_at: number;
  status: "pending" | "completed" | "error";
  error?: string;
  // Specific fields for Kimi RFC 8628 Device Flow:
  device_code?: string;
  user_code?: string;
  verification_uri?: string;
  verification_uri_complete?: string;
  interval?: number;
}

export interface APICallRequest {
  auth_index?: string;
  authIndex?: string;
  AuthIndex?: string;
  method: string;
  url: string;
  header?: Record<string, string>;
  data?: string;
}

export interface APICallResponse {
  status_code: number;
  header?: Record<string, string>;
  body: string;
}

export interface AuthFilesResponse {
  files: AuthFileEntry[];
}

export interface AuthFileEntry {
  id: string;
  auth_index: string;
  name: string;
  provider: string;
  type: string;
  status: string;
  disabled: boolean;
  project_id?: string | null;
  email?: string | null;
  account_type?: string | null;
  created_at?: string;
  updated_at?: string;
  quota?: {
    observed_at?: string;
    signals?: Record<string, string>;
  };
}
