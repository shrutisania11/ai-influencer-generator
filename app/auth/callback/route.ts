import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // User is successfully authenticated.
      // Now, save user information into Supabase DB directly if they are a new user.
      // This fulfills the requirement to not use webhooks.
      
      const { id, email, user_metadata } = data.user;
      
      // Attempt to insert the user into a public.users table.
      // The ON CONFLICT clause prevents errors if the user already exists.
      // Note: You need a 'users' table in your public schema with at least 'id' (UUID, Primary Key) and 'email' (Text).
      const { error: dbError } = await supabase
        .from('users')
        .upsert({ 
          id: id, 
          email: email, 
          full_name: user_metadata?.full_name || '',
          avatar_url: user_metadata?.avatar_url || '',
          credits: 5000,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (dbError) {
        console.error('Error inserting user to database:', dbError)
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
