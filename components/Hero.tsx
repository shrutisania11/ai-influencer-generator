import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Hero() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-medium text-white/80">AI Model Generation 2.0 is live</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up delay-100">
            Your AI Influencer, <br />
            <span className="text-gradient">Automated.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto lg:mx-0 animate-fade-in-up delay-200">
            Create ultra-realistic AI personas, generate captivating content, and schedule posts automatically across all social platforms. Never run out of content again.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-in-up delay-300">
            <Link 
              href={user ? "/dashboard" : "/sign-up"}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-primary to-primary-dark text-white font-semibold text-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all transform hover:scale-105 inline-block text-center"
            >
              {user ? "Go to Dashboard" : "Start Creating Free"}
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full glass text-white font-semibold text-lg hover:bg-white/10 transition-all">
              Watch Demo
            </button>
          </div>
        </div>

        <div className="relative mt-12 lg:mt-0 lg:ml-10 animate-fade-in-up delay-400 z-10 hidden md:block">
          <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden glass border-white/20 p-2 animate-float">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-secondary/30 mix-blend-overlay z-10" />
            <div className="w-full h-full bg-surface rounded-2xl relative overflow-hidden flex items-center justify-center border border-white/5">
              <Image 
                src="/hero-influencer.png" 
                alt="AI Influencer" 
                fill 
                className="object-cover"
                priority
              />
            </div>
          </div>
          
          {/* Floating UI Elements */}
          <div className="absolute -left-12 top-24 glass p-4 rounded-2xl border border-white/10 flex items-center gap-3 animate-float delay-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold">✓</div>
            <div>
              <p className="text-xs text-white/50">Engagement</p>
              <p className="text-sm font-bold">+245%</p>
            </div>
          </div>
          
          <div className="absolute -right-8 bottom-32 glass p-4 rounded-2xl border border-white/10 flex items-center gap-3 animate-float delay-300">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xl">📸</div>
            <div>
              <p className="text-xs text-white/50">Auto-Scheduled</p>
              <p className="text-sm font-bold">12 posts/week</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
