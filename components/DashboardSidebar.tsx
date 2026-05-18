"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Palette, 
  Calendar, 
  UserCircle, 
  Settings, 
  Zap,
  Plus,
  LogOut,
  ChevronRight
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase/client";
import { ensureUserProfile } from "@/utils/ensure-profile";
import { useRouter } from "next/navigation";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Palette, label: "Models & Studio", href: "/dashboard/models" },
  { icon: Zap, label: "Post Generator", href: "/dashboard/generator", badge: "New" },
  { icon: Calendar, label: "Schedule", href: "/dashboard/calendar" },
  { icon: UserCircle, label: "Accounts", href: "/dashboard/accounts" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function getProfile() {
      const result = await ensureUserProfile(supabase);
      if (result.success) {
        setProfile(result.user);
      }
    }
    getProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  return (
    <aside className="w-72 h-screen flex flex-col glass border-r border-white/10 sticky top-0">
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-foreground">InfluenceAI</span>
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Pro Creator</span>
        </div>
      </div>

      {/* Create Section */}
      <div className="px-4 py-4 space-y-4">
        <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Create</p>
        <div className="grid grid-cols-2 gap-2">
          <Link 
            href="/dashboard/models/new"
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all group"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Model</span>
          </Link>
          <Link 
            href="/dashboard/generator"
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20 transition-all group"
          >
            <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Post</span>
          </Link>
        </div>
      </div>

      <div className="h-px bg-white/5 mx-4" />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ease-out",
                isActive 
                  ? "bg-white/10 text-white shadow-sm border border-white/10" 
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-primary" : "text-inherit"
                )} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/20 text-primary border border-primary/20 rounded-full">
                  {item.badge}
                </span>
              )}
              
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User / Bottom Section */}
      <div className="p-4 mt-auto border-t border-white/10">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface-hover to-surface border border-white/10 flex items-center justify-center text-sm font-bold overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.substring(0, 2).toUpperCase() || "JD"
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{profile?.full_name || "Guest User"}</span>
              <span className="text-xs text-white/40 truncate capitalize">
                {profile?.subscription_tier ? `${profile.subscription_tier} Plan` : "Free Plan"}
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </div>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </aside>
  );
}
