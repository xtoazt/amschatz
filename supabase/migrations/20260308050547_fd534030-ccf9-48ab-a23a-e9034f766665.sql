UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf', 'application/zip', 'application/x-zip-compressed',
  'text/plain', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
],
file_size_limit = 20971520
WHERE name = 'chat-images';