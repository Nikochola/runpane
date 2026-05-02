CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  label TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'development',
  key_hash TEXT NOT NULL,
  prefix TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'developer',
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  provider TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'mock',
  environment TEXT NOT NULL DEFAULT 'sandbox',
  scopes_json JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_accounts (
  id TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL REFERENCES integrations(id),
  external_account_id TEXT,
  token_metadata_json JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prism_surfaces (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  schema_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  intent_hash TEXT NOT NULL,
  intent_json JSONB NOT NULL,
  risk_reason TEXT NOT NULL,
  resource TEXT,
  amount_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  approver_id TEXT REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  intent_hash TEXT NOT NULL,
  intent_json JSONB NOT NULL,
  decision TEXT NOT NULL,
  policy_rule TEXT,
  facet_hash TEXT,
  approval_request_id TEXT REFERENCES approval_requests(id),
  external_call_json JSONB,
  result_json JSONB,
  prev_receipt_hash TEXT NOT NULL,
  receipt_hash TEXT NOT NULL,
  ratchet_n_before INTEGER NOT NULL,
  ratchet_n_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_customers (
  organization_id TEXT PRIMARY KEY REFERENCES organizations(id),
  provider TEXT NOT NULL DEFAULT 'stripe',
  external_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'founder',
  status TEXT NOT NULL DEFAULT 'trialing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS codex_tasks (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  integration_id TEXT REFERENCES integrations(id),
  agent_id TEXT REFERENCES agents(id),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'prepared',
  risk_level TEXT NOT NULL DEFAULT 'medium',
  approval_request_id TEXT REFERENCES approval_requests(id),
  external_task_id TEXT,
  result_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_integrations_org ON integrations(organization_id, provider);
CREATE INDEX IF NOT EXISTS idx_audit_events_org ON audit_events(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_codex_tasks_org ON codex_tasks(organization_id, status);
