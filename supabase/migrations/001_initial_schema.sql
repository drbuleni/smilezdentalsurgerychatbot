-- ============================================================
-- Smilez Dental Surgery Chatbot - Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- DOCUMENTS TABLE
-- Stores metadata for each uploaded PDF document
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT NOT NULL,
  original_filename TEXT,
  file_size        INTEGER,
  total_chunks     INTEGER DEFAULT 0,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENT_CHUNKS TABLE
-- Stores text chunks and their vector embeddings
-- Uses OpenAI text-embedding-3-small (1536 dimensions)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_chunks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  metadata    JSONB DEFAULT '{}',
  embedding   VECTOR(1536),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- IVFFlat index for fast approximate nearest-neighbour search
-- 'lists' should be roughly sqrt(number of rows) — start at 100
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- APPOINTMENT_REQUESTS TABLE
-- Stores appointment booking details captured via chatbot
-- ============================================================
CREATE TABLE IF NOT EXISTS appointment_requests (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name            TEXT NOT NULL,
  phone_number         TEXT NOT NULL,
  email                TEXT,
  preferred_date       TEXT,
  preferred_time       TEXT,
  reason_for_visit     TEXT NOT NULL,
  special_requirements TEXT,
  status               TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'no_show')),
  email_sent           BOOLEAN DEFAULT FALSE,
  session_id           TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT_SESSIONS TABLE
-- Optional: tracks conversation history per session
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  messages   JSONB DEFAULT '[]',
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MATCH_DOCUMENT_CHUNKS FUNCTION
-- Performs cosine similarity search against stored embeddings
-- Called by the RAG pipeline to retrieve relevant context
-- ============================================================
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding  VECTOR(1536),
  match_threshold  FLOAT DEFAULT 0.70,
  match_count      INT   DEFAULT 5
)
RETURNS TABLE (
  id            UUID,
  document_id   UUID,
  content       TEXT,
  metadata      JSONB,
  similarity    FLOAT,
  document_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.name AS document_name
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- Enable RLS on all tables.
-- The service role key (used server-side) bypasses RLS.
-- The anon key (used client-side) has no direct table access
-- — all reads/writes go through the API routes.
-- ============================================================
ALTER TABLE documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions        ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by API routes)
-- The service role bypasses RLS by default in Supabase, so
-- no explicit policy is needed for it. The policies below
-- ensure the anon role cannot access tables directly.

-- NOTE: If you want to allow the anon key to call the
-- match_document_chunks function (for client-side use),
-- grant execute here:
-- GRANT EXECUTE ON FUNCTION match_document_chunks TO anon;
