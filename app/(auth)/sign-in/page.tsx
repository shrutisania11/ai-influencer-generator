import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import SocialAuth from '@/components/SocialAuth';

export default async function SignInPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams;
  const signIn = async (formData: FormData) => {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return redirect('/sign-in?message=' + error.message);
    }

    return redirect('/dashboard');
  };

  return (
    <div className="glass p-8 rounded-3xl border border-white/10 w-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="text-center mb-8">
        <Link href="/" className="inline-block text-2xl font-bold tracking-tighter mb-4">
          <span className="text-white">AI</span>
          <span className="text-gradient">Fluencer</span>
        </Link>
        <h1 className="text-2xl font-semibold text-white">Welcome Back</h1>
        <p className="text-white/60 text-sm mt-2">Sign in to continue to your dashboard</p>
      </div>

      <form action={signIn} className="space-y-4">
        {searchParams?.message && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {searchParams.message}
          </div>
        )}
        
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-white/80" htmlFor="password">
              Password
            </label>
            <Link href="#" className="text-xs text-primary hover:text-primary-light transition-colors">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all transform hover:-translate-y-0.5"
        >
          Sign In
        </button>
      </form>

      <SocialAuth />

      <div className="mt-6 text-center text-sm text-white/60">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="text-primary hover:text-primary-light font-medium transition-colors">
          Sign up
        </Link>
      </div>
    </div>
  );
}
