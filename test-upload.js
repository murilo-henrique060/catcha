const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  // Login to get a session
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com', // wait I don't know an email
    password: 'password'
  });
  
  if (error) {
    console.log("Auth error:", error.message);
    // we can't test if we can't login, wait, let me just look at the DB
  }
}
test();
