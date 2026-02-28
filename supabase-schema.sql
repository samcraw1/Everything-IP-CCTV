-- Everything IP CCTV - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  customer_address TEXT DEFAULT '',
  brain_dump TEXT DEFAULT '',
  audio_url TEXT,
  audio_transcription TEXT,
  photo_urls JSONB,
  photo_analysis TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'quoted', 'follow_up', 'booked', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  scope_of_work TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  terms TEXT DEFAULT '',
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table (single row)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT DEFAULT 'Everything IP CCTV',
  business_phone TEXT DEFAULT '',
  business_email TEXT DEFAULT '',
  business_address TEXT DEFAULT '',
  logo_url TEXT,
  pricing JSONB DEFAULT '[]',
  tax_rate NUMERIC(5,2) DEFAULT 8.25,
  default_terms TEXT DEFAULT '',
  validity_days INTEGER DEFAULT 30
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes(lead_id);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for authenticated and anon users
-- (Since this is a single-user app, we keep it simple)
CREATE POLICY "Allow all access to leads" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to quotes" ON quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow public access to media bucket
CREATE POLICY "Allow public read access to media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Allow public upload to media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
