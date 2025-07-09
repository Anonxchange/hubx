-- Create storage buckets for video files, thumbnails, and previews
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('videos', 'videos', true),
  ('thumbnails', 'thumbnails', true),
  ('previews', 'previews', true);

-- Create storage policies for videos bucket
CREATE POLICY "Public video access" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Authenticated video upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Authenticated video update" ON storage.objects
FOR UPDATE USING (bucket_id = 'videos');

CREATE POLICY "Authenticated video delete" ON storage.objects
FOR DELETE USING (bucket_id = 'videos');

-- Create storage policies for thumbnails bucket
CREATE POLICY "Public thumbnail access" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated thumbnail upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated thumbnail update" ON storage.objects
FOR UPDATE USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated thumbnail delete" ON storage.objects
FOR DELETE USING (bucket_id = 'thumbnails');

-- Create storage policies for previews bucket
CREATE POLICY "Public preview access" ON storage.objects
FOR SELECT USING (bucket_id = 'previews');

CREATE POLICY "Authenticated preview upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'previews');

CREATE POLICY "Authenticated preview update" ON storage.objects
FOR UPDATE USING (bucket_id = 'previews');

CREATE POLICY "Authenticated preview delete" ON storage.objects
FOR DELETE USING (bucket_id = 'previews');