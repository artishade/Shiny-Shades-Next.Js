-- =====================================================
-- Website Connection API for AI Agents
-- Allows external AI agents (Claude, Codex, etc.) to analyze
-- and interact with the Shiny Shades website.
-- =====================================================

-- AI agent API keys — lets external agents call the connection endpoints
CREATE TABLE IF NOT EXISTS agent_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{"read":true,"write":false,"analytics":true}',
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Audit log for agent actions (create, update, delete operations)
CREATE TABLE IF NOT EXISTS agent_actions_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_key_id UUID REFERENCES agent_api_keys(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_api_keys_hash ON agent_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_active ON agent_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_actions_key ON agent_actions_log(agent_key_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_created ON agent_actions_log(created_at DESC);
