"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar, 
  Clock, 
  Trash2, 
  X, 
  Loader2, 
  Sparkles, 
  Layers, 
  Camera, 
  Music, 
  Send, 
  Users, 
  MapPin, 
  Globe, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ensureUserProfile } from "@/utils/ensure-profile";
import { updatePostPrompt, deletePost } from "@/app/actions/influencers";
import { cn } from "@/utils/cn";

// Social Platform Color Map
const platformMap: Record<string, { icon: any; color: string; bg: string; border: string; text: string }> = {
  instagram: { icon: Camera, color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20", text: "text-pink-400" },
  tiktok: { icon: Music, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", text: "text-cyan-300" },
  x: { icon: Send, color: "text-white", bg: "bg-white/10", border: "border-white/20", text: "text-white" },
  linkedin: { icon: Users, color: "text-blue-600", bg: "bg-blue-600/10", border: "border-blue-600/20", text: "text-blue-400" },
  pinterest: { icon: MapPin, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
  facebook: { icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
};

export default function CalendarPage() {
  const supabase = createClient();
  const router = useRouter();

  // Selected view month & year
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Data states
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

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

  // Draft Selection Dialog State
  const [schedulingDate, setSchedulingDate] = useState<string | null>(null); // e.g. "2026-05-18"
  const [selectedDraftPostId, setSelectedDraftPostId] = useState<string | null>(null);
  const [editCampaignName, setEditCampaignName] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editPlatform, setEditPlatform] = useState("instagram");
  const [scheduleTimeInput, setScheduleTimeInput] = useState("12:00");
  const [isSchedulingDraft, setIsSchedulingDraft] = useState(false);

  // Fetch posts from database
  const fetchCalendarData = async () => {
    try {
      const profileResult = await ensureUserProfile(supabase);
      if (profileResult.success) {
        setProfile(profileResult.user);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: postsData } = await supabase
          .from("posts")
          .select("*, models(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (postsData) {
          setPosts(postsData);
        }
      }
    } catch (err: any) {
      console.error("Error fetching calendar data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  // Parse prompts for all posts to extract structured parameters
  const parsedPosts = useMemo(() => {
    return posts.map((post: any) => {
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
  }, [posts]);

  // Filter only Scheduled posts
  const scheduledPosts = useMemo(() => {
    return parsedPosts.filter((post: any) => 
      post.parsedPrompt.status === "scheduled" && post.parsedPrompt.scheduledAt
    );
  }, [parsedPosts]);

  // Calendar helpers
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate calendar days for the current view (42 grid days: standard 6 weeks)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    
    const days: Date[] = [];
    // Start from Sunday of the first week of calendar grid
    const startDate = new Date(currentYear, currentMonth, 1 - startDayOfWeek);
    
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentMonth, currentYear]);

  // Go to previous month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  // Go to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Reset to today
  const handleResetToToday = () => {
    setCurrentDate(new Date());
  };

  // Format Helper
  const getLocalDateKey = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Map of scheduled posts by date
  const postsByDateMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    
    scheduledPosts.forEach(post => {
      // scheduledAt is YYYY-MM-DDTHH:MM
      const datePart = post.parsedPrompt.scheduledAt.split("T")[0];
      if (!map[datePart]) {
        map[datePart] = [];
      }
      map[datePart].push(post);
    });

    // Sort posts on each day by time
    Object.keys(map).forEach(dateStr => {
      map[dateStr].sort((a, b) => {
        const timeA = a.parsedPrompt.scheduledAt.split("T")[1] || "";
        const timeB = b.parsedPrompt.scheduledAt.split("T")[1] || "";
        return timeA.localeCompare(timeB);
      });
    });

    return map;
  }, [scheduledPosts]);

  // Total scheduled posts in current month view
  const currentMonthPostsCount = useMemo(() => {
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.parsedPrompt.scheduledAt);
      return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear;
    }).length;
  }, [scheduledPosts, currentMonth, currentYear]);

  // Filter only Draft posts
  const drafts = useMemo(() => {
    return parsedPosts.filter((post: any) => post.parsedPrompt.status === "draft");
  }, [parsedPosts]);

  const selectedDraftPost = useMemo(() => {
    return parsedPosts.find((p: any) => p.id === selectedDraftPostId) || null;
  }, [selectedDraftPostId, parsedPosts]);

  // Compute Weekly, Monthly and Platform breakdown stats for scheduled posts
  const stats = useMemo(() => {
    const today = new Date();
    
    // Get start of the current week (Sunday)
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get end of the current week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const weekCount = scheduledPosts.filter(post => {
      if (!post.parsedPrompt.scheduledAt) return false;
      const d = new Date(post.parsedPrompt.scheduledAt);
      return d >= startOfWeek && d <= endOfWeek;
    }).length;

    const monthCount = scheduledPosts.filter(post => {
      if (!post.parsedPrompt.scheduledAt) return false;
      const d = new Date(post.parsedPrompt.scheduledAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    // Platform breakdown for scheduled posts
    const platformBreakdown: Record<string, number> = {};
    scheduledPosts.forEach(post => {
      const plat = post.parsedPrompt.platform || "instagram";
      platformBreakdown[plat] = (platformBreakdown[plat] || 0) + 1;
    });

    return {
      weekCount,
      monthCount,
      platformBreakdown
    };
  }, [scheduledPosts, currentMonth, currentYear]);

  // Format time (e.g. 14:30 -> 2:30 PM)
  const formatTimeString = (dateTimeStr: string) => {
    try {
      const timePart = dateTimeStr.split("T")[1];
      if (!timePart) return "";
      const [hours, minutes] = timePart.split(":");
      const hh = parseInt(hours, 10);
      const ampm = hh >= 12 ? "PM" : "AM";
      const displayHour = hh % 12 === 0 ? 12 : hh % 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (e) {
      return dateTimeStr;
    }
  };

  // Open Dialog for post details
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
    }
    setDialogIsEditingSchedule(false);
  };

  // Update Post Status / Reschedule
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
        
        // Update local list
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? updatedPostObj : p));
        
        // Update dialog state
        setSelectedPost(updatedPostObj);
        setDialogIsEditingSchedule(false);
        setSuccessMessage(statusType === "draft" 
          ? "Post moved to Drafts successfully!" 
          : `Post rescheduled successfully for ${pubOption === "later" ? `${dialogScheduleDate} at ${dialogScheduleTime}` : "immediate publication"}!`
        );
        
        // Re-fetch calendar data to keep it fully synced
        fetchCalendarData();
        
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
    if (!confirm("Are you sure you want to delete this scheduled post?")) return;
    
    setIsUpdatingPost(true);
    try {
      const res = await deletePost(postId);
      if (res.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setSelectedPost(null);
        fetchCalendarData();
      } else {
        setErrorMessage("Failed to delete post: " + res.error);
      }
    } catch (e: any) {
      setErrorMessage("Error deleting post: " + e.message);
    } finally {
      setIsUpdatingPost(false);
    }
  };

  // Select a draft post and populate edit state
  const handleSelectDraft = (postId: string) => {
    setSelectedDraftPostId(postId);
    const draft = parsedPosts.find(p => p.id === postId);
    if (draft) {
      setEditCampaignName(draft.parsedPrompt?.campaignName || "");
      setEditCaption(draft.parsedPrompt?.caption || "");
      setEditPlatform(draft.parsedPrompt?.platform || "instagram");
    }
  };

  // Schedule selected draft post
  const handleScheduleDraftSubmit = async () => {
    if (!selectedDraftPostId || !schedulingDate || !scheduleTimeInput) return;
    
    setIsSchedulingDraft(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      const draft = parsedPosts.find(p => p.id === selectedDraftPostId);
      if (!draft) throw new Error("Draft not found");
      
      const scheduledDateTime = `${schedulingDate}T${scheduleTimeInput}`;
      
      const updatedPrompt = JSON.stringify({
        ...draft.parsedPrompt,
        campaignName: editCampaignName,
        caption: editCaption,
        platform: editPlatform,
        status: "scheduled",
        publishOption: "later",
        scheduledAt: scheduledDateTime
      });
      
      const res = await updatePostPrompt(selectedDraftPostId, updatedPrompt);
      if (res.success) {
        setSuccessMessage("Post scheduled successfully!");
        setSchedulingDate(null);
        setSelectedDraftPostId(null);
        // Refresh calendar data
        fetchCalendarData();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage("Failed to schedule post: " + (res.error || "Unknown error"));
      }
    } catch (e: any) {
      setErrorMessage("Error scheduling post: " + e.message);
    } finally {
      setIsSchedulingDraft(false);
    }
  };

  const todayStr = getLocalDateKey(new Date());

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Calendar Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-white">Content Calendar</h1>
          </div>
          <p className="text-white/50 text-sm">Visualize, track, and manage your AI Influencer publication queue.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Active stats */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mr-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentMonthPostsCount} Scheduled This Month</span>
          </div>

          <button
            onClick={handleResetToToday}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
          >
            Today
          </button>
          
          <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 text-sm font-bold text-white min-w-[120px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Days of Week Headers */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {daysOfWeek.map((day) => (
          <div 
            key={day} 
            className="text-xs font-black uppercase tracking-widest text-white/40 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, idx) => {
          const dateKey = getLocalDateKey(day);
          const isCurrentMonth = day.getMonth() === currentMonth;
          const isToday = dateKey === todayStr;
          const dayPosts = postsByDateMap[dateKey] || [];

          return (
            <div
              key={idx}
              className={cn(
                "group relative min-h-[140px] flex flex-col p-3 rounded-2xl border transition-all duration-300",
                isCurrentMonth 
                  ? "bg-white/[0.02] border-white/5" 
                  : "bg-white/[0.005] border-white/[0.02] opacity-35",
                isToday 
                  ? "border-primary bg-primary/[0.03] shadow-[0_0_15px_rgba(139,92,246,0.1)]" 
                  : "hover:border-white/20 hover:bg-white/[0.04]"
              )}
            >
              {/* Day number & Indicators */}
              <div className="flex items-center justify-between mb-2">
                <span 
                  className={cn(
                    "text-sm font-extrabold flex items-center justify-center w-6 h-6 rounded-full",
                    isToday ? "bg-primary text-white" : "text-white/60"
                  )}
                >
                  {day.getDate()}
                </span>
                
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </div>

              {/* Day Posts List */}
              <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[85px] custom-scrollbar pr-1">
                {dayPosts.map((post) => {
                  const platform = post.parsedPrompt.platform || "instagram";
                  const config = platformMap[platform] || platformMap.instagram;
                  const PlatIcon = config.icon;
                  const timeStr = formatTimeString(post.parsedPrompt.scheduledAt);

                  return (
                      <button
                        key={post.id}
                        onClick={() => handleOpenPostDialog(post)}
                        className={cn(
                          "w-full text-left flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all hover:scale-[1.02]",
                          config.bg,
                          config.border,
                          config.text
                        )}
                        title={`${post.parsedPrompt.campaignName} (${timeStr})`}
                      >
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt="" 
                            className="w-5 h-5 rounded mr-1 object-cover"
                          />
                        )}
                        <PlatIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate flex-1">
                          {post.parsedPrompt.campaignName}
                        </span>
                        <span className="text-[8px] opacity-70 flex-shrink-0">
                          {timeStr.split(" ")[0]}
                        </span>
                      </button>
                  );
                })}
              </div>

              {/* Schedule Post Hover Option */}
              <button
                onClick={() => {
                  setSchedulingDate(dateKey);
                  setSelectedDraftPostId(null);
                  setScheduleTimeInput("12:00");
                }}
                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex items-center gap-1"
                title={`Schedule post for ${monthNames[day.getMonth()]} ${day.getDate()}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase pr-0.5 hidden xl:inline">Schedule</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Calendar Insights & Bottom Stats Section */}
      <div className="mt-12 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-10 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Publication Queue Insights</h2>
            <p className="text-white/40 text-xs">Analytics and distribution metrics for your scheduled posts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Week Stats Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/15 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-16 h-16 text-primary" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Scheduled This Week</p>
            <h3 className="text-4xl font-black text-white mt-2">{stats.weekCount}</h3>
            <p className="text-xs text-white/40 mt-1">Posts lined up for the current calendar week.</p>
          </div>

          {/* Month Stats Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/15 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-16 h-16 text-purple-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Scheduled This Month</p>
            <h3 className="text-4xl font-black text-white mt-2">{stats.monthCount}</h3>
            <p className="text-xs text-white/40 mt-1">Posts scheduled for {monthNames[currentMonth]} {currentYear}.</p>
          </div>

          {/* Platform Distribution Card */}
          <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-300 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Platform Distribution</p>
              <div className="flex flex-wrap gap-2 mt-3.5">
                {Object.keys(platformMap).map(plat => {
                  const count = stats.platformBreakdown[plat] || 0;
                  const config = platformMap[plat];
                  const PlatIcon = config.icon;
                  if (count === 0) return null;
                  return (
                    <div 
                      key={plat}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold",
                        config.bg,
                        config.border,
                        config.text
                      )}
                    >
                      <PlatIcon className="w-3.5 h-3.5" />
                      <span className="capitalize">{plat}:</span>
                      <span className="font-black text-white">{count}</span>
                    </div>
                  );
                })}
                {Object.values(stats.platformBreakdown).reduce((a, b) => a + b, 0) === 0 && (
                  <p className="text-xs text-white/30 italic">No posts scheduled on any platform.</p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-white/30 font-semibold mt-4">Multi-platform social content scheduler active.</p>
          </div>
        </div>
      </div>

      {/* Draft Selection & Scheduling Dialog */}
      {schedulingDate && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] max-w-5xl w-full p-8 md:p-10 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Close Button */}
            <button 
              onClick={() => {
                setSchedulingDate(null);
                setSelectedDraftPostId(null);
              }}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                <span>Schedule Draft for {new Date(schedulingDate + "T00:00:00").toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </h2>
              <p className="text-white/40 text-xs mt-1">Select a draft post, review/edit details, choose publication time, and add it to your calendar queue.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Column: List of Drafts */}
              <div className="md:col-span-5 space-y-4">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest px-1">Select a Draft Post ({drafts.length})</h3>
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                  {drafts.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-3">
                      <Layers className="w-8 h-8 text-white/20 mx-auto" />
                      <p className="text-xs text-white/40 font-semibold">No draft posts available.</p>
                      <Link 
                        href="/dashboard/generator"
                        className="inline-block px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-bold rounded-xl transition-colors uppercase tracking-wider"
                      >
                        Create Post Draft
                      </Link>
                    </div>
                  ) : (
                    drafts.map((draft) => {
                      const platform = draft.parsedPrompt.platform || "instagram";
                      const config = platformMap[platform] || platformMap.instagram;
                      const PlatIcon = config.icon;
                      const isSelected = selectedDraftPostId === draft.id;
                      
                      return (
                        <button
                          key={draft.id}
                          onClick={() => handleSelectDraft(draft.id)}
                          className={cn(
                            "w-full text-left p-3 rounded-2xl border transition-all flex gap-3 items-center group",
                            isSelected 
                              ? "bg-primary/[0.05] border-primary" 
                              : "bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]"
                          )}
                        >
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 relative flex-shrink-0 border border-white/10">
                            {draft.image_url && (
                              <img 
                                src={draft.image_url} 
                                alt="" 
                                className="w-full h-full object-cover" 
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-white truncate group-hover:text-primary transition-colors">
                              {draft.parsedPrompt.campaignName || "Untitled Draft"}
                            </h4>
                            <p className="text-[10px] text-white/40 truncate mt-0.5">
                              {draft.parsedPrompt.caption || "No description provided."}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className={cn("px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider flex items-center gap-1 border", config.bg, config.border, config.text)}>
                                <PlatIcon className="w-2.5 h-2.5" />
                                <span>{platform}</span>
                              </span>
                              <span className="text-[8px] text-white/30 font-bold">
                                Created {new Date(draft.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Complete Info, Edit & Time Selection */}
              <div className="md:col-span-7 space-y-6">
                {selectedDraftPost ? (
                  <div className="space-y-5 animate-fade-in">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                      {/* Title Edit */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Campaign Title</label>
                        <input
                          type="text"
                          value={editCampaignName}
                          onChange={(e) => setEditCampaignName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-primary/50 text-white font-semibold"
                        />
                      </div>

                      {/* Caption (Description) Edit */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Post Description / Caption</label>
                        <textarea
                          rows={4}
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-primary/50 text-white leading-relaxed custom-scrollbar"
                          placeholder="Write something compelling..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Target Platform Select */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Platform</label>
                          <select
                            value={editPlatform}
                            onChange={(e) => setEditPlatform(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-primary/50 text-white font-semibold cursor-pointer"
                          >
                            <option value="instagram" className="bg-zinc-950">Instagram</option>
                            <option value="tiktok" className="bg-zinc-950">TikTok</option>
                            <option value="x" className="bg-zinc-950">X (Twitter)</option>
                            <option value="linkedin" className="bg-zinc-950">LinkedIn</option>
                            <option value="pinterest" className="bg-zinc-950">Pinterest</option>
                            <option value="facebook" className="bg-zinc-950">Facebook</option>
                          </select>
                        </div>

                        {/* Schedule Time Input */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Schedule Time</label>
                          <input
                            type="time"
                            value={scheduleTimeInput}
                            onChange={(e) => setScheduleTimeInput(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-primary/50 text-white font-semibold cursor-pointer"
                            style={{ colorScheme: "dark" }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={handleScheduleDraftSubmit}
                        disabled={isSchedulingDraft || !editCampaignName}
                        className="flex-1 py-4 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSchedulingDraft ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Schedule Post</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDraftPostId(null)}
                        className="py-4 px-6 rounded-[1.5rem] bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest border border-white/10 transition-all"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 border border-white/5 border-dashed rounded-3xl bg-white/[0.01] space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white/20 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">No Draft Selected</h4>
                      <p className="text-xs text-white/40 mt-1 max-w-[280px]">Choose an authentic draft post from the list on the left to configure details and schedule.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal Component */}
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
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-md bg-purple-500/25 border-purple-500/40 text-purple-400">
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
                  <span>Generated {new Date(selectedPost.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
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

                {/* Queue target representation */}
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
                        This campaign will be shared on <span className="text-purple-300 underline underline-offset-4">{new Date(selectedPost.parsedPrompt.scheduledAt).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span> at <span className="text-purple-300 font-extrabold">{new Date(selectedPost.parsedPrompt.scheduledAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>.
                      </p>
                    ) : (
                      <p className="text-xs text-white/40">No queue timing recorded.</p>
                    )}
                  </div>
                )}

                {/* Controls flow */}
                <div className="pt-5 border-t border-white/5 space-y-5">
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
