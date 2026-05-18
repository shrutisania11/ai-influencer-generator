"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, Zap, Users, Image as ImageIcon, ArrowRight, Loader2, Trash2, 
  MoreVertical, ExternalLink, Calendar, Clock, CheckCircle2, AlertCircle, 
  X, ChevronLeft, ChevronRight, Layers, Camera
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ensureUserProfile } from "@/utils/ensure-profile";
import { deleteInfluencer, updatePostPrompt, deletePost } from "@/app/actions/influencers";
import { cn } from "@/utils/cn";

// Target Platforms lookup
const PLATFORM_INFO: any = {
  instagram: { name: "Instagram", color: "text-pink-500", bg: "bg-pink-500/10" },
  tiktok: { name: "TikTok", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  x: { name: "X", color: "text-white", bg: "bg-white/10" },
  linkedin: { name: "LinkedIn", color: "text-blue-500", bg: "bg-blue-500/10" },
  pinterest: { name: "Pinterest", color: "text-red-500", bg: "bg-red-500/10" },
  facebook: { name: "Facebook", color: "text-blue-600", bg: "bg-blue-600/10" },
};

export default function ModelsPage() {
  const supabase = createClient();
  const [models, setModels] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 8;

  const fetchData = async () => {
    // Ensure profile exists
    await ensureUserProfile(supabase);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Fetch models
      const { data: modelsData } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (modelsData) setModels(modelsData);

      // Fetch posts (including model details)
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, models(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (postsData) setPosts(postsData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteModel = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this model? This will also affect any posts associated with it.")) return;

    setDeletingId(id);
    const res = await deleteInfluencer(id);
    if (res.success) {
      setModels(models.filter(m => m.id !== id));
      // Remove posts associated with deleted model
      setPosts(posts.filter(p => p.model_id !== id));
    } else {
      alert("Failed to delete model: " + res.error);
    }
    setDeletingId(null);
  };

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
      // Default to tomorrow at 9 AM
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
        
        // Update main state list
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
      status: "published", // default to published
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

  // Filter only Drafts and Scheduled posts as requested
  const draftAndScheduledPosts = parsedPosts.filter((post: any) => 
    post.parsedPrompt.status === "draft" || post.parsedPrompt.status === "scheduled"
  );

  // Pagination calculations
  const totalPages = Math.ceil(draftAndScheduledPosts.length / postsPerPage);
  const paginatedPosts = draftAndScheduledPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  // Auto-adjust page if current page becomes out of bounds
  useEffect(() => {
    if (currentPage > 1 && currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [draftAndScheduledPosts.length, totalPages, currentPage]);

  return (
    <div className="space-y-12 pb-20 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Studio & Models</h1>
          <p className="text-white/50 text-lg">Your creative hub for AI influencers and content.</p>
        </div>
        <Link 
          href="/dashboard/models/new"
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Model</span>
        </Link>
      </div>

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link 
          href="/dashboard/models/new"
          className="group relative overflow-hidden p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-500 shadow-2xl"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 group-hover:rotate-0 duration-700">
            <Users className="w-48 h-48 text-primary" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Plus className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">New Influencer</h2>
              <p className="text-white/40 mt-3 text-lg leading-relaxed">Design a unique AI identity with custom attributes, style, and consistent personality.</p>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-primary pt-2">
              <span className="uppercase tracking-widest">Start Building</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/generator"
          className="group relative overflow-hidden p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-secondary/50 transition-all duration-500 shadow-2xl"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity -rotate-12 group-hover:rotate-0 duration-700">
            <ImageIcon className="w-48 h-48 text-secondary" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Zap className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Content Generator</h2>
              <p className="text-white/40 mt-3 text-lg leading-relaxed">Produce high-fidelity social media posts and visuals for your existing models.</p>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-secondary pt-2">
              <span className="uppercase tracking-widest">Generate Content</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      {/* Models Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">My AI Influencer Models</h2>
          </div>
          <p className="text-white/30 font-medium">{models.length} {models.length === 1 ? 'Model' : 'Models'} Created</p>
        </div>
        
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white/5 rounded-[2.5rem] border border-white/10 border-dashed">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-white/30 font-medium">Loading your models...</p>
          </div>
        ) : models.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {models.map((model) => (
              <div 
                key={model.id} 
                className="group relative flex flex-col gap-4 animate-fade-in-up"
              >
                {/* Image Card */}
                <div className="aspect-[3/4] rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden relative shadow-2xl group-hover:border-primary/40 transition-all duration-500">
                  <img 
                    src={model.portrait_url} 
                    alt={model.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 gap-3">
                    <Link 
                      href={`/dashboard/generator?modelId=${model.id}`}
                      className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 fill-black" />
                      <span>GENERATE POST</span>
                    </Link>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleDeleteModel(model.id, e)}
                        disabled={deletingId === model.id}
                        className="flex-1 py-3 rounded-xl bg-white/10 backdrop-blur-md text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-500/20 hover:text-red-500 transition-all"
                      >
                        {deletingId === model.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        <span>DELETE</span>
                      </button>
                    </div>
                  </div>

                  {/* Vibe Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/80">
                      {model.vibe}
                    </span>
                  </div>
                </div>

                {/* Info Card */}
                <div className="px-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{model.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-white/30 font-bold bg-white/5 px-2 py-0.5 rounded-md">
                      {model.gender === 'female' ? '♀' : '♂'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span>{model.age_range} Years</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="capitalize">{model.body_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 rounded-[3rem] border border-white/5 bg-white/2 flex flex-col items-center justify-center text-center p-8 space-y-6">
            <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center shadow-inner">
              <Users className="w-12 h-12 text-white/10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white/80">Your studio is empty</h3>
              <p className="text-white/40 max-w-sm">Create your first AI influencer model to start generating content and building your brand.</p>
            </div>
            <Link 
              href="/dashboard/models/new"
              className="px-8 py-4 rounded-2xl bg-white text-black font-bold hover:bg-white/90 transition-all"
            >
              Build Your First Model
            </Link>
          </div>
        )}
      </section>

      {/* Recent Activity / Queue Section */}
      <section className="space-y-8 pt-10">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Recent Activity & Queue</h2>
            </div>
            <p className="text-xs text-white/40 font-medium ml-13">Catalog and manage your draft updates and scheduled visual queues.</p>
          </div>
          <Link href="/dashboard/generator" className="text-sm font-bold text-secondary hover:underline uppercase tracking-widest">New Post Factory</Link>
        </div>
        
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
          </div>
        ) : draftAndScheduledPosts.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8">
              {paginatedPosts.map((post) => {
                const campaignName = post.parsedPrompt?.campaignName || "Untitled Campaign";
                const postStatus = post.parsedPrompt?.status || "draft";
                const styleName = post.parsedPrompt?.style || "";
                const platform = post.parsedPrompt?.platform || "instagram";
                
                let scheduledTimeStr = "";
                if (postStatus === "scheduled" && post.parsedPrompt?.scheduledAt) {
                  scheduledTimeStr = new Date(post.parsedPrompt.scheduledAt).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                }

                return (
                  <div 
                    key={post.id} 
                    onClick={() => handleOpenPostDialog(post)}
                    className="group cursor-pointer space-y-4 relative flex flex-col justify-between p-4 rounded-[2rem] bg-white/5 border border-white/10 hover:border-secondary/40 hover:bg-white/[0.08] transition-all duration-500 shadow-xl"
                  >
                    <div className="space-y-4">
                      {/* Image Thumbnail */}
                      <div className="aspect-square rounded-2xl bg-white/5 overflow-hidden relative shadow-lg">
                        <img 
                          src={post.image_url} 
                          alt={campaignName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border backdrop-blur-md",
                            postStatus === "draft"
                              ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                              : "bg-purple-500/20 border-purple-500/30 text-purple-400"
                          )}>
                            {postStatus}
                          </span>
                        </div>

                        {/* Platform info on bottom right */}
                        <div className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[8px] font-bold text-white/95 uppercase">
                          {platform}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5 px-1">
                        <div className="flex items-center gap-1.5">
                          {post.models?.portrait_url && (
                            <img 
                              src={post.models.portrait_url} 
                              className="w-5.5 h-5.5 rounded-full object-cover border border-white/20"
                              alt=""
                            />
                          )}
                          <p className="text-[10px] font-black text-secondary uppercase tracking-tighter truncate">
                            {post.models?.name || "AI Influencer"}
                          </p>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-secondary transition-colors">
                          {campaignName}
                        </h4>
                        {styleName && (
                          <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">
                            Style: {styleName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-1 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] text-white/30 font-semibold">
                      <span>Created {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      {scheduledTimeStr && (
                        <span className="text-purple-300 font-bold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {scheduledTimeStr}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4 animate-fade-in">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-white/60">
                  Page <span className="text-white font-extrabold">{currentPage}</span> of <span className="text-white font-extrabold">{totalPages}</span>
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 rounded-[2.5rem] border border-white/5 bg-white/2 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shadow-inner text-white/20">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white/80">No drafts or scheduled posts</h3>
              <p className="text-white/40 max-w-sm text-sm">Create and queue up new visual campaigns inside the Post Factory page to see them listed here.</p>
            </div>
            <Link 
              href="/dashboard/generator"
              className="px-6 py-3 rounded-xl bg-secondary text-white font-bold hover:bg-secondary/90 transition-all text-sm"
            >
              Go to Post Factory
            </Link>
          </div>
        )}
      </section>

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
