-- Create the receipts bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;

-- Ensure storage policies exist
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
  
CREATE POLICY "Authenticated users can view receipts" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');
  
CREATE POLICY "Anyone can view receipts" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');
