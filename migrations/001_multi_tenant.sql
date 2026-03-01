-- Multi-Tenant SaaS Migration
-- Run these statements in order via Supabase SQL Editor or Management API

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

-- 3. Create cameras table
CREATE TABLE IF NOT EXISTS cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  web_url TEXT,
  brand TEXT,
  location_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cameras_lead_id ON cameras(lead_id);
CREATE INDEX IF NOT EXISTS idx_cameras_org_id ON cameras(org_id);

-- 4. Add org_id columns to existing tables
ALTER TABLE leads ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE schematics ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- 5. Create org for existing user and backfill
-- Run this INSERT, then use the returned ID for the UPDATEs below
INSERT INTO organizations (name, slug) VALUES ('Everything IP CCTV', 'everything-ip')
ON CONFLICT (slug) DO NOTHING
RETURNING id;

-- 6. Backfill existing data (replace <ORG_ID> with actual UUID from step 5)
-- UPDATE leads SET org_id = '<ORG_ID>' WHERE org_id IS NULL;
-- UPDATE quotes SET org_id = '<ORG_ID>' WHERE org_id IS NULL;
-- UPDATE schematics SET org_id = '<ORG_ID>' WHERE org_id IS NULL;
-- UPDATE settings SET org_id = '<ORG_ID>' WHERE org_id IS NULL;

-- 7. After backfill, make org_id NOT NULL
-- ALTER TABLE leads ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE quotes ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE schematics ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE settings ALTER COLUMN org_id SET NOT NULL;

-- 8. Add indexes
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(org_id);
CREATE INDEX IF NOT EXISTS idx_quotes_org_id ON quotes(org_id);
CREATE INDEX IF NOT EXISTS idx_schematics_org_id ON schematics(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_org_id ON settings(org_id);

-- 9. Add FK from cameras to organizations
ALTER TABLE cameras ADD CONSTRAINT cameras_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id);

-- 10. Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

-- Permissive policies (service role bypasses RLS)
CREATE POLICY "Allow all for organizations" ON organizations FOR ALL USING (true);
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for cameras" ON cameras FOR ALL USING (true);
