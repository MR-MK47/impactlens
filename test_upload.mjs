import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Logging in...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@trustfeed.org', // I need a valid email from the DB
    password: 'password123'
  });

  if (authError) {
    console.log("Auth error:", authError);
    // Can't upload without auth due to RLS
    return;
  }
}

test();
