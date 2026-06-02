import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function test() {
  console.log("Logging in...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@trustfeed.org',
    password: 'password123'
  });

  if (authError) {
    console.log("Auth error:", authError);
    return;
  }
  
  console.log("Logged in!", authData.user.id);
  
  // Test bucket upload
  const fileName = `test_org/${Date.now()}.pdf`;
  console.log("Uploading to", fileName);
  
  const pdfBlob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(fileName, pdfBlob, { contentType: 'application/pdf' });
    
  if (uploadError) {
    console.log("Upload error:", uploadError);
  } else {
    console.log("Upload successful!");
    const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName);
    console.log("Public URL:", publicUrl);
    
    // Fetch it
    const res = await fetch(publicUrl);
    console.log("Fetch status:", res.status);
    const text = await res.text();
    console.log("Fetch body:", text);
  }
}

test();
