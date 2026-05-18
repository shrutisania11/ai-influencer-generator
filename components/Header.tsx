import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const signOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary animate-pulse-glow" />
          <span className="text-xl font-bold text-foreground">InfluenceAI</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Features</Link>
          <Link href="/#pricing" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Pricing</Link>
          <Link href="/#about" className="text-sm font-medium text-white/70 hover:text-white transition-colors">About</Link>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-white/50 hidden sm:block">{user.email}</span>
              <Link href="/dashboard" className="bg-white text-background px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors">
                Dashboard
              </Link>
              <form action={signOut}>
                <button type="submit" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:block">Sign In</Link>
              <Link href="/sign-up" className="bg-white text-background px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors inline-block text-center">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
