const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Fetching private bucket url...");
  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl('test.jpg');
  // wait media is public. What about a private bucket?
  // Let's see if we can create a private bucket using API, or just fetch from 'receipts' which might be private still!
  
  const res = await fetch('https://jpditziuvocmuulmdmdd.supabase.co/storage/v1/object/public/receipts/test.pdf');
  console.log("Fetch status:", res.status);
  const text = await res.text();
  console.log("Fetch body:", text);
}

test();
