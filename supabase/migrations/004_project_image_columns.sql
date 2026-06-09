-- Extra afbeeldingen per project
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS thumbnail_image_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS image2_url TEXT DEFAULT '';
