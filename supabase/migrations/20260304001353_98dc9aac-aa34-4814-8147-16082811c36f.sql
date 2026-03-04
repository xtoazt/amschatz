
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    file_size_limit = 5242880
WHERE id = 'chat-images';
