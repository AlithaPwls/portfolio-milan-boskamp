-- Uitgebreide beschrijving voor projectdetailpagina
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS long_description TEXT DEFAULT '';
