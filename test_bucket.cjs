const { createClient } = require('@supabase/supabase-js');




const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Testing bucket...");
  const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl('test.pdf');
  console.log("Generated URL:", publicUrl);
  
  const res = await fetch(publicUrl);
  console.log("Fetch status:", res.status);
  const text = await res.text();
  console.log("Fetch body:", text);
}

test();
