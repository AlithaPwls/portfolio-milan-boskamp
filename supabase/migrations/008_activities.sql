-- Activiteiten (opleidingen, studiedagen, workshops, presentaties, …)

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select_public"
  ON activities FOR SELECT
  USING (true);

CREATE POLICY "activities_insert_authenticated"
  ON activities FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "activities_update_authenticated"
  ON activities FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "activities_delete_authenticated"
  ON activities FOR DELETE
  USING (auth.role() = 'authenticated');
