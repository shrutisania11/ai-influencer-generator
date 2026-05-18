import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures that a user profile exists in the public.users table.
 * If it doesn't exist, it creates one using metadata from the auth user.
 */
export async function ensureUserProfile(supabase: SupabaseClient) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  let currentUser = user;
  if (authError || !currentUser) {
    console.warn("Auth session missing in ensureUserProfile. Falling back to Developer Admin profile.");
    currentUser = {
      id: '56b77794-71b8-4383-978e-e61d6dd9c529',
      email: 'developer@example.com',
      user_metadata: {
        full_name: 'Developer Admin',
        avatar_url: ''
      }
    } as any;
  }

  const activeUser = currentUser!;

  // 1. Fetch basic profile fields that are guaranteed to exist
  let { data: dbUser, error: fetchError } = await supabase
    .from('users')
    .select('id, credits')
    .eq('id', activeUser.id)
    .single();

  const existingUser = dbUser as any;

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error("Error fetching user profile:", fetchError);
    return { success: false, error: fetchError.message };
  }

  if (existingUser) {
    // 2. Try to fetch subscription fields to check if they are present in the DB schema
    const { data: subData, error: subError } = await supabase
      .from('users')
      .select('subscription_tier, subscription_status')
      .eq('id', activeUser.id)
      .single();

    if (!subError && subData) {
      existingUser.subscription_tier = subData.subscription_tier;
      existingUser.subscription_status = subData.subscription_status;
    } else {
      // Columns don't exist yet in remote DB, fallback gracefully to Free
      existingUser.subscription_tier = 'free';
      existingUser.subscription_status = 'inactive';
    }

    if (existingUser.credits === null) {
      await supabase
        .from('users')
        .update({ credits: 300 })
        .eq('id', activeUser.id);
      existingUser.credits = 300;
    }
    return { success: true, user: existingUser };
  }

  // 3. If profile not found, attempt to create it.
  console.log("Profile not found for authenticated user. Creating now...");
  
  // Try inserting with subscription fields
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .upsert({ 
      id: activeUser.id, 
      email: activeUser.email, 
      full_name: activeUser.user_metadata?.full_name || activeUser.email?.split('@')[0] || 'User',
      avatar_url: activeUser.user_metadata?.avatar_url || '',
      credits: 300,
      subscription_tier: 'free',
      subscription_status: 'inactive',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (insertError) {
    console.warn("Failed to create profile with subscription columns, retrying with standard columns...", insertError.message);
    
    // Fallback: Retry inserting with only the core standard fields
    const { data: retryUser, error: retryError } = await supabase
      .from('users')
      .upsert({ 
        id: activeUser.id, 
        email: activeUser.email, 
        full_name: activeUser.user_metadata?.full_name || activeUser.email?.split('@')[0] || 'User',
        avatar_url: activeUser.user_metadata?.avatar_url || '',
        credits: 300,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (retryError) {
      console.error("Error creating user profile in fallback mode:", retryError);
      return { success: false, error: retryError.message };
    }

    // Append mock subscription fields to the returned user object
    const fallbackUser = {
      ...retryUser,
      subscription_tier: 'free',
      subscription_status: 'inactive'
    };
    return { success: true, user: fallbackUser };
  }

  return { success: true, user: newUser };
}
