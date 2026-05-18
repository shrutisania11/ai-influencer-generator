"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, Plus, ChevronDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ensureUserProfile } from "@/utils/ensure-profile";
import { addUserCredits } from "@/app/actions/luma";

export default function DashboardHeader() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [isAddingCredits, setIsAddingCredits] = useState(false);

  const fetchProfile = async () => {
    const result = await ensureUserProfile(supabase);
    if (result.success) {
      setProfile(result.user);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAddCredits = async () => {
    setIsAddingCredits(true);
    const res = await addUserCredits(5000);
    if (res.success) {
      await fetchProfile();
      alert("5,000 Credits added successfully!");
    }
    setIsAddingCredits(false);
  };

  return (
    <header className="h-20 glass border-b border-white/10 px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-8 flex-1">
        <div className="relative max-w-md w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search influencers, models, or posts..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/models"
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Project</span>
        </Link>

        <div className="w-px h-6 bg-white/10 mx-2" />

        <button className="p-2.5 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-[#050505]" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
          <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-yellow-500">₵</span>
          </div>
          <span className="text-sm font-bold text-white/90">
            {profile?.credits?.toLocaleString() || "..."}
          </span>
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider ml-1">Credits</span>
          
          <button 
            onClick={handleAddCredits}
            disabled={isAddingCredits}
            className="ml-1 p-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all disabled:opacity-50"
            title="Top up credits"
          >
            <Plus className={`w-3 h-3 ${isAddingCredits ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full object-cover" />
            ) : (
              profile?.full_name?.substring(0, 2).toUpperCase() || "JD"
            )}
          </div>
          <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors hidden md:inline">
            {profile?.full_name || "Guest"}
          </span>
          <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
        </button>
      </div>
    </header>
  );
}
