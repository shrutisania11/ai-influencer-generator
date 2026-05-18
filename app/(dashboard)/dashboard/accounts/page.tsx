"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Trash2, Loader2, CheckCircle2, AlertCircle, ExternalLink, 
  Lock, Settings, ShieldAlert, RefreshCw, Unlink, Info, Sparkles, LogOut, ArrowRight,
  Users, Radio, Activity, Link2
} from "lucide-react";
import { cn } from "@/utils/cn";
import { isPlatformSupported } from "@/utils/social-config";
import { 
  getConnectUrl, 
  getSocialAccounts, 
  syncConnectedAccounts, 
  saveConnectedAccount, 
  disconnectSocialAccount 
} from "@/app/actions/social";
import { add5000Credits } from "@/app/actions/influencers";


// Custom authentic platform configurations
const platformsList = [
  // Instagram
  {
    id: "instagram",
    name: "Instagram",
    color: "from-pink-500 via-red-500 to-yellow-500",
    bg: "bg-pink-500/10",
    textColor: "text-pink-400",
    borderActive: "border-pink-500/30",
    shadowColor: "rgba(236,72,153,0.15)",
    description: "Publish feeds, Reels, and Stories to build your visual audience.",
    mockProfiles: [
      { name: "@jane_ai_lifestyle", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" },
      { name: "@jane.daily.vibe", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" }
    ],
    svg: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    )
  },
  // TikTok
  {
    id: "tiktok",
    name: "TikTok",
    color: "from-cyan-400 via-neutral-900 to-pink-500",
    bg: "bg-cyan-500/10",
    textColor: "text-cyan-400",
    borderActive: "border-cyan-500/30",
    shadowColor: "rgba(34,211,238,0.15)",
    description: "Post short-form viral visual campaigns and engage with Gen-Z.",
    mockProfiles: [
      { name: "@jane_influences", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150" },
      { name: "@jane_toks", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150" }
    ],
    svg: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.07-2.88-.49-4.13-1.24-.31-.19-.6-.4-.88-.63-.03 2.73.01 5.46-.02 8.19-.1 2.27-1.16 4.54-3.04 5.86-1.92 1.39-4.57 1.73-6.83 1.09-2.61-.7-4.73-2.92-5.26-5.59-.72-3.23 1.1-6.73 4.29-7.79 1.14-.38 2.37-.43 3.56-.25v4.21c-.84-.21-1.77-.14-2.52.34-.84.49-1.32 1.47-1.23 2.45.1 1.25 1.18 2.27 2.44 2.25 1.27-.04 2.3-.98 2.41-2.24.08-3.07.03-6.14.05-9.21v-7.3c-.02-1.07.01-2.14-.02-3.21z" />
      </svg>
    )
  },
  // Facebook
  {
    id: "facebook",
    name: "Facebook Pages",
    color: "from-blue-600 to-blue-400",
    bg: "bg-blue-600/10",
    textColor: "text-blue-400",
    borderActive: "border-blue-600/30",
    shadowColor: "rgba(37,99,235,0.15)",
    description: "Publish updates and visual narratives to your brand Page.",
    mockProfiles: [
      { name: "Jane AI Pro Page", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" }
    ],
    svg: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
      </svg>
    )
  },
  {
    id: "pinterest",
    name: "Pinterest",
    color: "from-red-600 to-red-500",
    bg: "bg-red-600/10",
    textColor: "text-red-400",
    borderActive: "border-red-600/30",
    shadowColor: "rgba(220,38,38,0.15)",
    description: "Pin lifestyle visuals, infographics, and shoppable aesthetic campaigns.",
    mockProfiles: [
      { name: "Jane AI Boards", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150" }
    ],
    svg: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.41 7.61 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.396-5.918 1.396-5.918s-.356-.71-.356-1.758c0-1.648.952-2.878 2.132-2.878 1.005 0 1.49.756 1.49 1.662 0 1.01-.643 2.522-.976 3.923-.277 1.177.59 2.136 1.745 2.136 2.096 0 3.707-2.21 3.707-5.397 0-2.822-2.029-4.796-4.919-4.796-3.35 0-5.316 2.512-5.316 5.109 0 1.012.39 2.099.877 2.69.096.117.111.219.082.337l-.337 1.378c-.055.22-.18.28-.415.17-1.545-.719-2.506-2.982-2.506-4.8 0-3.91 2.842-7.502 8.196-7.502 4.303 0 7.647 3.067 7.647 7.164 0 4.275-2.696 7.717-6.438 7.717-1.258 0-2.441-.653-2.845-1.428l-.776 2.956c-.28 1.072-1.037 2.417-1.545 3.251 1.127.348 2.316.536 3.551.536 6.621 0 11.988-5.367 11.988-11.987C24.004 5.367 18.638 0 12.017 0z"/>
      </svg>
    )
  },
  {
    id: "twitter",
    name: "X / Twitter",
    color: "from-zinc-200 to-zinc-500",
    bg: "bg-white/5",
    textColor: "text-white",
    borderActive: "border-white/20",
    shadowColor: "rgba(255,255,255,0.05)",
    description: "Share punchy visual threads, hot takes, and brand announcements.",
    mockProfiles: [
      { name: "@jane_ai_creator", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" }
    ],
    svg: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    color: "from-blue-700 to-blue-500",
    bg: "bg-blue-500/10",
    textColor: "text-blue-500",
    borderActive: "border-blue-500/30",
    shadowColor: "rgba(59,130,246,0.15)",
    description: "Establish professional authority and share B2B marketing content.",
    mockProfiles: [
      { name: "Jane Doe (AI Creator)", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150" }
    ],
    svg: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
        <rect x="2" y="9" width="4" height="12"></rect>
        <circle cx="4" cy="4" r="2"></circle>
      </svg>
    )
  },
  {
    id: "youtube",
    name: "YouTube Shorts",
    color: "from-red-600 via-red-500 to-red-700",
    bg: "bg-red-500/10",
    textColor: "text-red-500",
    borderActive: "border-red-500/30",
    shadowColor: "rgba(239,68,68,0.15)",
    description: "Post short teaser videos, campaign breakdowns, and YouTube Shorts.",
    mockProfiles: [
      { name: "Jane AI Pro Channel", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150" }
    ],
    svg: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
      </svg>
    )
  }
];

const filteredPlatforms = platformsList.filter(p => isPlatformSupported(p.id));

export default function AccountsPage() {
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zernioKeyExists, setZernioKeyExists] = useState(false);
  const [usingLocalStorageFallback, setUsingLocalStorageFallback] = useState(false);
  
  // Custom active state alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // OAuth Simulation Dialog Modal States
  const [activePlatformModal, setActivePlatformModal] = useState<any | null>(null);
  const [selectedMockAccount, setSelectedMockAccount] = useState<any | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Sync loaded accounts
  const loadAccounts = async (forceSync = false) => {
    setIsLoading(true);
    try {
      // First check if live key exists
      const checkRes = await getSocialAccounts();
      const hasKey = checkRes.zernioKeyExists || false;
      setZernioKeyExists(hasKey);

      // Force Sync live accounts from Zernio
      if (hasKey && (forceSync || connectedAccounts.length === 0)) {
        await syncConnectedAccounts();
      }

      const res = await getSocialAccounts();
      if (res.success) {
        if (res.dbTableMissing) {
          setUsingLocalStorageFallback(true);
          const localAccs = localStorage.getItem("influence_social_accounts");
          if (localAccs) {
            setConnectedAccounts(JSON.parse(localAccs));
          }
        } else {
          // Merge database accounts with any mock accounts in local storage
          const dbAccs = res.accounts || [];
          const localAccs = localStorage.getItem("influence_social_accounts");
          const parsedLocal = localAccs ? JSON.parse(localAccs) : [];
          
          const merged = [...dbAccs];
          parsedLocal.forEach((la: any) => {
            if (!merged.some(ma => ma.account_id === la.account_id)) {
              merged.push(la);
            }
          });
          setConnectedAccounts(merged);
        }
      } else {
        showToast("Failed to retrieve connected accounts.", "error");
      }
    } catch (e) {
      console.error(e);
      // Fail-safe to local storage
      setUsingLocalStorageFallback(true);
      const localAccs = localStorage.getItem("influence_social_accounts");
      if (localAccs) {
        setConnectedAccounts(JSON.parse(localAccs));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Connect Click handler
  const handleConnectClick = async (platform: any) => {
    try {
      showToast("Generating secure connection URL...", "success");
      const res: any = await getConnectUrl(platform.id);
      
      if (res.success && res.authUrl) {
        if (res.isMock) {
          // Sandbox Mode - open popup
          setActivePlatformModal(platform);
          setSelectedMockAccount(platform.mockProfiles[0]);
        } else {
          // Live Zernio Redirection
          showToast(`Redirecting to authorize ${platform.name}...`, "success");
          window.location.href = res.authUrl;
        }
      } else {
        showToast(res.error || "Failed to generate connection URL", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Connection failed to initialize", "error");
    }
  };

  // Authorize Simulator click
  const handleAuthorizeSimulation = async () => {
    if (!activePlatformModal || !selectedMockAccount) return;
    setIsAuthorizing(true);

    try {
      const mockAccountId = `acc_${activePlatformModal.id}_${Math.random().toString(36).substring(2, 8)}`;
      const mockProfileId = `prof_mock_${Math.random().toString(36).substring(2, 8)}`;
      
      if (usingLocalStorageFallback) {
        // Local storage persistence
        const newAcc = {
          id: mockAccountId,
          platform: activePlatformModal.id,
          profile_id: mockProfileId,
          account_id: mockAccountId,
          account_name: selectedMockAccount.name,
          avatar_url: selectedMockAccount.avatar,
          created_at: new Date().toISOString()
        };
        const updated = [...connectedAccounts, newAcc];
        setConnectedAccounts(updated);
        localStorage.setItem("influence_social_accounts", JSON.stringify(updated));
        showToast(`Successfully connected your ${activePlatformModal.name} account!`, "success");
      } else {
        // Database persistence
        const res = await saveConnectedAccount(
          activePlatformModal.id,
          mockAccountId,
          selectedMockAccount.name,
          selectedMockAccount.avatar,
          mockProfileId
        );

        if (res.success && !res.mockMode) {
          // Re-fetch
          await loadAccounts();
          showToast(`Successfully connected your ${activePlatformModal.name} account!`, "success");
        } else {
          // Fail-safe or mockMode to local storage
          const newAcc = {
            id: mockAccountId,
            platform: activePlatformModal.id,
            profile_id: mockProfileId,
            account_id: mockAccountId,
            account_name: selectedMockAccount.name,
            avatar_url: selectedMockAccount.avatar,
            created_at: new Date().toISOString()
          };
          const updated = [...connectedAccounts, newAcc];
          setConnectedAccounts(updated);
          localStorage.setItem("influence_social_accounts", JSON.stringify(updated));
          showToast(
            res.mockMode 
              ? `Mock connected ${activePlatformModal.name} in browser session.`
              : `Mock connected ${activePlatformModal.name} due to missing schema.`, 
            "success"
          );
        }
      }
    } catch (e: any) {
      showToast(`Connection failed: ${e.message}`, "error");
    } finally {
      setIsAuthorizing(false);
      setActivePlatformModal(null);
    }
  };

  // Disconnect click handler
  const handleDisconnect = async (accountId: string, platformId: string) => {
    if (!confirm(`Are you sure you want to disconnect this ${platformId} account? This will halt all active post queues to this channel.`)) return;

    try {
      if (usingLocalStorageFallback) {
        const updated = connectedAccounts.filter(a => a.account_id !== accountId);
        setConnectedAccounts(updated);
        localStorage.setItem("influence_social_accounts", JSON.stringify(updated));
        showToast(`Successfully disconnected your ${platformId} account.`, "success");
      } else {
        const res = await disconnectSocialAccount(accountId, platformId);
        if (res.success) {
          const updated = connectedAccounts.filter(a => a.account_id !== accountId);
          setConnectedAccounts(updated);
          localStorage.setItem("influence_social_accounts", JSON.stringify(updated));
          await loadAccounts();
          showToast(`Successfully disconnected your ${platformId} account.`, "success");
        } else {
          // Fail-safe
          const updated = connectedAccounts.filter(a => a.account_id !== accountId);
          setConnectedAccounts(updated);
          localStorage.setItem("influence_social_accounts", JSON.stringify(updated));
          showToast(`Disconnected locally due to schema constraints.`, "success");
        }
      }
    } catch (e: any) {
      showToast(`Failed to disconnect: ${e.message}`, "error");
    }
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <span className="text-xs font-bold text-white/50 animate-pulse uppercase tracking-widest">Loading Accounts Hub...</span>
        </div>
      </div>
    );
  }

  const totalConnected = connectedAccounts.length;

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* Toast Notice */}
      {toastMessage && (
        <div className={cn(
          "fixed top-6 right-6 z-50 p-4.5 rounded-2xl border text-sm font-bold flex items-center gap-3 shadow-2xl animate-slide-in",
          toastType === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        )}>
          {toastType === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-secondary bg-secondary/15 px-3 py-1 rounded-full tracking-wider border border-secondary/20">Zernio Integration</span>
            {usingLocalStorageFallback && (
              <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full tracking-wider border border-amber-400/20">Session Saved</span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">Social Accounts Hub</h1>
          <p className="text-white/50 text-sm leading-relaxed">Authorize and manage social connections to queue, cross-post, and sync your generated AI influencers.</p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={async () => {
              showToast("Adding 5,000 credits...", "success");
              const res = await add5000Credits();
              if (res.success) {
                showToast("Successfully added 5,000 credits!", "success");
              } else {
                showToast("Failed to add credits: " + res.error, "error");
              }
            }}
            className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-bold text-white hover:opacity-90 hover:scale-[1.02] active:scale-95 duration-200 transition-all flex items-center gap-2.5 shadow-md shadow-primary/10"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <span>Add 5,000 Credits</span>
          </button>

          <button
            onClick={() => loadAccounts(true)}
            className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2.5 shadow-sm active:scale-95 duration-200"
          >
            <RefreshCw className="w-4 h-4 text-white/70" />
            <span>Sync Accounts</span>
          </button>
        </div>
      </div>

      {/* Premium Visual Summary Panel (Stats Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden group hover:border-white/10 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Linked Accounts</span>
              <h4 className="text-2xl font-bold text-white mt-0.5">{totalConnected} {totalConnected === 1 ? 'Profile' : 'Profiles'}</h4>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden group hover:border-white/10 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
              <Radio className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">API Engine</span>
              <div className="flex items-center gap-2 mt-0.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <h4 className="text-base font-bold text-white truncate">
                  {zernioKeyExists ? "Zernio Live API" : "Zernio Simulator"}
                </h4>
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden group hover:border-white/10 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Queue Status</span>
              <h4 className="text-base font-bold text-white mt-0.5">100% Operational</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Sandbox Notice Banner */}
      {!zernioKeyExists && (
        <div className="glass p-6 rounded-3xl border border-secondary/25 bg-secondary/[0.03] space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary flex-shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-2.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>InfluenceAI Sandbox Mode Enabled</span>
              </h3>
              <p className="text-sm text-white/60 leading-relaxed max-w-4xl">
                The workspace is running in a fully functional sandbox. You can click <strong>Add Account</strong> on any platform to experience the authentic interactive OAuth popup simulator. Connecting accounts will instantly save their details to your session and render them as connected with real-time post queueing capabilities! 
              </p>
              <div className="flex items-center gap-2.5 pt-1.5 text-xs text-secondary font-bold">
                <Info className="w-4 h-4" />
                <span>To use real profiles, simply configure ZERNIO_API_KEY in your local .env.local file.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accounts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlatforms.map((platform) => {
          // Find all connected accounts for this platform
          const platformAccs = connectedAccounts.filter(a => a.platform === platform.id);
          const hasAccounts = platformAccs.length > 0;

          return (
            <div 
              key={platform.id} 
              style={{
                boxShadow: hasAccounts ? `0 10px 30px -10px ${platform.shadowColor}` : "none"
              }}
              className={cn(
                "glass rounded-[2rem] border overflow-hidden flex flex-col justify-between transition-all duration-500 ease-out group relative",
                hasAccounts 
                  ? `${platform.borderActive} bg-white/[0.03]` 
                  : "border-white/5 hover:border-white/15 hover:bg-white/[0.02]"
              )}
            >
              {/* Giant background brand logo watermark */}
              <div className="absolute right-4 bottom-24 opacity-[0.02] text-white pointer-events-none group-hover:scale-110 duration-700 transform origin-right">
                {platform.svg}
              </div>

              {/* Card top */}
              <div className="p-6 space-y-5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "p-3.5 rounded-2xl bg-gradient-to-tr text-white shadow-inner flex items-center justify-center transform group-hover:scale-105 duration-300",
                    platform.color
                  )}>
                    {platform.svg}
                  </div>
                  
                  {hasAccounts ? (
                    <span className="px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{platformAccs.length} {platformAccs.length === 1 ? 'Account' : 'Accounts'}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1.5 rounded-xl text-[8px] font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-white/30">
                      No Accounts
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors duration-300">
                    {platform.name}
                  </h3>
                  <p className="text-xs text-white/40 leading-relaxed">
                    {platform.description}
                  </p>
                </div>
              </div>

              {/* Card Bottom / Connection state */}
              <div className="px-6 pb-6 pt-4 border-t border-white/5 bg-black/15 mt-auto space-y-4 relative z-10">
                {hasAccounts ? (
                  <div className="space-y-3.5 animate-fade-in">
                    {/* List connected profiles */}
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                      {platformAccs.map((acc) => (
                        <div key={acc.account_id} className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.06] transition-all duration-200">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={acc.avatar_url} 
                              alt="" 
                              className="w-9 h-9 rounded-full object-cover border border-white/15 shadow-sm flex-shrink-0"
                            />
                            <div className="min-w-0 flex flex-col">
                              <span className="text-xs font-bold text-white truncate">{acc.account_name}</span>
                              <span className="text-[7.5px] text-emerald-400 font-black uppercase tracking-widest mt-0.5">ACTIVE</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDisconnect(acc.account_id, platform.id)}
                            className="p-2 rounded-xl border border-white/5 hover:border-red-500/25 hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all flex items-center justify-center flex-shrink-0 active:scale-90"
                            title="Disconnect Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Another Button */}
                    <button
                      onClick={() => handleConnectClick(platform)}
                      className="w-full py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/25 text-blue-400 font-bold text-[10px] uppercase tracking-wider border border-blue-500/20 hover:border-blue-500/35 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 duration-150"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-400/80" />
                      <span>Add Another Account</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnectClick(platform)}
                    className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest border border-blue-500/10 hover:border-blue-500/20 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] duration-300 shadow-lg shadow-blue-500/10 active:scale-98"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>Add Account</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulated OAuth Authorization Popup Dialog */}
      {activePlatformModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] max-w-xl w-full p-8 shadow-2xl relative space-y-6 overflow-hidden max-h-[90vh]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] -mr-24 -mt-24" />
            
            {/* Header info */}
            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="flex items-center gap-5 relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg">
                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/30" />
                </div>
                
                <div className="flex gap-1 items-center z-10 text-white/20">
                  <div className="w-2 h-2 rounded-full bg-secondary/50 animate-ping" />
                  <ArrowRight className="w-5 h-5 text-white/30" />
                </div>

                <div className={cn(
                  "w-14 h-14 rounded-2xl bg-gradient-to-tr text-white shadow-lg flex items-center justify-center",
                  activePlatformModal.color
                )}>
                  {activePlatformModal.svg}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">OAuth Application Access</h3>
                <p className="text-xs text-white/40">Zernio Social Engine is requesting permissions to link your account</p>
              </div>
            </div>

            {/* Scope Permissions Checklist */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Permissions Requested</h4>
              <div className="space-y-2.5 text-xs text-white/70">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Access your profile details, display name, and avatar picture.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Publish generated visual media campaigns, text threads, and posts.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Read engagement analytics, impressions, and view stats.</span>
                </div>
              </div>
            </div>

            {/* Simulated Account Selector */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Select Channel Account</label>
              <div className="space-y-2">
                {activePlatformModal.mockProfiles.map((prof: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedMockAccount(prof)}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all",
                      selectedMockAccount.name === prof.name
                        ? "bg-white/10 border-secondary text-white"
                        : "bg-white/5 border-white/5 hover:bg-white/[0.08] text-white/60 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <img src={prof.avatar} className="w-8 h-8 rounded-full object-cover border border-white/10" alt="" />
                      <span className="text-xs font-bold">{prof.name}</span>
                    </div>
                    {selectedMockAccount.name === prof.name && (
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleAuthorizeSimulation}
                disabled={isAuthorizing}
                className="flex-1 py-4 rounded-2xl bg-secondary hover:bg-secondary/90 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-secondary/15 flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {isAuthorizing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>AUTHORIZE ACCESS</span>
              </button>
              
              <button
                type="button"
                onClick={() => setActivePlatformModal(null)}
                disabled={isAuthorizing}
                className="py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest border border-white/10 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
