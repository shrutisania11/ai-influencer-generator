import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hyqbzuzrkpxusegfjunt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cWJ6dXpya3B4dXNlZ2ZqdW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDY2OTMsImV4cCI6MjA5MzkyMjY5M30.TUw7f8TW6qjqJdQJxqZYXgRCFfcjoYDi0o1OY_eRstk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const mockUserId = '56b77794-71b8-4383-978e-e61d6dd9c529'; // The ID we got from signup
  
  const { data, error } = await supabase
    .from('users')
    .upsert({ 
      id: mockUserId, 
      email: 'testuser_98437@gmail.com', 
      full_name: 'Test User',
      avatar_url: '',
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Insert error:", error);
  } else {
    console.log("Insert success!", data);
  }
}

run();
