import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import SocialAuth from '@/components/SocialAuth';

export default async function SignUpPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams;
  const signUp = async (formData: FormData) => {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          full_name: fullName,
        }
      },
    });

    if (error) {
      return redirect('/sign-up?message=' + error.message);
    }

    // If session is returned immediately (email confirmation disabled)
    if (data.session && data.user) {
      // Insert user directly into DB as requested
      const { id, email: userEmail, user_metadata } = data.user;
      
      const { error: dbError } = await supabase
        .from('users')
        .upsert({ 
          id: id, 
          email: userEmail, 
          full_name: user_metadata?.full_name || '',
          avatar_url: user_metadata?.avatar_url || '',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (dbError) {
        console.error('Error inserting user to database:', dbError);
      }

      return redirect('/dashboard');
    }

    // If email confirmation is required
    return redirect('/sign-up?message=Check email to continue sign in process');
  };

  return (
    <div className="glass p-8 rounded-3xl border border-white/10 w-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="text-center mb-8">
        <Link href="/" className="inline-block text-2xl font-bold tracking-tighter mb-4">
          <span className="text-white">AI</span>
          <span className="text-gradient">Fluencer</span>
        </Link>
        <h1 className="text-2xl font-semibold text-white">Create an Account</h1>
        <p className="text-white/60 text-sm mt-2">Join to start generating AI influencers</p>
      </div>

      <form action={signUp} className="space-y-4">
        {searchParams?.message && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/80 text-sm text-center">
            {searchParams.message}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5" htmlFor="fullName">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            placeholder="John Doe"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            minLength={6}
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all transform hover:-translate-y-0.5"
        >
          Sign Up
        </button>
      </form>
      
      <SocialAuth />

      <div className="mt-6 text-center text-sm text-white/60">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-primary hover:text-primary-light font-medium transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
}
