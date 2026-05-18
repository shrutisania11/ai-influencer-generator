import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hyqbzuzrkpxusegfjunt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cWJ6dXpya3B4dXNlZ2ZqdW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDY2OTMsImV4cCI6MjA5MzkyMjY5M30.TUw7f8TW6qjqJdQJxqZYXgRCFfcjoYDi0o1OY_eRstk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = `testuser_${Math.floor(Math.random() * 1000000)}@gmail.com`;
  const password = "password123";
  console.log(`Attempting to sign up ${email}...`);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: "Test User",
      }
    }
  });

  if (error) {
    console.error("Signup error:", error);
  } else {
    console.log("Signup success! User data:", data.user);
    console.log("Session:", data.session);
  }
}

run();
