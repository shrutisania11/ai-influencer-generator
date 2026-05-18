"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  CreditCard, Sparkles, Check, ArrowRight, Loader2, CheckCircle2, 
  AlertCircle, ShieldCheck, Zap, HelpCircle, Layers, Users, Calendar, 
  HelpCircle as InfoIcon, X, CheckSquare
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ensureUserProfile } from "@/utils/ensure-profile";
import { createCheckoutSession, verifyCheckoutSession, applyMockUpgrade } from "@/app/actions/stripe";
import { cn } from "@/utils/cn";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  // App State
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [currentSelectedTab, setCurrentSelectedTab] = useState<"billing" | "profile">("billing");

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mock Terminal Simulator States
  const [showMockCheckoutModal, setShowMockCheckoutModal] = useState(false);
  const [mockCheckoutTier, setMockCheckoutTier] = useState<"standard" | "pro" | null>(null);
  const [mockCardName, setMockCardName] = useState("");
  const [mockCardNumber, setMockCardNumber] = useState("4242 4242 4242 4242");
  const [mockCardExpiry, setMockCardExpiry] = useState("12/28");
  const [mockCardCvc, setMockCardCvc] = useState("123");
  const [isProcessingMock, setIsProcessingMock] = useState(false);

  // Load user profile
  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const result = await ensureUserProfile(supabase);
      if (result.success) {
        setProfile(result.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Stripe Success Callback Verification
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const success = searchParams.get("success");

    if (sessionId && success === "true") {
      const verifySession = async () => {
        setIsVerifying(true);
        setSuccessMsg(null);
        setErrorMsg(null);
        try {
          const res = await verifyCheckoutSession(sessionId);
          if (res.success) {
            setSuccessMsg(`Payment successful! Your account has been upgraded to ${res.planTier?.toUpperCase()} and ${res.creditsToAdd} credits have been added.`);
            fetchProfile();
            // Clear URL params
            router.replace("/dashboard/settings");
          } else {
            setErrorMsg("Payment verification failed: " + (res.error || "Session not found."));
          }
        } catch (e: any) {
          setErrorMsg("Verification error: " + e.message);
        } finally {
          setIsVerifying(false);
        }
      };
      verifySession();
    }

    // Handles fallback mock redirect parameters
    const mockCheckout = searchParams.get("mock_checkout");
    const mockTier = searchParams.get("tier") as "standard" | "pro";
    if (mockCheckout === "true" && mockTier) {
      setMockCheckoutTier(mockTier);
      setShowMockCheckoutModal(true);
      router.replace("/dashboard/settings");
    }
  }, [searchParams]);

  // Handle Checkout Click
  const handleUpgrade = async (tier: "standard" | "pro") => {
    setCheckoutLoading(tier);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await createCheckoutSession(tier);
      if (res.success && res.url) {
        if (res.isMock) {
          // If in mock sandbox mode, open the interactive simulator modal directly!
          setMockCheckoutTier(tier);
          setShowMockCheckoutModal(true);
        } else {
          // Redirect to real Stripe Checkout Page
          window.location.href = res.url;
        }
      } else {
        setErrorMsg("Failed to start checkout: " + (res.error || "Unknown error"));
      }
    } catch (e: any) {
      setErrorMsg("Checkout error: " + e.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Submit Interactive Mock Payment Terminal
  const handleSimulateMockPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockCheckoutTier) return;

    setIsProcessingMock(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // Dynamic processing delay for realistic aesthetic loading experience
    setTimeout(async () => {
      try {
        const res = await applyMockUpgrade(mockCheckoutTier);
        if (res.success) {
          setSuccessMsg(res.message || `Simulated Payment Successful! Upgraded to ${mockCheckoutTier.toUpperCase()} and added ${res.creditsToAdd} credits.`);
          setShowMockCheckoutModal(false);
          fetchProfile();
        } else {
          setErrorMsg("Mock upgrade failed: " + res.error);
        }
      } catch (err: any) {
        setErrorMsg("Mock upgrade error: " + err.message);
      } finally {
        setIsProcessingMock(false);
      }
    }, 2000);
  };

  // UI Definition for pricing plans
  const pricingPlans = [
    {
      id: "free",
      name: "Free Plan",
      price: "$0",
      period: "forever",
      description: "Get a taste of AI influencer creation and post scheduling",
      credits: "300 Credits",
      color: "border-white/5 bg-white/[0.01]",
      btnText: "Current Plan",
      badge: "Standard Entry",
      features: [
        "300 Credits initially",
        "50 Credits per AI Influencer created",
        "20 Credits per Post generated",
        "1 Social Media Profile connect limit",
        "Max 5 active scheduled posts at once"
      ],
      icon: Layers,
      accent: "text-white/40",
      glow: "bg-white/5"
    },
    {
      id: "standard",
      name: "Standard Plan",
      price: "$9.99",
      period: "month",
      description: "Perfect for scaling creators and managing multiple models",
      credits: "2,000 Credits / mo",
      color: "border-primary/30 bg-primary/[0.02] shadow-[0_10px_40px_-15px_rgba(139,92,246,0.15)]",
      btnText: "Upgrade Standard",
      badge: "Most Popular",
      features: [
        "2,000 Credits added immediately",
        "50 Credits per AI Influencer created",
        "20 Credits per Post generated",
        "5 Social Media Profile connects max",
        "Unlimited automated post scheduling"
      ],
      icon: Zap,
      accent: "text-primary",
      glow: "bg-primary/10"
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: "$29.99",
      period: "month",
      description: "Elite tier for media agencies and industrial volume workflows",
      credits: "10,000 Credits / mo",
      color: "border-secondary/30 bg-secondary/[0.02] shadow-[0_10px_40px_-15px_rgba(236,72,153,0.15)]",
      btnText: "Go Pro Creator",
      badge: "Best Value",
      features: [
        "10,000 Credits added immediately",
        "50 Credits per AI Influencer created",
        "20 Credits per Post generated",
        "Unlimited Social Media account connects",
        "Unlimited post scheduling & agency features"
      ],
      icon: Sparkles,
      accent: "text-secondary",
      glow: "bg-secondary/10"
    }
  ];

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const currentTier = profile?.subscription_tier || "free";
  const userCredits = profile?.credits ?? 0;

  // Max credits helper for bar representation
  const maxCreditsMap: any = {
    free: 300,
    standard: 2000,
    pro: 10000
  };
  const maxCredits = maxCreditsMap[currentTier] || 300;
  const creditsPercentage = Math.min(100, Math.max(0, (userCredits / maxCredits) * 100));

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      
      {/* Verification overlay */}
      {isVerifying && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <span className="text-sm font-bold text-white uppercase tracking-widest animate-pulse">Securing Payment Verification...</span>
        </div>
      )}

      {/* Notifications */}
      {successMsg && (
        <div className="p-4.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold flex items-center gap-2.5 shadow-lg animate-slide-in relative">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="p-1 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-2.5 shadow-lg animate-slide-in relative">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full tracking-wider border border-primary/20">Stripe billing gateway</span>
            <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full tracking-wider border border-emerald-400/20">Active</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">Subscription & Settings</h1>
          <p className="text-white/50 text-sm leading-relaxed">Manage your plan, subscribe to higher tiers, inspect credit models, and scale your AI influencer brand.</p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 self-start md:self-auto">
          <button
            onClick={() => setCurrentSelectedTab("billing")}
            className={cn(
              "px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider",
              currentSelectedTab === "billing" ? "bg-white text-black shadow-sm" : "text-white/50 hover:text-white"
            )}
          >
            Billing & Plans
          </button>
          <button
            onClick={() => setCurrentSelectedTab("profile")}
            className={cn(
              "px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider",
              currentSelectedTab === "profile" ? "bg-white text-black shadow-sm" : "text-white/50 hover:text-white"
            )}
          >
            Profile details
          </button>
        </div>
      </div>

      {currentSelectedTab === "billing" ? (
        <div className="space-y-10">
          
          {/* Current subscription summary */}
          <div className="glass p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              
              {/* Profile card */}
              <div className="space-y-3.5 border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-8">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Active account profile</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold shadow-md">
                    {profile?.full_name?.substring(0, 2).toUpperCase() || "US"}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base truncate">{profile?.full_name || "User Account"}</h3>
                    <p className="text-xs text-white/40 truncate">{profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Secure Stripe Connection Enabled</span>
                </div>
              </div>

              {/* Subscription plan details */}
              <div className="space-y-3 border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-8">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Subscription tier status</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xl font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r",
                    currentTier === "pro" 
                      ? "from-secondary to-pink-500" 
                      : currentTier === "standard" 
                        ? "from-primary to-purple-400" 
                        : "from-white to-white/60"
                  )}>
                    {currentTier.toUpperCase()} PLAN
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[8px] font-black bg-white/10 text-white uppercase tracking-widest">
                    Active
                  </span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  {currentTier === "free" && "Enjoy entry level capabilities. Subscribe to standard or pro to lift restricts on connected channels and schedulers."}
                  {currentTier === "standard" && "Unlocked 5 social channels and unlimited post schedulers. Your credit refill occurs monthly."}
                  {currentTier === "pro" && "Infinite potential active. Unrestricted social account syncing, full auto-publishing queues, and premium server speeds active."}
                </p>
              </div>

              {/* Credits meter */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Available credit balance</p>
                    <h2 className="text-3xl font-black text-white">{userCredits} Credits</h2>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-white/40">
                    <CreditCard className="w-6 h-6" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="w-full h-2 rounded-full bg-white/5 border border-white/5 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 bg-gradient-to-r",
                        currentTier === "pro" 
                          ? "from-secondary to-pink-500" 
                          : currentTier === "standard" 
                            ? "from-primary to-purple-400" 
                            : "from-blue-500 to-indigo-500"
                      )} 
                      style={{ width: `${creditsPercentage}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-white/30 uppercase tracking-widest">
                    <span>Used {userCredits}</span>
                    <span>Plan limit {maxCredits}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Pricing Models comparative grid */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">Subscribe & Unlock Creators Hub</h2>
              <p className="text-sm text-white/50">Gain automated credits and unrestricted limits, enabling you to launch automated posting pipelines on all socials.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
              {pricingPlans.map((plan) => {
                const isCurrent = currentTier === plan.id;
                const isHigher = (currentTier === "free" && plan.id !== "free") || (currentTier === "standard" && plan.id === "pro");
                const isLower = (currentTier === "pro" && plan.id !== "pro") || (currentTier === "standard" && plan.id === "free");
                
                return (
                  <div 
                    key={plan.id}
                    className={cn(
                      "glass rounded-[2.5rem] border p-8 flex flex-col justify-between transition-all duration-500 relative group overflow-hidden",
                      plan.color
                    )}
                  >
                    {/* Glowing highlight bubble */}
                    <div className={cn("absolute right-0 top-0 w-48 h-48 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none transition-all group-hover:scale-125 duration-700", plan.glow)} />

                    {/* Card Body */}
                    <div className="space-y-6 relative z-10">
                      
                      {/* Top Row / Badges */}
                      <div className="flex items-center justify-between">
                        <span className="px-3.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-white/5 text-white/70 border border-white/5">
                          {plan.badge}
                        </span>
                        {isCurrent && (
                          <span className="px-3.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                            Active Plan
                          </span>
                        )}
                      </div>

                      {/* Title & Price */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <plan.icon className={cn("w-5 h-5", plan.accent)} />
                          <span>{plan.name}</span>
                        </h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-white">{plan.price}</span>
                          <span className="text-xs font-semibold text-white/40">/ {plan.period}</span>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed min-h-[32px]">{plan.description}</p>
                      </div>

                      <div className="h-px bg-white/5" />

                      {/* Features list */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Plan Features & Limits</p>
                        <div className="space-y-3">
                          {plan.features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs text-white/70">
                              <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/5 mt-0.5">
                                <Check className="w-3 h-3 text-emerald-400" />
                              </div>
                              <span className="leading-normal">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Checkout CTA Button */}
                    <div className="pt-8 mt-auto relative z-10">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-4.5 rounded-[1.5rem] bg-white/5 text-white/40 border border-white/5 font-black text-xs uppercase tracking-widest cursor-default flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Currently Active</span>
                        </button>
                      ) : isLower ? (
                        <button
                          disabled
                          className="w-full py-4.5 rounded-[1.5rem] bg-white/5 text-white/30 border border-white/5 font-black text-xs uppercase tracking-widest cursor-not-allowed flex items-center justify-center"
                        >
                          <span>Plan Rested</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpgrade(plan.id as "standard" | "pro")}
                          disabled={checkoutLoading !== null}
                          className={cn(
                            "w-full py-4.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl hover:scale-[1.02] active:scale-98",
                            plan.id === "pro" 
                              ? "bg-secondary text-white shadow-secondary/15 hover:bg-secondary/95" 
                              : "bg-white text-black hover:bg-white/90"
                          )}
                        >
                          {checkoutLoading === plan.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                          <span>{plan.btnText}</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* Profile settings mock page */
        <div className="glass p-8 rounded-[2rem] border border-white/5 max-w-2xl">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Profile Details</h3>
            <p className="text-xs text-white/40">Adjust your account profile descriptions, display name, and avatar details.</p>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Profile details simulated saved."); }}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-wider">Display full name</label>
                <input 
                  type="text" 
                  defaultValue={profile?.full_name || ""} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white font-medium focus:outline-none focus:border-primary/50" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-wider">Registered Email</label>
                <input 
                  type="email" 
                  disabled
                  defaultValue={profile?.email || ""} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white/40 font-medium cursor-not-allowed" 
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-white/90 transition-colors shadow-lg active:scale-95"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated Interactive Credit Card Payment Terminal Modal */}
      {showMockCheckoutModal && mockCheckoutTier && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl relative space-y-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none" />
            
            <button 
              onClick={() => setShowMockCheckoutModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Simulated Payment Header */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary shadow-inner">
                <CreditCard className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Stripe Checkout Sandbox</h3>
                <p className="text-[11px] text-white/40">You are entering standard checkout sandbox gateway for simulated testing</p>
              </div>
            </div>

            {/* Plan Price Summary */}
            <div className="p-4.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-white/30 tracking-wider">Subscribing to</p>
                <h4 className="text-sm font-bold text-white uppercase">{mockCheckoutTier} subscription plan</h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-wider">Amount Due</p>
                <h4 className="text-base font-black text-primary">{mockCheckoutTier === "pro" ? "$29.99" : "$9.99"}</h4>
              </div>
            </div>

            {/* Simulated Card Forms */}
            <form onSubmit={handleSimulateMockPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/40 tracking-wider">Cardholder Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. John Doe"
                  value={mockCardName}
                  onChange={(e) => setMockCardName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white font-semibold focus:outline-none focus:border-primary/50" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/40 tracking-wider">Card details</label>
                <div className="flex bg-white/5 border border-white/10 rounded-xl items-center p-3.5 focus-within:border-primary/50 gap-2">
                  <CreditCard className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <input 
                    type="text" 
                    required
                    maxLength={19}
                    value={mockCardNumber}
                    onChange={(e) => setMockCardNumber(e.target.value)}
                    className="bg-transparent border-none w-full text-xs text-white font-semibold focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-white/40 tracking-wider">Expiration Date</label>
                  <input 
                    type="text" 
                    required
                    maxLength={5}
                    value={mockCardExpiry}
                    onChange={(e) => setMockCardExpiry(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white font-semibold focus:outline-none focus:border-primary/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-white/40 tracking-wider">CVC Code</label>
                  <input 
                    type="text" 
                    required
                    maxLength={3}
                    value={mockCardCvc}
                    onChange={(e) => setMockCardCvc(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white font-semibold focus:outline-none focus:border-primary/50" 
                  />
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1 text-[10px] text-white/40 leading-relaxed">
                <CheckSquare className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>Simulating payment success adds <strong>{mockCheckoutTier === "pro" ? "10,000" : "2,000"}</strong> credits and upgrades database profile tier status.</span>
              </div>

              {/* Submit terminal */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isProcessingMock}
                  className="w-full py-4 rounded-[1.25rem] bg-gradient-to-r from-primary to-secondary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/10 hover:opacity-95 flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {isProcessingMock ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment Terminal...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4.5 h-4.5 text-white" />
                      <span>Simulate Payment checkout</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
