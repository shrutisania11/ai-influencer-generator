const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://hyqbzuzrkpxusegfjunt.supabase.co";
// Use service_role or anon key. Wait, anon key might not let us read if there's RLS, let's see.
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cWJ6dXpya3B4dXNlZ2ZqdW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDY2OTMsImV4cCI6MjA5MzkyMjY5M30.TUw7f8TW6qjqJdQJxqZYXgRCFfcjoYDi0o1OY_eRstk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching posts...");
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .limit(10);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Total posts found:", posts.length);
  for (const post of posts) {
    console.log(`ID: ${post.id}, User ID: ${post.user_id}, Prompt: ${post.prompt.substring(0, 100)}...`);
  }
}

main();
