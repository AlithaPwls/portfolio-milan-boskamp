-- Hero achtergrondafbeelding
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS hero_image TEXT DEFAULT '';
