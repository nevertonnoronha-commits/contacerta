-- =============================================
-- ContaCerta — Pagamentos (Settle Up) Migration
-- =============================================

-- 1. PAGAMENTOS TABLE
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  pagador_id UUID NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  recebedor_id UUID NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (pagador_id != recebedor_id)
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_group ON pagamentos(group_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pagador ON pagamentos(pagador_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_recebedor ON pagamentos(recebedor_id);

-- 2. ROW LEVEL SECURITY — Public anon access
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pagamentos' AND policyname = 'anon_select_pagamentos') THEN
    CREATE POLICY "anon_select_pagamentos" ON pagamentos FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pagamentos' AND policyname = 'anon_insert_pagamentos') THEN
    CREATE POLICY "anon_insert_pagamentos" ON pagamentos FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pagamentos' AND policyname = 'anon_update_pagamentos') THEN
    CREATE POLICY "anon_update_pagamentos" ON pagamentos FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pagamentos' AND policyname = 'anon_delete_pagamentos') THEN
    CREATE POLICY "anon_delete_pagamentos" ON pagamentos FOR DELETE TO anon USING (true);
  END IF;
END $$;

-- =============================================
-- DONE! Verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- =============================================
