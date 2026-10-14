-- Read-only readiness check before initializing the application's migrations.
-- A missing Storage column belongs to Supabase's service migrations; do not
-- add it manually or remove the bucket's upload limits to bypass this check.
WITH required_columns(table_schema, table_name, column_name) AS (
  VALUES
    ('storage', 'buckets', 'public'),
    ('storage', 'buckets', 'file_size_limit'),
    ('storage', 'buckets', 'allowed_mime_types'),
    ('auth', 'users', 'raw_app_meta_data'),
    ('auth', 'sessions', 'id'),
    ('auth', 'sessions', 'created_at')
), missing AS (
  SELECT r.* FROM required_columns r
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = r.table_schema
      AND c.table_name = r.table_name
      AND c.column_name = r.column_name
  )
)
SELECT
  NOT EXISTS (SELECT 1 FROM missing) AS service_schema_ready,
  COALESCE((SELECT jsonb_agg(to_jsonb(missing)) FROM missing), '[]'::jsonb) AS missing_service_columns,
  (SELECT count(*) FROM auth.users) AS existing_auth_users,
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') AS existing_public_tables;
