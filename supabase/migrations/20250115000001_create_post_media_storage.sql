
-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public) VALUES ('post_media', 'post_media', true);

-- Create policies for post_media bucket
CREATE POLICY "Authenticated users can upload post media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post_media' AND auth.role() = 'authenticated');

CREATE POLICY "Post media is publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'post_media');

CREATE POLICY "Users can update their own post media" ON storage.objects
FOR UPDATE USING (bucket_id = 'post_media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post media" ON storage.objects
FOR DELETE USING (bucket_id = 'post_media' AND auth.uid()::text = (storage.foldername(name))[1]);
