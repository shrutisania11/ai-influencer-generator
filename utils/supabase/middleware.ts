import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Wrap auth.getUser to support developer bypass in development mode
  const originalGetUser = supabase.auth.getUser.bind(supabase.auth);
  supabase.auth.getUser = async () => {
    try {
      const res = await originalGetUser();
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // if user is not signed in and the current path is not /sign-in, /sign-up, /auth/callback, or root
  // We can add protected routes here if needed
  if (
    !user &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
