-- Derde projectafbeelding
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS image3_url TEXT DEFAULT '';
