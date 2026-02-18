-- =============================================
-- ContaCerta — Supabase Migration v2
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- 1. GROUPS TABLE
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Grupo Padrão',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PARTICIPANTES TABLE
CREATE TABLE IF NOT EXISTS participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_participantes_group ON participantes(group_id);

-- 3. DESPESAS TABLE
CREATE TABLE IF NOT EXISTS despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  pagador_id UUID NOT NULL REFERENCES participantes(id),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria TEXT NOT NULL DEFAULT 'outros',
  tipo_divisao TEXT NOT NULL DEFAULT 'igual' CHECK (tipo_divisao IN ('igual', 'porcentagem', 'personalizado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_despesas_group ON despesas(group_id);
CREATE INDEX IF NOT EXISTS idx_despesas_pagador ON despesas(pagador_id);

-- 4. EXPENSE_SPLITS TABLE (normalized division detail)
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  despesa_id UUID NOT NULL REFERENCES despesas(id) ON DELETE CASCADE,
  participante_id UUID NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  valor_devido NUMERIC(12,2) NOT NULL DEFAULT 0,
  porcentagem NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(despesa_id, participante_id)
);

CREATE INDEX IF NOT EXISTS idx_splits_despesa ON expense_splits(despesa_id);
CREATE INDEX IF NOT EXISTS idx_splits_participante ON expense_splits(participante_id);

-- =============================================
-- 5. ROW LEVEL SECURITY — Public anon access
-- =============================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Groups: full public access
CREATE POLICY "anon_select_groups" ON groups FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_groups" ON groups FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_groups" ON groups FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_groups" ON groups FOR DELETE TO anon USING (true);

-- Participantes: full public access
CREATE POLICY "anon_select_participantes" ON participantes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_participantes" ON participantes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_participantes" ON participantes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_participantes" ON participantes FOR DELETE TO anon USING (true);

-- Despesas: full public access
CREATE POLICY "anon_select_despesas" ON despesas FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_despesas" ON despesas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_despesas" ON despesas FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_despesas" ON despesas FOR DELETE TO anon USING (true);

-- Expense Splits: full public access
CREATE POLICY "anon_select_splits" ON expense_splits FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_splits" ON expense_splits FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_splits" ON expense_splits FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_splits" ON expense_splits FOR DELETE TO anon USING (true);

-- =============================================
-- 6. SEED — Default group
-- =============================================

INSERT INTO groups (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'default')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- DONE! Verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- =============================================
