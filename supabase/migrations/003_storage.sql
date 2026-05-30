-- Storage bucket voor portfolio-afbeeldingen

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-images',
  'portfolio-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Iedereen mag afbeeldingen bekijken (public bucket)
CREATE POLICY "portfolio_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

-- Alleen ingelogde admin mag uploaden / wijzigen / verwijderen
CREATE POLICY "portfolio_images_insert_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "portfolio_images_update_authenticated"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'portfolio-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "portfolio_images_delete_authenticated"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portfolio-images'
    AND auth.role() = 'authenticated'
  );
