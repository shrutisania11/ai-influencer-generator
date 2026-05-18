"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, Users, Calendar, TrendingUp, Plus, Zap, ArrowRight, Loader2, 
  Image as ImageIcon, Clock, CheckCircle2, AlertCircle, X, ChevronLeft, 
  ChevronRight, Layers, Trash2
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ensureUserProfile } from "@/utils/ensure-profile";
import { updatePostPrompt, deletePost } from "@/app/actions/influencers";
import { cn } from "@/utils/cn";

export default function DashboardPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [recentModels, setRecentModels] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [dialogPublishOption, setDialogPublishOption] = useState<"now" | "later">("now");
  const [dialogScheduleDate, setDialogScheduleDate] = useState("");
  const [dialogScheduleTime, setDialogScheduleTime] = useState("");
  const [dialogIsEditingSchedule, setDialogIsEditingSchedule] = useState(false);
  
  // Notification State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination State for Dashboard
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4; // Perfect height for a compact sidebar widget

  const fetchData = async () => {
    // 1. Ensure profile exists and get name
    const profileResult = await ensureUserProfile(supabase);
    if (profileResult.success) {
      setProfile(profileResult.user);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 2. Fetch Models Count
      const { count: modelsCount } = await supabase
        .from('models')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 3. Fetch Posts Count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 4. Fetch Recent Models
      const { data: modelsData } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (modelsData) setRecentModels(modelsData);

      // 5. Fetch Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, models(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (postsData) setPosts(postsData);

      // 6. Set Stats
      setStats([
        { label: "Active Influencers", value: modelsCount?.toString() || "0", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Scheduled Posts", value: "0", icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/10" },
        { label: "Total Engagement", value: "0", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "AI Generations", value: postsCount?.toString() || "0", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10" },
      ]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Dialog and populate states
  const handleOpenPostDialog = (post: any) => {
    setSelectedPost(post);
    setDialogPublishOption(post.parsedPrompt?.publishOption || "now");
    setSuccessMessage(null);
    setErrorMessage(null);
    
    if (post.parsedPrompt?.scheduledAt) {
      const scheduledDateObj = new Date(post.parsedPrompt.scheduledAt);
      const yyyy = scheduledDateObj.getFullYear();
      const mm = String(scheduledDateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(scheduledDateObj.getDate()).padStart(2, '0');
      setDialogScheduleDate(`${yyyy}-${mm}-${dd}`);
      
      const hh = String(scheduledDateObj.getHours()).padStart(2, '0');
      const min = String(scheduledDateObj.getMinutes()).padStart(2, '0');
      setDialogScheduleTime(`${hh}:${min}`);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setDialogScheduleDate(`${yyyy}-${mm}-${dd}`);
      setDialogScheduleTime("09:00");
    }
    setDialogIsEditingSchedule(false);
  };

  // Update Post Status
  const handleUpdatePostStatus = async (statusType: "draft" | "scheduled") => {
    if (!selectedPost) return;
    
    setIsUpdatingPost(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      let scheduledDateTime: string | null = null;
      let pubOption = dialogPublishOption;
      
      if (statusType === "scheduled") {
        if (dialogPublishOption === "later") {
          if (!dialogScheduleDate || !dialogScheduleTime) {
            setErrorMessage("Please enter a valid schedule date and time.");
            setIsUpdatingPost(false);
            return;
          }
          scheduledDateTime = `${dialogScheduleDate}T${dialogScheduleTime}`;
        } else {
          scheduledDateTime = new Date().toISOString();
          pubOption = "now";
        }
      }
      
      const updatedPrompt = JSON.stringify({
        ...selectedPost.parsedPrompt,
        status: statusType,
        publishOption: pubOption,
        scheduledAt: scheduledDateTime
      });
      
      const res = await updatePostPrompt(selectedPost.id, updatedPrompt);
      if (res.success && res.post) {
        const parsed = JSON.parse(res.post.prompt);
        const updatedPostObj = {
          ...res.post,
          models: selectedPost.models,
          parsedPrompt: parsed
        };
        
        // Update main list
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? updatedPostObj : p));
        
        // Update dialog state
        setSelectedPost(updatedPostObj);
        setDialogIsEditingSchedule(false);
        setSuccessMessage(statusType === "draft" 
          ? "Post moved back to Drafts successfully!" 
          : `Post scheduled successfully for ${pubOption === "later" ? `${dialogScheduleDate} at ${dialogScheduleTime}` : "immediate publication"}!`
        );
        
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage("Failed to update post: " + (res.error || "Unknown error"));
      }
    } catch (e: any) {
      setErrorMessage("Error updating post: " + e.message);
    } finally {
      setIsUpdatingPost(false);
    }
  };

  // Delete Post
  const handleDeletePostInDialog = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    setIsUpdatingPost(true);
    try {
      const res = await deletePost(postId);
      if (res.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setSelectedPost(null);
      } else {
        setErrorMessage("Failed to delete post: " + res.error);
      }
    } catch (e: any) {
      setErrorMessage("Error deleting post: " + e.message);
    } finally {
      setIsUpdatingPost(false);
    }
  };

  // Parse prompts for all posts to extract structured parameters
  const parsedPosts = posts.map((post: any) => {
    let parsedPrompt = {
      campaignName: "Untitled Campaign",
      status: "published",
      style: "",
      scheduledAt: "",
      platform: "instagram",
      caption: ""
    };
    try {
      if (post.prompt && post.prompt.startsWith("{")) {
        parsedPrompt = { ...parsedPrompt, ...JSON.parse(post.prompt) };
      } else {
        parsedPrompt.campaignName = post.prompt || "Untitled Campaign";
      }
    } catch (e) {
      console.error("Error parsing prompt JSON:", e);
    }
    return {
      ...post,
      parsedPrompt
    };
  });

  // Filter only Drafts and Scheduled posts
  const draftAndScheduledPosts = parsedPosts.filter((post: any) => 
    post.parsedPrompt.status === "draft" || post.parsedPrompt.status === "scheduled"
  );

  // Pagination calculations for the sidebar
  const totalPages = Math.ceil(draftAndScheduledPosts.length / postsPerPage);
  const paginatedPosts = draftAndScheduledPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  // Auto-adjust page if current page becomes out of bounds
  useEffect(() => {
    if (currentPage > 1 && currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [draftAndScheduledPosts.length, totalPages, currentPage]);

  // Dynamically update scheduled posts stat count
  useEffect(() => {
    if (stats.length > 0) {
      const scheduledCount = draftAndScheduledPosts.filter(p => p.parsedPrompt.status === "scheduled").length;
      setStats(prev => prev.map(s => 
        s.label === "Scheduled Posts" ? { ...s, value: scheduledCount.toString() } : s
      ));
    }
  }, [posts]);

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.full_name?.split(' ')[0] || "Jane"}
        </h1>
        <p className="text-white/50">Here&apos;s what&apos;s happening with your AI influencers today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+0%</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              <p className="text-sm text-white/50">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/dashboard/models/new"
          className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20 text-primary group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Create New Model</h3>
              <p className="text-sm text-white/50">Build a new AI influencer identity</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>

        <Link 
          href="/dashboard/generator"
          className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 hover:border-secondary/40 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary/20 text-secondary group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Create New Post</h3>
              <p className="text-sm text-white/50">Generate content for your models</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Models Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">Recent Models</h2>
            </div>
            <Link href="/dashboard/models" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          
          {recentModels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentModels.map((model) => (
                <div key={model.id} className="glass rounded-2xl border border-white/10 overflow-hidden group hover:border-primary/30 transition-all duration-300">
                  <div className="aspect-square relative overflow-hidden">
                    <img src={model.portrait_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Link href={`/dashboard/generator?modelId=${model.id}`} className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg hover:scale-105 transition-transform">Generate Post</Link>
                    </div>
                  </div>
                  <div className="p-3 text-center">
                    <p className="font-bold text-sm truncate">{model.name}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{model.vibe}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-3xl border border-white/10 overflow-hidden">
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white/20" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">No models created yet</p>
                  <p className="text-sm text-white/40">Start by creating your first AI influencer identity.</p>
                </div>
                <Link 
                  href="/dashboard/models/new"
                  className="bg-white text-background px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/90 transition-all"
                >
                  Create Model
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity & Queue Sidebar (Replacing static Quick Tips) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-secondary" />
              <h2 className="text-xl font-bold tracking-tight">Recent Activity & Queue</h2>
            </div>
            <Link href="/dashboard/models" className="text-xs font-bold text-secondary hover:underline">View Queue</Link>
          </div>

          {draftAndScheduledPosts.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {paginatedPosts.map((post) => {
                  const campaignName = post.parsedPrompt?.campaignName || "Untitled Campaign";
                  const postStatus = post.parsedPrompt?.status || "draft";
                  const platform = post.parsedPrompt?.platform || "instagram";

                  return (
                    <div 
                      key={post.id}
                      onClick={() => handleOpenPostDialog(post)}
                      className="group cursor-pointer flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-secondary/40 hover:bg-white/[0.08] transition-all duration-300"
                    >
                      {/* Post Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 relative">
                        <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/10" />
                      </div>
                      
                      {/* Post Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-secondary transition-colors">
                            {campaignName}
                          </h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border",
                            postStatus === "draft"
                              ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                              : "bg-purple-500/20 border-purple-500/30 text-purple-400"
                          )}>
                            {postStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-white/30 font-medium">
                          <span>{post.models?.name || "Model"}</span>
                          <span className="uppercase">{platform}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Compact Sidebar Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-20 transition-all text-white/60"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-bold text-white/50">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-20 transition-all text-white/60"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass p-6 rounded-2xl border border-white/10 text-center space-y-3">
              <ImageIcon className="w-6 h-6 text-white/20 mx-auto" />
              <p className="text-xs text-white/50 leading-relaxed">No draft or scheduled campaigns active in your queue.</p>
              <Link href="/dashboard/generator" className="inline-block text-[10px] font-bold text-secondary uppercase hover:underline">Launch Post Factory</Link>
            </div>
          )}
        </div>
      </div>

      {/* Post Action & Scheduling Dialog Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] max-w-4xl w-full p-8 md:p-10 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedPost(null)}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Notification Banners */}
            {successMessage && (
              <div className="p-4.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold flex items-center gap-2.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="p-4.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Column: Post Image Preview */}
              <div className="md:col-span-5 space-y-4">
                <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 relative shadow-2xl">
                  <img 
                    src={selectedPost.image_url} 
                    alt={selectedPost.parsedPrompt?.campaignName || "Campaign Post"} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay Status Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-md",
                      selectedPost.parsedPrompt?.status === "draft"
                        ? "bg-amber-500/25 border-amber-500/40 text-amber-400"
                        : "bg-purple-500/25 border-purple-500/40 text-purple-400"
                    )}>
                      {selectedPost.parsedPrompt?.status}
                    </span>
                  </div>

                  {/* Target Platform badge */}
                  {selectedPost.parsedPrompt?.platform && (
                    <div className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{selectedPost.parsedPrompt.platform} UI</span>
                    </div>
                  )}
                </div>

                {/* Influencer Profile Card */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  {selectedPost.models?.portrait_url ? (
                    <img 
                      src={selectedPost.models.portrait_url} 
                      className="w-11 h-11 rounded-full object-cover border border-white/20 shadow-sm"
                      alt=""
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Creator Model</p>
                    <h4 className="text-sm font-bold text-white truncate">{selectedPost.models?.name || "AI Influencer"}</h4>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-white/5 text-[9px] font-bold text-white/40 border border-white/5 uppercase">
                    {selectedPost.aspect_ratio || "1:1"}
                  </div>
                </div>

                <div className="flex justify-between items-center px-1 text-[10px] text-white/30 font-semibold">
                  <span>ID: {selectedPost.id.slice(0, 8)}...</span>
                  <span>Generated {new Date(selectedPost.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Right Column: Campaign Details & Controls */}
              <div className="md:col-span-7 space-y-6">
                <div>
                  <span className="text-[9px] font-black uppercase text-secondary bg-secondary/15 px-3 py-1 rounded-full tracking-wider border border-secondary/20">
                    {selectedPost.parsedPrompt?.style || "Standard"} Style
                  </span>
                  <h3 className="text-3xl font-black text-white mt-4 leading-tight">
                    {selectedPost.parsedPrompt?.campaignName || "Untitled Campaign"}
                  </h3>
                </div>

                {/* Caption display */}
                {selectedPost.parsedPrompt?.caption && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Campaign Narrative Caption</label>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-sm leading-relaxed text-white/80 font-medium max-h-[160px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                      {selectedPost.parsedPrompt.caption}
                    </div>
                  </div>
                )}

                {/* Queue target representation for Scheduled post */}
                {selectedPost.parsedPrompt?.status === "scheduled" && !dialogIsEditingSchedule && (
                  <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/25 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-purple-300">Scheduled for publication</span>
                      </div>
                      <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest bg-purple-400/10 px-2 py-0.5 rounded-full border border-purple-400/20">
                        {selectedPost.parsedPrompt.publishOption === "now" ? "Instant Queue" : "Timed Queue"}
                      </span>
                    </div>
                    {selectedPost.parsedPrompt.scheduledAt ? (
                      <p className="text-sm font-semibold text-white/90 leading-relaxed">
                        This campaign will be shared on <span className="text-purple-300 underline underline-offset-4">{new Date(selectedPost.parsedPrompt.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span> at <span className="text-purple-300 font-extrabold">{new Date(selectedPost.parsedPrompt.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>.
                      </p>
                    ) : (
                      <p className="text-xs text-white/40">No queue timing recorded.</p>
                    )}
                  </div>
                )}

                {/* Dynamic components flow */}
                <div className="pt-5 border-t border-white/5 space-y-5">
                  {/* Draft options to schedule */}
                  {selectedPost.parsedPrompt?.status === "draft" && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <Calendar className="w-4.5 h-4.5 text-secondary" />
                          <span>Schedule Publication Queue</span>
                        </h4>
                        <span className="text-[8px] font-black uppercase text-secondary bg-secondary/15 px-2 py-0.5 rounded-full">Automated</span>
                      </div>
                      
                      {/* Publish Option Buttons */}
                      <div className="space-y-2.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Publish timing</label>
                        <div className="grid grid-cols-2 gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                          <button
                            type="button"
                            onClick={() => setDialogPublishOption("now")}
                            className={cn(
                              "py-3 rounded-xl font-bold text-xs uppercase transition-all",
                              dialogPublishOption === "now"
                                ? "bg-white text-black shadow-md"
                                : "text-white/60 hover:text-white"
                            )}
                          >
                            Publish Now
                          </button>
                          <button
                            type="button"
                            onClick={() => setDialogPublishOption("later")}
                            className={cn(
                              "py-3 rounded-xl font-bold text-xs uppercase transition-all",
                              dialogPublishOption === "later"
                                ? "bg-white text-black shadow-md"
                                : "text-white/60 hover:text-white"
                            )}
                          >
                            Schedule Later
                          </button>
                        </div>
                      </div>

                      {/* Timed Queue input pickers */}
                      {dialogPublishOption === "later" && (
                        <div className="grid grid-cols-2 gap-4 animate-fade-in">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Target Date</label>
                            <input
                              type="date"
                              value={dialogScheduleDate}
                              onChange={(e) => setDialogScheduleDate(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-secondary/50 text-white font-semibold cursor-pointer"
                              style={{ colorScheme: "dark" }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Target Time</label>
                            <input
                              type="time"
                              value={dialogScheduleTime}
                              onChange={(e) => setDialogScheduleTime(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-secondary/50 text-white font-semibold cursor-pointer"
                              style={{ colorScheme: "dark" }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <button
                          type="button"
                          onClick={() => handleUpdatePostStatus("scheduled")}
                          disabled={isUpdatingPost || (dialogPublishOption === "later" && (!dialogScheduleDate || !dialogScheduleTime))}
                          className="py-4.5 rounded-[1.5rem] bg-secondary hover:bg-secondary/90 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdatingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          <span>{dialogPublishOption === "now" ? "PUBLISH INSTANTLY" : "QUEUE SCHEDULED"}</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleDeletePostInDialog(selectedPost.id)}
                          disabled={isUpdatingPost}
                          className="py-4.5 rounded-[1.5rem] bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white font-bold text-xs uppercase tracking-widest border border-white/10 hover:border-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 text-white/60" />
                          <span>Delete Post</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Scheduled state options: edit time or move to draft */}
                  {selectedPost.parsedPrompt?.status === "scheduled" && (
                    <div className="space-y-4">
                      {dialogIsEditingSchedule ? (
                        <div className="space-y-5 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                              <Calendar className="w-4.5 h-4.5 text-purple-400" />
                              <span>Update Queue Timing</span>
                            </h4>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Target Date</label>
                              <input
                                type="date"
                                value={dialogScheduleDate}
                                onChange={(e) => setDialogScheduleDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-secondary/50 text-white font-semibold cursor-pointer"
                                style={{ colorScheme: "dark" }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Target Time</label>
                              <input
                                type="time"
                                value={dialogScheduleTime}
                                onChange={(e) => setDialogScheduleTime(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-secondary/50 text-white font-semibold cursor-pointer"
                                style={{ colorScheme: "dark" }}
                              />
                            </div>
                          </div>

                          <div className="flex gap-4 pt-2">
                            <button
                              type="button"
                              onClick={() => handleUpdatePostStatus("scheduled")}
                              disabled={isUpdatingPost || !dialogScheduleDate || !dialogScheduleTime}
                              className="flex-1 py-4 rounded-[1.5rem] bg-secondary hover:bg-secondary/90 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isUpdatingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              <span>Save New Time</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDialogIsEditingSchedule(false)}
                              className="py-4 px-6 rounded-[1.5rem] bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest border border-white/10 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDialogPublishOption("later");
                              setDialogIsEditingSchedule(true);
                            }}
                            className="py-4.5 rounded-[1.5rem] bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            <Clock className="w-4.5 h-4.5" />
                            <span>Edit Time</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdatePostStatus("draft")}
                            disabled={isUpdatingPost}
                            className="py-4.5 rounded-[1.5rem] bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Layers className="w-4.5 h-4.5 text-white/60" />
                            <span>Move to Draft</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePostInDialog(selectedPost.id)}
                            disabled={isUpdatingPost}
                            className="py-4.5 rounded-[1.5rem] bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white font-bold text-xs uppercase tracking-widest border border-white/10 hover:border-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4 text-white/60" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
