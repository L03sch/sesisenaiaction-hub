ALTER TABLE public.action_plans
  ADD COLUMN IF NOT EXISTS category TEXT
  CHECK (category IS NULL OR category IN (
    'infraestrutura',
    'pedagogico',
    'qualidade',
    'recursos_humanos',
    'manutencao',
    'ti'
  ));