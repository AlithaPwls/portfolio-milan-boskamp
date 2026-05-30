-- Row Level Security — publiek lezen, authenticated schrijven

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE educations ENABLE ROW LEVEL SECURITY;

-- site_settings
CREATE POLICY "site_settings_select_public"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "site_settings_update_authenticated"
  ON site_settings FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated' AND id = 1);

-- Geen INSERT/DELETE voor site_settings (singleton via seed)

-- projects
CREATE POLICY "projects_select_public"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "projects_insert_authenticated"
  ON projects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "projects_update_authenticated"
  ON projects FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "projects_delete_authenticated"
  ON projects FOR DELETE
  USING (auth.role() = 'authenticated');

-- skills
CREATE POLICY "skills_select_public"
  ON skills FOR SELECT
  USING (true);

CREATE POLICY "skills_insert_authenticated"
  ON skills FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "skills_update_authenticated"
  ON skills FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "skills_delete_authenticated"
  ON skills FOR DELETE
  USING (auth.role() = 'authenticated');

-- experiences
CREATE POLICY "experiences_select_public"
  ON experiences FOR SELECT
  USING (true);

CREATE POLICY "experiences_insert_authenticated"
  ON experiences FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "experiences_update_authenticated"
  ON experiences FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "experiences_delete_authenticated"
  ON experiences FOR DELETE
  USING (auth.role() = 'authenticated');

-- educations
CREATE POLICY "educations_select_public"
  ON educations FOR SELECT
  USING (true);

CREATE POLICY "educations_insert_authenticated"
  ON educations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "educations_update_authenticated"
  ON educations FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "educations_delete_authenticated"
  ON educations FOR DELETE
  USING (auth.role() = 'authenticated');
