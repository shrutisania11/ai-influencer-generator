"use client";

import { useState, useEffect, useRef, memo } from "react";
import { 
  Sparkles, Wand2, Info, Loader2, CheckCircle2, AlertCircle, Layout, ArrowLeft,
  Send, Globe, MessageSquare, 
  Hash, Image as ImageIcon, Plus, Trash2, Layers, Target, Music, Video, Calendar,
  Camera, MapPin, Palette, Zap, Flame, UserPlus, Users, TrendingUp, MoreVertical,
  Download, Share2, Eye, MousePointer2, Heart, MessageCircle, Bookmark, Repeat2,
  Volume2, Search, Home as HomeIcon, Bell, Mail, ThumbsUp, Share, MessageSquare as MessageIcon,
  Navigation, ExternalLink, Clock
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { generateImage } from "@/app/actions/image";
import { createLumaGeneration, getLumaGeneration } from "@/app/actions/luma";
import { createPost, uploadReferenceImage } from "@/app/actions/influencers";
import { generateCaptionAction } from "@/app/actions/captions";
import { getSocialAccounts } from "@/app/actions/social";
import { ensureUserProfile } from "@/utils/ensure-profile";
import { cn } from "@/utils/cn";
import Link from "next/link";

// --- Constants ---
const PLATFORMS = [
  { id: "instagram", icon: Camera, color: "text-pink-500", bg: "bg-pink-500/10" },
  { id: "tiktok", icon: Music, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  { id: "x", icon: Send, color: "text-white", bg: "bg-white/10" },
  { id: "linkedin", icon: Users, color: "text-blue-600", bg: "bg-blue-600/10" },
  { id: "pinterest", icon: MapPin, color: "text-red-500", bg: "bg-red-500/10" },
  { id: "facebook", icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10" },
];

const FORMATS = [
  { id: "1:1", label: "Single Post", sub: "Square (1:1)", icon: "⏹️", shape: "w-8 h-8 rounded-lg border-2" },
  { id: "4:5", label: "Portrait Post", sub: "Classic (4:5)", icon: "📸", shape: "w-7 h-9 rounded-lg border-2" },
  { id: "9:16", label: "Story / Reel", sub: "Vertical (9:16)", icon: "📱", shape: "w-6 h-10 rounded-lg border-2" },
  { id: "16:9", label: "Landscape", sub: "Wide (16:9)", icon: "🎞️", shape: "w-10 h-6 rounded-lg border-2" },
];

const GOALS = ["Awareness", "Conversion", "Engagement", "Brand Identity", "Education"];
const TONES = ["Professional", "Casual", "Witty", "Luxury", "Energetic", "Friendly"];
const LANGUAGES = ["English", "Spanish", "French", "German", "Japanese", "Hindi", "Arabic"];
const SCENES = [
  { id: "urban", label: "Urban", icon: "🏙️" },
  { id: "studio", label: "Studio", icon: "📸" },
  { id: "nature", label: "Nature", icon: "🌲" },
  { id: "beach", label: "Beach", icon: "🏖️" },
  { id: "home", label: "Home", icon: "🏠" },
  { id: "abstract", label: "Abstract", icon: "🎨" },
];

// --- Sub-components for better performance ---

const ModelCard = memo(({ model, isSelected, onSelect }: any) => (
  <button
    onClick={() => onSelect(model.id)}
    className={cn(
      "flex-shrink-0 w-52 group relative rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden",
      isSelected 
        ? "border-primary shadow-2xl shadow-primary/30 scale-[1.02]" 
        : "border-white/5 opacity-60 hover:opacity-100 grayscale hover:grayscale-0"
    )}
  >
    <div className="aspect-[4/5] relative">
      <img src={model.portrait_url} alt={model.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute bottom-5 left-5 right-5 text-left space-y-1">
        <p className="font-bold text-base text-white truncate">{model.name}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{model.vibe}</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px] font-bold">12.5k Reach</span>
          </div>
        </div>
      </div>
    </div>
    {isSelected && (
      <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg border border-white/20">
        <CheckCircle2 className="w-4 h-4 text-white" />
      </div>
    )}
  </button>
));

ModelCard.displayName = "ModelCard";

const PlatformButton = memo(({ platform, isPostingSelected, isPreviewing, onToggle, onPreview }: any) => (
  <div className="relative flex-grow flex-shrink-0 min-w-[140px] group/btn">
    <button
      onClick={() => onToggle(platform.id)}
      className={cn(
        "w-full flex items-center justify-between py-3.5 px-4 rounded-2xl transition-all duration-300 border text-left",
        isPostingSelected 
          ? "bg-white/10 text-white border-primary/40 shadow-lg shadow-primary/5" 
          : "text-white/30 border-white/5 bg-white/2 hover:bg-white/5 hover:text-white/60"
      )}
    >
      <div className="flex items-center gap-2">
        <platform.icon className={cn("w-4.5 h-4.5", isPostingSelected ? platform.color : "text-inherit")} />
        <span className="text-[10px] font-black uppercase tracking-wider">{platform.id}</span>
      </div>
      <div className={cn(
        "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
        isPostingSelected ? "border-primary bg-primary text-white" : "border-white/20"
      )}>
        {isPostingSelected && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
      </div>
    </button>
    
    {isPostingSelected && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPreview(platform.id);
        }}
        className={cn(
          "absolute -top-1.5 -right-1.5 p-1 rounded-full border transition-all z-10 backdrop-blur-md",
          isPreviewing
            ? "bg-emerald-500 border-emerald-400 text-white scale-110 shadow-lg shadow-emerald-500/20"
            : "bg-zinc-900 border-white/10 text-white/40 hover:text-white hover:border-white/20"
        )}
        title="View live simulation preview"
      >
        <Eye className="w-2.5 h-2.5" />
      </button>
    )}
  </div>
));

PlatformButton.displayName = "PlatformButton";

export default function PostGeneratorPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [models, setModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [selectedFormat, setSelectedFormat] = useState("1:1");
  const [campaignName, setCampaignName] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("Engagement");
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedCTA, setSelectedCTA] = useState("None");
  const [hashtagCount, setHashtagCount] = useState(5);
  const [selectedScene, setSelectedScene] = useState("urban");
  const [caption, setCaption] = useState("");
  const [userCredits, setUserCredits] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [status, setStatus] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  
  // Two versions of the post
  const [versionA, setVersionA] = useState<{
    imageUrl: string;
    caption: string;
    prompt: string;
    style: string;
  } | null>(null);
  
  const [versionB, setVersionB] = useState<{
    imageUrl: string;
    caption: string;
    prompt: string;
    style: string;
  } | null>(null);
  
  const [captionA, setCaptionA] = useState("");
  const [captionB, setCaptionB] = useState("");
  
  const [selectedVersion, setSelectedVersion] = useState<"A" | "B">("A");
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    description: string;
    type: "draft" | "scheduled";
    scheduledAt?: string;
  } | null>(null);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [publishOption, setPublishOption] = useState<"now" | "later">("now");

  // Helper to get tomorrow's date formatted as YYYY-MM-DD
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Helper to get current time formatted as HH:MM
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [scheduleDate, setScheduleDate] = useState(getTomorrowDate());
  const [scheduleTime, setScheduleTime] = useState(getCurrentTime());

  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [isUploadingRef, setIsUploadingRef] = useState(false);

  const handleVersionChange = (ver: "A" | "B") => {
    setSelectedVersion(ver);
    if (ver === "A") {
      setGeneratedImage(versionA?.imageUrl || null);
      setCaption(captionA || "");
    } else {
      setGeneratedImage(versionB?.imageUrl || null);
      setCaption(captionB || "");
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platformId)) {
        if (prev.length === 1) return prev;
        const updated = prev.filter((p) => p !== platformId);
        if (selectedPlatform === platformId) {
          setSelectedPlatform(updated[0]);
        }
        return updated;
      } else {
        const updated = [...prev, platformId];
        setSelectedPlatform(platformId);
        return updated;
      }
    });
  };

  useEffect(() => {
    async function fetchData() {
      const urlParams = new URLSearchParams(window.location.search);
      const modelIdFromUrl = urlParams.get('modelId');
      const dateFromUrl = urlParams.get('date');

      if (dateFromUrl) {
        setScheduleDate(dateFromUrl);
        setPublishOption("later");
        setShowScheduleForm(true);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: modelsData } = await supabase
          .from('models')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (modelsData) {
          setModels(modelsData);
          if (modelIdFromUrl && modelsData.find(m => m.id === modelIdFromUrl)) {
            setSelectedModelId(modelIdFromUrl);
          } else if (modelsData.length > 0) {
            setSelectedModelId(modelsData[0].id);
          }
        }

        const { data: userData } = await supabase
          .from('users')
          .select('credits')
          .eq('id', user.id)
          .single();
        if (userData) setUserCredits(userData.credits);
      }

      // Fetch connected accounts
      try {
        const res = await getSocialAccounts();
        if (res.success) {
          let accounts = res.accounts || [];
          if (res.dbTableMissing) {
             const local = localStorage.getItem("influence_social_accounts");
             accounts = local ? JSON.parse(local) : [];
          } else {
             const local = localStorage.getItem("influence_social_accounts");
             const parsed = local ? JSON.parse(local) : [];
             accounts = [...accounts, ...parsed.filter((p:any) => !accounts.find((a:any) => a.account_id === p.account_id))];
          }
          const platforms = Array.from(new Set(accounts.map((a: any) => a.platform)));
          setConnectedPlatforms(platforms as string[]);
        } else {
          // fallback to local
          const local = localStorage.getItem("influence_social_accounts");
          const accounts = local ? JSON.parse(local) : [];
          const platforms = Array.from(new Set(accounts.map((a: any) => a.platform)));
          setConnectedPlatforms(platforms as string[]);
        }
      } catch (e) {
          const local = localStorage.getItem("influence_social_accounts");
          const accounts = local ? JSON.parse(local) : [];
          const platforms = Array.from(new Set(accounts.map((a: any) => a.platform)));
          setConnectedPlatforms(platforms as string[]);
      }
      setIsLoadingAccounts(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoadingAccounts && connectedPlatforms.length > 0) {
      if (!connectedPlatforms.includes(selectedPlatform)) {
        setSelectedPlatform(connectedPlatforms[0]);
        setSelectedPlatforms([connectedPlatforms[0]]);
      } else if (selectedPlatforms.length === 0) {
        setSelectedPlatforms([selectedPlatform]);
      }
    }
  }, [connectedPlatforms, isLoadingAccounts]);

  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const res = await generateCaptionAction({
        campaignName,
        productName,
        goal: selectedGoal,
        tone: selectedTone,
        platform: selectedPlatform,
        language: selectedLanguage
      });
      if (res.success) {
        setCaption(res.caption);
        if (selectedVersion === "A") {
          setCaptionA(res.caption);
        } else {
          setCaptionB(res.caption);
        }
      }
    } catch (e) {
      alert("Failed to generate caption");
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedModelId) return alert("Please select a model");
    if (!campaignName) return alert("Please enter campaign name");

    setIsLoading(true);
    setGeneratedImage(null);
    setVersionA(null);
    setVersionB(null);
    setCaptionA("");
    setCaptionB("");
    setIsSuccess(false);
    setSelectedVersion("A");
    setStatus("Analyzing identity...");

    try {
      await ensureUserProfile(supabase);
      const selectedModel = models.find(m => m.id === selectedModelId);
      
      // 1. Build Physical Identity String (Crucial for Fallback & Consistency)
      const physicalDesc = `A ${selectedModel?.age_range || "20-year old"} ${selectedModel?.gender || "person"} with ${selectedModel?.skin_tone || "fair"} skin, ${selectedModel?.hair_style || "stylish"} ${selectedModel?.hair_color || "dark"} hair, and ${selectedModel?.eye_color || "brown"} eyes. ${selectedModel?.body_type || "fit"} build.`;

      // 2. Scene & Lighting Details
      const lightingMap: any = {
        urban: "vibrant city neon lights, bokeh street background",
        studio: "professional 3-point softbox studio lighting, clean background",
        nature: "soft natural sunlight filtering through trees, dappled light",
        beach: "warm golden hour sunset lighting, glistening water background",
        home: "cozy indoor window lighting, warm domestic atmosphere",
        abstract: "artistic dramatic lighting with creative shadows"
      };

      // 3. Construct Ultra-Detailed Prompts
      const hasProductRef = referenceImages.length > 0;
      
      // On-the-fly visual analysis if productDescription is empty but reference images exist!
      let activeProductDesc = productDescription;
      if (hasProductRef && !activeProductDesc) {
        setStatus("Deep scanning product reference visual features...");
        try {
          const { describeProductImage } = await import("@/app/actions/fal");
          const desc = await describeProductImage(referenceImages[0]);
          if (desc) {
            activeProductDesc = desc;
            setProductDescription(desc); // Cache in state
          }
        } catch (e) {
          console.error("On-the-fly visual analysis failed:", e);
        }
      }

      const productInstruction = hasProductRef 
        ? `The subject is prominently holding and showcasing the ${productName || "featured product"} (${activeProductDesc || "matching the uploaded reference image shape, style, colors, and layout"}).`
        : `The subject is naturally holding the ${productName || "featured product"}.`;

      // Version A: High-Fashion Studio / Premium Editorial (Hyper-detailed, clean backdrop, elegant)
      const promptA = `A premium high-fashion editorial commercial photograph for ${selectedPlatform}. ${physicalDesc} The subject is in a sophisticated, elegant lifestyle pose, looking directly at the camera with a ${selectedTone.toLowerCase()} expression. ${productInstruction} The scene is set in a ${selectedScene} environment with refined ${lightingMap[selectedScene as keyof typeof lightingMap] || lightingMap.urban}. Captured on an 85mm portrait lens, f/1.4 aperture, exquisite studio lighting setup, sharp focus on the face and product, soft bokeh, hyper-detailed skin texture, realistic hair strands, luxurious fabric textures, natural skin pores, cinematic color grading, professional award-winning fashion aesthetic.`;

      // Version B: Cinematic Streetstyle / Candid Lifestyle (Warm lighting, environmental, natural)
      const promptB = `A raw, authentic social media candid snapshot for ${selectedPlatform}. ${physicalDesc} The subject is captured in a natural, candid moment, smiling gently or looking casually off-camera with an authentic expression. ${productInstruction} The scene is a realistic ${selectedScene} environment with warm natural sunlight, golden hour glow, and rich environmental shadows. 35mm film photograph, f/2.0 aperture, slight film grain, soft lens flare, realistic depth, high-fidelity details in hair, clothing, and environment, highly relatable everyday influencer aesthetic, gorgeous natural lighting.`;

      const charRefs = [selectedModel?.portrait_url, selectedModel?.full_body_url].filter(Boolean) as string[];
      const productRefs = referenceImages.filter(Boolean);

      // Define single generation helper inside handleGenerate to access local variables easily
      const generateVersion = async (promptStr: string, styleName: string, statusSetter: (s: string) => void) => {
        statusSetter(`Syncing with Luma Uni-1 for ${styleName}...`);
        
        const lumaResult = await createLumaGeneration(
          promptStr,
          selectedFormat as any,
          charRefs,
          productRefs
        );

        if (lumaResult.success && lumaResult.generation) {
          if (lumaResult.isMock) {
            statusSetter(`Demo Mode: Rendering ${styleName}...`);
            await new Promise(r => setTimeout(r, 1500));
            return lumaResult.generation.output?.[0]?.url || "";
          } else {
            statusSetter(`Luma rendering ${styleName} version...`);
            let attempts = 0;
            const maxAttempts = 40; 
            
            while (attempts < maxAttempts) {
              const check = await getLumaGeneration(lumaResult.generation.id);
              if (check.success && check.generation && check.generation.state === "completed") {
                return check.generation.output?.[0]?.url || "";
              }
              if (check.success && check.generation && check.generation.state === "failed") {
                throw new Error(`Luma failed to render ${styleName}.`);
              }
              await new Promise(r => setTimeout(r, 2000));
              attempts++;
              statusSetter(`Neural rendering ${styleName}... ${Math.round((attempts / maxAttempts) * 100)}%`);
            }
            throw new Error(`Luma timed out rendering ${styleName}.`);
          }
        } else {
          // Fallback 1: Fal.ai
          statusSetter(`Luma credits exhausted. Using Fal.ai for ${styleName}...`);
          const falPrompt = `${promptStr} (Hyper-realistic photography, masterpiece)`.slice(0, 1500);
          const { generateWithFal } = await import("@/app/actions/fal");
          const falResult = await generateWithFal(
            falPrompt, 
            charRefs[0], 
            productRefs[0],
            selectedFormat === "1:1" ? 1024 : selectedFormat === "9:16" ? 768 : 1024,
            selectedFormat === "1:1" ? 1024 : selectedFormat === "9:16" ? 1344 : 768
          );

          if (falResult.success && falResult.imageUrl) {
            return falResult.imageUrl;
          } else {
            // Fallback 2: Pollinations
            statusSetter(`Fal.ai busy. Using Free Flux Engine for ${styleName}...`);
            const fluxPrompt = `${promptStr} (Hyper-realistic photography, cinematic style, masterpiece)`.slice(0, 1500);
            const result = await generateImage(
              fluxPrompt,
              selectedFormat === "1:1" ? 1024 : selectedFormat === "9:16" ? 768 : 1024,
              selectedFormat === "1:1" ? 1024 : selectedFormat === "9:16" ? 1344 : 768
            );
            if (result.success && result.imageUrl) {
              return result.imageUrl;
            } else {
              throw new Error(result.error || `All generation engines failed for ${styleName} version.`);
            }
          }
        }
      };

      // 4. Generate Version A (Editorial Pro)
      let imgA = "";
      try {
        imgA = await generateVersion(promptA, "Editorial Pro", setStatus);
        if (imgA) {
          // Generate caption for A
          const capA = await generateCaptionAction({
            campaignName,
            productName,
            goal: selectedGoal,
            tone: selectedTone,
            platform: selectedPlatform,
            language: selectedLanguage
          });
          
          const newVerA = {
            imageUrl: imgA,
            caption: capA.success ? capA.caption : "",
            prompt: promptA,
            style: "Editorial Pro"
          };
          setVersionA(newVerA);
          setCaptionA(capA.success ? capA.caption : "");
          
          // Instantly show in preview
          setGeneratedImage(imgA);
          setCaption(capA.success ? capA.caption : "");
        }
      } catch (errA: any) {
        console.error("Version A generation failed:", errA);
      }

      // 5. Generate Version B (Candid Streetstyle)
      let imgB = "";
      try {
        imgB = await generateVersion(promptB, "Candid Streetstyle", setStatus);
        if (imgB) {
          // Generate caption for B (with different/contrasting tone)
          const toneB = selectedTone === "Professional" || selectedTone === "Luxury" ? "Casual" : "Professional";
          const capB = await generateCaptionAction({
            campaignName,
            productName,
            goal: selectedGoal,
            tone: toneB,
            platform: selectedPlatform,
            language: selectedLanguage
          });

          const newVerB = {
            imageUrl: imgB,
            caption: capB.success ? capB.caption : "",
            prompt: promptB,
            style: "Candid Streetstyle"
          };
          setVersionB(newVerB);
          setCaptionB(capB.success ? capB.caption : "");
          
          // If Version A failed, instantly show Version B in preview
          if (!imgA) {
            setSelectedVersion("B");
            setGeneratedImage(imgB);
            setCaption(capB.success ? capB.caption : "");
          }
        }
      } catch (errB: any) {
        console.error("Version B generation failed:", errB);
      }

      if (!imgA && !imgB) {
        throw new Error("Both image generation versions failed. Please check your credentials or network.");
      }

      setIsSuccess(true);
      setIsLoading(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Quality Control Error");
      setIsLoading(false);
    }
  };

  const handleSave = async (statusType: "draft" | "scheduled") => {
    const activeVersion = selectedVersion === "A" ? versionA : versionB;
    if (!activeVersion || !generatedImage) return;
    
    setIsSaving(true);
    try {
      const scheduledDateTime = statusType === "scheduled" && publishOption === "later"
        ? `${scheduleDate}T${scheduleTime}`
        : null;

      // Save the post for each selected platform
      const savePromises = selectedPlatforms.map(async (platform) => {
        const serializedPrompt = JSON.stringify({
          campaignName: campaignName,
          style: activeVersion.style,
          status: statusType,
          publishOption: statusType === "scheduled" ? publishOption : "now",
          scheduledAt: scheduledDateTime,
          platform: platform,
          caption: caption
        });

        return createPost({
          model_id: selectedModelId,
          prompt: serializedPrompt,
          image_url: generatedImage,
          aspect_ratio: selectedFormat
        });
      });

      const results = await Promise.all(savePromises);
      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        alert("Failed to save posts for some platforms: " + failed.map(f => f.error).join(", "));
      }

      const successfulRes = results.find(r => r.success && r.post);
      if (successfulRes && successfulRes.post) {
        // Instantly update the UI preview states with the permanent Supabase Storage URL instead of base64
        const savedStorageUrl = successfulRes.post.image_url;
        setGeneratedImage(savedStorageUrl);
        
        if (selectedVersion === "A" && versionA) {
          setVersionA({ ...versionA, imageUrl: savedStorageUrl });
        } else if (selectedVersion === "B" && versionB) {
          setVersionB({ ...versionB, imageUrl: savedStorageUrl });
        }
      }

      const hasAnySuccess = results.some(r => r.success);
      if (hasAnySuccess) {
        const platformsStr = selectedPlatforms.map(p => p.toUpperCase()).join(", ");
        setDialogConfig({
          title: statusType === "draft" 
            ? (selectedPlatforms.length > 1 ? "Drafts Saved to Studio" : "Draft Saved to Studio")
            : (selectedPlatforms.length > 1 ? "Posts Scheduled successfully!" : "Post Scheduled successfully!"),
          description: statusType === "draft"
            ? `Your creative update "${campaignName || "Untitled Campaign"}" has been successfully logged as a draft for [${platformsStr}] in your studio library.`
            : `Your high-fidelity post "${campaignName || "Untitled Campaign"}" is lined up for publication on [${platformsStr}]${publishOption === "later" ? ` at ${scheduleDate} ${scheduleTime}` : " instantly"}.`,
          type: statusType,
          scheduledAt: scheduledDateTime || undefined
        });
        setShowSuccessDialog(true);
      }
    } catch (e: any) {
      alert("Error saving: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && referenceImages.length < 3) {
      setIsUploadingRef(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const res = await uploadReferenceImage(base64);
          if (res.success && res.url) {
            setReferenceImages(prev => [...prev, res.url]);
            
            // Auto-analyze visual features of uploaded product image using LLaVA
            try {
              setStatus("Analyzing product image details...");
              const { describeProductImage } = await import("@/app/actions/fal");
              const visualDescription = await describeProductImage(res.url);
              if (visualDescription) {
                setProductDescription(prev => {
                  if (prev) return prev + ", " + visualDescription;
                  return visualDescription;
                });
              }
            } catch (errAnalysis) {
              console.error("Auto analysis failed:", errAnalysis);
            }
          } else {
            alert("Failed to upload reference image: " + res.error);
          }
          setIsUploadingRef(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error(err);
        setIsUploadingRef(false);
      }
    }
  };

  const selectedModel = models.find(m => m.id === selectedModelId);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/models" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group bg-white/5 px-4 py-2 rounded-xl border border-white/10">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Studio</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-white/10 text-white font-bold text-sm shadow-xl">
            <Zap className="w-4 h-4 text-primary fill-primary" />
            <span>{userCredits !== null ? `${userCredits} Credits` : "---"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Side: Builder */}
        <div className="xl:col-span-7 space-y-8 overflow-y-auto max-h-[calc(100vh-180px)] pr-4 custom-scrollbar">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Post Factory</h1>
            <p className="text-white/40 text-lg">Create authentic social content for your AI influencers.</p>
          </div>

          {/* Model Picker */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <label className="text-xs font-black uppercase tracking-[0.2em] text-white/30">1. Select Identity</label>
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">REQUIRED</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {models.map((model) => (
                <ModelCard 
                  key={model.id} 
                  model={model} 
                  isSelected={selectedModelId === model.id} 
                  onSelect={setSelectedModelId} 
                />
              ))}
              <Link href="/dashboard/models/new" className="flex-shrink-0 w-52 aspect-[4/5] rounded-[2.5rem] border-2 border-white/5 border-dashed flex flex-col items-center justify-center gap-3 text-white/20 hover:text-white/40 hover:border-white/10 transition-all bg-white/2">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-center px-4">New Model</span>
              </Link>
            </div>

            {/* Selected Model Identity References */}
            {selectedModel && (
              <div className="mt-4 p-6 rounded-[2rem] bg-white/5 border border-white/10 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Identity Anchors</h3>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Reference images for {selectedModel.name}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-black text-primary uppercase tracking-widest">
                    Character Lock Active
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-24 h-32 rounded-2xl overflow-hidden border border-white/10 relative group">
                    <img src={selectedModel.portrait_url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Portrait</span>
                    </div>
                  </div>
                  {selectedModel.full_body_url && (
                    <div className="w-24 h-32 rounded-2xl overflow-hidden border border-white/10 relative group">
                      <img src={selectedModel.full_body_url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Full Body</span>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-center gap-1">
                    <p className="text-[11px] font-bold text-white/80 italic">"Ensure the model looks exactly like these references."</p>
                    <p className="text-[10px] text-white/40 leading-tight">These images are sent as character identity to Luma Uni-1.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Product Reference Confirmation */}
            {referenceImages.length > 0 && (
              <div className="mt-4 p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-400">Product Anchors</h3>
                      <p className="text-[10px] text-emerald-500/50 uppercase tracking-widest font-black">Visual object references</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                    Object Lock Active
                  </div>
                </div>
                <div className="flex gap-4">
                  {referenceImages.map((img, idx) => (
                    <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-emerald-500/20 relative group">
                      <img src={img} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="flex-1 flex flex-col justify-center gap-1">
                    <p className="text-[11px] font-bold text-emerald-400/80 italic">"The model MUST be holding/using these specific items."</p>
                    <p className="text-[10px] text-emerald-500/40 leading-tight">These are sent as object/style references to the engine.</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Platform Tabs */}
          <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-white/30">2. Target Platform</label>
              {connectedPlatforms.length === 0 && !isLoadingAccounts && (
                <Link href="/dashboard/accounts" className="text-[10px] text-blue-400 font-bold hover:underline bg-blue-500/10 px-2 py-1 rounded">
                  Connect Accounts
                </Link>
              )}
            </div>
            {isLoadingAccounts ? (
               <div className="p-2.5 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-center py-4">
                 <Loader2 className="w-5 h-5 animate-spin text-white/50" />
               </div>
            ) : (
               <div className="flex flex-wrap gap-3.5 p-2.5 bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
                 {(connectedPlatforms.length > 0 ? PLATFORMS.filter(p => connectedPlatforms.includes(p.id)) : PLATFORMS).map((p) => (
                   <PlatformButton 
                     key={p.id} 
                     platform={p} 
                     isPostingSelected={selectedPlatforms.includes(p.id)}
                     isPreviewing={selectedPlatform === p.id}
                     onToggle={handlePlatformToggle}
                     onPreview={setSelectedPlatform}
                   />
                 ))}
               </div>
            )}
            {connectedPlatforms.length === 0 && !isLoadingAccounts && (
              <p className="text-[10px] text-amber-400 font-semibold px-2">
                No accounts connected. You will only be able to save this post as a draft.
              </p>
            )}
            {connectedPlatforms.length > 0 && !isLoadingAccounts && connectedPlatforms.length < PLATFORMS.length && (
              <p className="text-[10px] text-white/40 font-semibold px-2">
                Showing connected platforms. <Link href="/dashboard/accounts" className="text-blue-400 hover:underline">Connect more</Link>
              </p>
            )}
          </section>

          {/* Post Format & Visual Direction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-1">3. Content Format</label>
              <div className="grid grid-cols-1 gap-3">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFormat(f.id)}
                    className={cn(
                      "flex items-center gap-5 p-5 rounded-3xl border-2 transition-all group",
                      selectedFormat === f.id ? "border-primary bg-primary/10 shadow-lg" : "border-white/5 bg-white/2 hover:border-white/10"
                    )}
                  >
                    <div className="relative">
                      <div className={cn(f.shape, selectedFormat === f.id ? "border-primary" : "border-white/20 group-hover:border-white/40")} />
                      <div className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-current opacity-20" />
                    </div>
                    <div className="text-left">
                      <p className={cn("font-bold text-sm", selectedFormat === f.id ? "text-primary" : "text-white")}>{f.label}</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">{f.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-1">4. Scene Environment</label>
              <div className="grid grid-cols-2 gap-3">
                {SCENES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScene(s.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all group",
                      selectedScene === s.id ? "border-secondary bg-secondary/10 shadow-lg" : "border-white/5 bg-white/2 hover:border-white/10"
                    )}
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{s.icon}</span>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", selectedScene === s.id ? "text-secondary" : "text-white/40")}>{s.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Content Brief */}
          <section className="space-y-8 p-10 rounded-[3rem] bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Layers className="w-32 h-32 text-primary" />
            </div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Campaign Details</h2>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Inform the AI about your goal</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Campaign Title</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Summer Glow"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4.5 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                  />
                  <Target className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Featured Product</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Skincare Serum"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4.5 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                  />
                  <Zap className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
                </div>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 flex items-center gap-1.5">
                <span>Product Visual Features (Color, Shape, Details)</span>
                <span className="text-[8px] font-black text-secondary bg-secondary/15 px-1.5 py-0.5 rounded">Auto-Generated on Upload</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="e.g. A sleek blue frosted glass dropper bottle with a minimalistic white label containing rose-gold lettering"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4.5 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                />
                <Palette className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Marketing Goal</label>
              <div className="flex flex-wrap gap-2.5">
                {GOALS.map(g => (
                  <button 
                    key={g}
                    onClick={() => setSelectedGoal(g)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                      selectedGoal === g ? "bg-white text-black border-white shadow-xl scale-[1.05]" : "border-white/10 text-white/40 hover:border-white/20"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Caption Generator Section */}
          <section className="space-y-8 p-10 rounded-[3rem] bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <MessageSquare className="w-32 h-32 text-secondary" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary/20 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Smart Caption</h2>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">AI-crafted narratives</p>
                </div>
              </div>
              <button 
                onClick={handleGenerateCaption}
                disabled={isGeneratingCaption || !campaignName}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-secondary/20 border border-secondary/30 text-secondary font-bold text-xs hover:bg-secondary/30 transition-all"
              >
                {isGeneratingCaption ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span>GENERATE NEW</span>
              </button>
            </div>

            <div className="space-y-6 relative z-10">
              <textarea 
                value={caption}
                onChange={(e) => {
                  const val = e.target.value;
                  setCaption(val);
                  if (selectedVersion === "A") {
                    setCaptionA(val);
                  } else {
                    setCaptionB(val);
                  }
                }}
                placeholder="Click generate to create an AI-powered caption for your post..."
                className="w-full bg-white/2 border border-white/10 rounded-[2rem] p-8 text-sm focus:outline-none focus:border-secondary/50 transition-all min-h-[180px] resize-none font-medium leading-relaxed"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Brand Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map(t => (
                      <button 
                        key={t}
                        onClick={() => setSelectedTone(t)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                          selectedTone === t ? "bg-secondary text-white border-secondary" : "border-white/10 text-white/40 hover:border-white/20"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">CTA</label>
                    <select 
                      value={selectedCTA}
                      onChange={(e) => setSelectedCTA(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none appearance-none"
                    >
                      <option>None</option>
                      <option>Learn More</option>
                      <option>Shop Now</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Language</label>
                    <select 
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none appearance-none"
                    >
                      {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Reference Images */}
          <section className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-white/20" />
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">5. Identity & Context Reference (Max 3)</label>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[0, 1, 2].map(i => (
                <div 
                  key={i} 
                  onClick={() => !referenceImages[i] && !isUploadingRef && fileInputRef.current?.click()}
                  className={cn(
                    "aspect-square rounded-[2rem] border-2 border-dashed border-white/10 bg-white/2 flex flex-col items-center justify-center gap-3 group transition-all overflow-hidden relative shadow-inner",
                    !referenceImages[i] && !isUploadingRef && "hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                  )}
                >
                  {isUploadingRef && !referenceImages[i] && (i === referenceImages.length) ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <span className="text-[8px] font-black text-primary uppercase">Uploading...</span>
                    </div>
                  ) : referenceImages[i] ? (
                    <>
                      <img src={referenceImages[i]} className="w-full h-full object-cover animate-fade-in" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setReferenceImages(prev => prev.filter((_, idx) => idx !== i)) }} 
                          className="p-3 rounded-2xl bg-red-500/80 text-white"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <Plus className="w-6 h-6 text-white/20 group-hover:text-primary" />
                      </div>
                      <span className="text-[10px] font-black text-white/10 tracking-[0.2em] group-hover:text-primary/40 text-center px-4 uppercase">Upload Object/Style Ref</span>
                    </>
                  )}
                </div>
              ))}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>
          </section>

          <button 
            onClick={handleGenerate}
            disabled={isLoading || !selectedModelId || !campaignName}
            className="w-full py-7 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white font-black text-xl transition-all shadow-[0_30px_60px_rgba(139,92,246,0.4)] flex items-center justify-center gap-5 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {isLoading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <Sparkles className="w-7 h-7 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
            )}
            <span className="tracking-widest uppercase font-black">
              {isLoading ? (status || "ENGINEERING...") : "GENERATE MASTERPIECE"}
            </span>
          </button>
        </div>

        {/* Right Side: Platform-Specific Preview */}
        <div className="xl:col-span-5 relative h-full">
          <div className="sticky top-10 space-y-8 h-fit">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Live Simulation</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-white/60 uppercase">{selectedPlatform} UI</span>
              </div>
            </div>

            {/* Premium Two-Version Selector */}
            {isSuccess && (versionA || versionB) && (
              <div className="grid grid-cols-2 gap-4 p-2 bg-white/5 backdrop-blur-xl rounded-[2.2rem] border border-white/10 shadow-2xl animate-fade-in relative z-20">
                <button
                  onClick={() => handleVersionChange("A")}
                  disabled={!versionA}
                  className={cn(
                    "flex flex-col items-start text-left p-3.5 rounded-[1.7rem] transition-all duration-300 relative group overflow-hidden border disabled:opacity-50 disabled:cursor-not-allowed",
                    selectedVersion === "A"
                      ? "bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-primary/40 shadow-lg shadow-primary/10"
                      : "bg-transparent border-transparent hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    {versionA?.imageUrl ? (
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/15 flex-shrink-0">
                        <img src={versionA.imageUrl} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black uppercase tracking-wider text-white">Version A</span>
                        <span className="text-[8px] font-black uppercase tracking-widest bg-primary/20 text-primary px-1.5 py-0.5 rounded">EDITORIAL</span>
                      </div>
                      <p className="text-[10px] text-white/40 font-bold truncate mt-0.5">High-Fashion / Studio Pro</p>
                    </div>
                  </div>
                  {selectedVersion === "A" && (
                    <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => handleVersionChange("B")}
                  disabled={!versionB}
                  className={cn(
                    "flex flex-col items-start text-left p-3.5 rounded-[1.7rem] transition-all duration-300 relative group overflow-hidden border disabled:opacity-50 disabled:cursor-not-allowed",
                    selectedVersion === "B"
                      ? "bg-gradient-to-br from-secondary/20 via-secondary/5 to-transparent border-secondary/40 shadow-lg shadow-secondary/10"
                      : "bg-transparent border-transparent hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    {versionB?.imageUrl ? (
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/15 flex-shrink-0">
                        <img src={versionB.imageUrl} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 text-secondary animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-secondary/30" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black uppercase tracking-wider text-white">Version B</span>
                        <span className="text-[8px] font-black uppercase tracking-widest bg-secondary/20 text-secondary px-1.5 py-0.5 rounded">CANDID</span>
                      </div>
                      <p className="text-[10px] text-white/40 font-bold truncate mt-0.5">Candid / Warm Streetstyle</p>
                    </div>
                  </div>
                  {selectedVersion === "B" && (
                    <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  )}
                </button>
              </div>
            )}

            {/* REALISTIC PREVIEWS */}
            <div className="relative">
              {/* Instagram Style */}
              {selectedPlatform === "instagram" && (
                <div className="bg-black rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                  <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-black p-[2px]">
                          <img src={selectedModel?.portrait_url || ""} className="w-full h-full rounded-full object-cover" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{selectedModel?.name || "identity"}</p>
                        <p className="text-[10px] text-white/50">Sponsored</p>
                      </div>
                    </div>
                    <MoreVertical className="w-4 h-4 text-white" />
                  </div>
                  <div className={cn("bg-white/5 relative", selectedFormat === "1:1" ? "aspect-square" : selectedFormat === "9:16" ? "aspect-[9/16]" : selectedFormat === "4:5" ? "aspect-[4/5]" : "aspect-[1.91/1]")}>
                    {isLoading ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-md z-10">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest text-center px-8">{status || "Neural Rendering..."}</p>
                       </div>
                    ) : generatedImage ? (
                      <div className="relative group/result h-full w-full">
                        <img src={generatedImage} className="w-full h-full object-cover" />
                        
                        {/* Comparison Overlay (Hover to see reference) */}
                        <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover/result:opacity-100 transition-opacity">
                          {selectedModel?.portrait_url && (
                            <div className="w-16 h-16 rounded-xl border-2 border-white overflow-hidden shadow-2xl">
                              <img src={selectedModel.portrait_url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><span className="text-[6px] font-black text-white uppercase">Ref</span></div>
                            </div>
                          )}
                          {referenceImages[0] && (
                            <div className="w-16 h-16 rounded-xl border-2 border-emerald-500 overflow-hidden shadow-2xl">
                              <img src={referenceImages[0]} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><span className="text-[6px] font-black text-white uppercase text-emerald-400">Prod</span></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <Camera className="w-20 h-20" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Heart className="w-6 h-6 hover:text-red-500 transition-colors cursor-pointer" />
                        <MessageCircle className="w-6 h-6 hover:text-white/60 transition-colors cursor-pointer" />
                        <Send className="w-6 h-6 hover:text-white/60 transition-colors cursor-pointer" />
                      </div>
                      <Bookmark className="w-6 h-6 hover:text-white/60 transition-colors cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-white">4,285 likes</p>
                      <div className="text-xs leading-relaxed">
                        <span className="font-black mr-2">{selectedModel?.name || "identity"}</span>
                        <span className="text-white/90 line-clamp-2">{caption || "Generate a caption..."}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TikTok Style */}
              {selectedPlatform === "tiktok" && (
                <div className="bg-black rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl relative aspect-[9/16] max-h-[800px] mx-auto w-full max-w-[450px]">
                  {isLoading ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black/60 backdrop-blur-xl">
                        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                        <p className="text-xs font-black text-cyan-400 uppercase tracking-widest text-center px-10">{status || "Processing Reel..."}</p>
                     </div>
                  ) : generatedImage ? (
                    <img src={generatedImage} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <Music className="w-32 h-32" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 gap-6">
                    <div className="flex items-end justify-between">
                      <div className="flex-1 space-y-4 pr-16">
                        <p className="font-black text-sm">@{selectedModel?.name || "identity"}</p>
                        <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">{caption || "Your viral caption..."}</p>
                        <div className="flex items-center gap-2">
                           <Music className="w-3 h-3 animate-spin-slow" />
                           <p className="text-[10px] font-bold">Original Sound - {selectedModel?.name || "AI"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-6 items-center">
                        <div className="relative">
                           <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-xl">
                              <img src={selectedModel?.portrait_url || ""} className="w-full h-full object-cover" />
                           </div>
                           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                              <Plus className="w-3 h-3 text-white" />
                           </div>
                        </div>
                        <div className="flex flex-col items-center gap-1"><Heart className="w-8 h-8 fill-white" /><span className="text-[10px] font-black">12.5k</span></div>
                        <div className="flex flex-col items-center gap-1"><MessageSquare className="w-8 h-8 fill-white" /><span className="text-[10px] font-black">428</span></div>
                        <div className="flex flex-col items-center gap-1"><Bookmark className="w-8 h-8 fill-white" /><span className="text-[10px] font-black">3,1k</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LinkedIn Style */}
              {selectedPlatform === "linkedin" && (
                <div className="bg-[#1b1f23] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                  <div className="p-4 flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                      <img src={selectedModel?.portrait_url || ""} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-black text-white hover:text-blue-400 cursor-pointer">{selectedModel?.name || "Identity"}</p>
                          <span className="text-white/40 text-[10px] font-bold">• 2nd</span>
                        </div>
                        <MoreVertical className="w-4 h-4 text-white/40" />
                      </div>
                      <p className="text-[10px] text-white/60 font-medium line-clamp-1">AI Digital Influencer & Brand Ambassador</p>
                      <div className="flex items-center gap-1 text-[10px] text-white/40">
                         <span>2h • </span>
                         <Globe className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-3">
                    <p className="text-xs text-white/90 leading-relaxed whitespace-pre-wrap">{caption || "Configure your professional update..."}</p>
                  </div>
                  <div className={cn("bg-white/2 relative border-y border-white/5", selectedFormat === "1:1" ? "aspect-square" : "aspect-[1.91/1]")}>
                    {isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-10 text-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-2" /><p className="text-[10px] font-black text-blue-500 uppercase">{status}</p></div>
                    ) : generatedImage ? (
                      <img src={generatedImage} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-5"><Users className="w-24 h-24" /></div>
                    )}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-1">
                       <div className="flex -space-x-1">
                          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center ring-1 ring-black"><ThumbsUp className="w-2.5 h-2.5 fill-white" /></div>
                          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center ring-1 ring-black"><Heart className="w-2.5 h-2.5 fill-white" /></div>
                       </div>
                       <span className="text-[10px] text-white/40 ml-1">428 reactions</span>
                    </div>
                    <span className="text-[10px] text-white/40">12 comments • 5 reposts</span>
                  </div>
                  <div className="px-2 py-1 flex items-center justify-around">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-bold text-xs">
                      <ThumbsUp className="w-4 h-4" /> <span>Like</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-bold text-xs">
                      <MessageIcon className="w-4 h-4" /> <span>Comment</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-bold text-xs">
                      <Repeat2 className="w-4 h-4" /> <span>Repost</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-bold text-xs">
                      <Navigation className="w-4 h-4 rotate-45" /> <span>Send</span>
                    </button>
                  </div>
                </div>
              )}

              {/* X / Twitter Style */}
              {selectedPlatform === "x" && (
                <div className="bg-black rounded-[2rem] border border-white/10 p-6 shadow-2xl space-y-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 overflow-hidden flex-shrink-0">
                      <img src={selectedModel?.portrait_url || ""} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <p className="font-black text-sm">{selectedModel?.name || "Identity"}</p>
                          <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="text-white/40 text-xs ml-1">@{selectedModel?.name?.toLowerCase().replace(/\s+/g, '') || "identity"} • 2h</span>
                        </div>
                        <MoreVertical className="w-4 h-4 text-white/40" />
                      </div>
                      <p className="text-sm leading-relaxed text-white/90">{caption || "Wait for the magic..."}</p>
                    </div>
                  </div>
                  
                  <div className={cn("bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative", selectedFormat === "1:1" ? "aspect-square" : "aspect-[16/9]")}>
                    {isLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md z-10"><Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-2" /><p className="text-[10px] font-black text-blue-400 uppercase">{status}</p></div>
                    ) : generatedImage ? (
                      <img src={generatedImage} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-5"><Send className="w-24 h-24" /></div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between px-2 text-white/40 pt-2">
                    <div className="flex items-center gap-1 hover:text-blue-400 cursor-pointer group">
                      <div className="p-2 rounded-full group-hover:bg-blue-400/10"><MessageCircle className="w-4 h-4" /></div>
                      <span className="text-[10px] font-bold">128</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-green-400 transition-colors cursor-pointer group">
                      <div className="p-2 rounded-full group-hover:bg-green-400/10"><Repeat2 className="w-4 h-4" /></div>
                      <span className="text-[10px] font-bold">42</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-pink-500 transition-colors cursor-pointer group">
                      <div className="p-2 rounded-full group-hover:bg-pink-500/10"><Heart className="w-4 h-4" /></div>
                      <span className="text-[10px] font-bold">3,5k</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Bookmark className="w-4 h-4 hover:text-blue-400 cursor-pointer" />
                      <Share2 className="w-4 h-4 hover:text-blue-400 cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}

              {/* Facebook Style */}
              {selectedPlatform === "facebook" && (
                <div className="bg-[#242526] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                   <div className="p-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                          <img src={selectedModel?.portrait_url || ""} className="w-full h-full object-cover" />
                       </div>
                       <div>
                         <p className="text-sm font-black text-white">{selectedModel?.name || "Identity"}</p>
                         <div className="flex items-center gap-1 text-white/40 text-[10px] font-bold">
                           <span>2h • </span>
                           <Globe className="w-2.5 h-2.5" />
                         </div>
                       </div>
                     </div>
                     <MoreVertical className="w-5 h-5 text-white/40" />
                   </div>
                   <div className="px-4 pb-4">
                      <p className="text-xs text-white/90 leading-relaxed">{caption || "Share your story..."}</p>
                   </div>
                   <div className={cn("bg-white/2 relative border-y border-white/5", selectedFormat === "1:1" ? "aspect-square" : "aspect-[16/9]")}>
                      {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md z-10"><Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-2" /><p className="text-[10px] font-black text-blue-600 uppercase">{status}</p></div>
                      ) : generatedImage ? (
                        <img src={generatedImage} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-5"><Globe className="w-24 h-24" /></div>
                      )}
                   </div>
                   <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                         <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center"><ThumbsUp className="w-2.5 h-2.5 fill-white" /></div>
                         <span className="text-[10px] text-white/40">1.2k</span>
                      </div>
                      <span className="text-[10px] text-white/40">24 comments • 8 shares</span>
                   </div>
                   <div className="px-2 py-1 flex items-center">
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-bold text-xs">
                        <ThumbsUp className="w-4 h-4" /> <span>Like</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-bold text-xs">
                        <MessageIcon className="w-4 h-4" /> <span>Comment</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-bold text-xs">
                        <Share className="w-4 h-4" /> <span>Share</span>
                      </button>
                   </div>
                </div>
              )}

              {/* Pinterest Style */}
              {selectedPlatform === "pinterest" && (
                <div className="max-w-[320px] mx-auto bg-black rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl relative group">
                   <div className={cn("bg-white/5 relative", selectedFormat === "9:16" ? "aspect-[9/16]" : "aspect-[2/3]")}>
                      {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md z-10"><Loader2 className="w-10 h-10 animate-spin text-red-600 mb-2" /><p className="text-[10px] font-black text-red-600 uppercase">{status}</p></div>
                      ) : generatedImage ? (
                        <img src={generatedImage} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-5"><Palette className="w-24 h-24" /></div>
                      )}
                      {/* Pinterest Save Button */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="px-6 py-2.5 rounded-full bg-red-600 text-white font-black text-sm">Save</button>
                      </div>
                   </div>
                   <div className="p-5 space-y-3">
                      <p className="font-bold text-sm leading-tight text-white line-clamp-2">{caption?.split('\n')[0] || "Discover something new..."}</p>
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                           <img src={selectedModel?.portrait_url || ""} className="w-full h-full object-cover" />
                         </div>
                         <div>
                            <p className="text-xs font-black text-white">{selectedModel?.name || "Identity"}</p>
                            <p className="text-[10px] text-white/40 font-medium">12.5k followers</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Post Actions */}
            {isSuccess && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Visual Header */}
                <div className="p-4.5 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Asset Ready</h4>
                    <p className="text-[10px] text-white/40">Select how you want to catalog this generated post.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleSave("draft")}
                    disabled={isSaving}
                    className="py-4.5 rounded-[1.8rem] bg-white/5 backdrop-blur-3xl text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-white/60" /> : <Layers className="w-4 h-4 text-white/60" />}
                    <span>SAVE DRAFT</span>
                  </button>

                  {connectedPlatforms.length > 0 ? (
                    <button 
                      onClick={() => setShowScheduleForm(!showScheduleForm)}
                      className={cn(
                        "py-4.5 rounded-[1.8rem] text-white font-black text-xs uppercase tracking-widest transition-all border flex items-center justify-center gap-2.5",
                        showScheduleForm
                          ? "bg-secondary border-secondary shadow-lg shadow-secondary/20"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      <Calendar className="w-4 h-4 text-white/80" />
                      <span>SCHEDULE</span>
                    </button>
                  ) : (
                    <div className="py-4.5 rounded-[1.8rem] text-white/30 font-black text-xs uppercase tracking-widest border border-white/5 bg-white/2 flex items-center justify-center gap-2.5 cursor-not-allowed" title="Connect a social account to schedule">
                      <Calendar className="w-4 h-4 opacity-50" />
                      <span>SCHEDULE</span>
                    </div>
                  )}
                </div>

                {/* Scheduling Controller Card */}
                {showScheduleForm && (
                  <div className="p-6 rounded-[2.2rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/10 shadow-2xl space-y-6 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4 text-secondary" />
                        <span>Schedule Publication</span>
                      </h4>
                      <span className="text-[8px] font-black uppercase text-secondary bg-secondary/15 px-2 py-0.5 rounded-full">Automated</span>
                    </div>

                    <div className="space-y-4">
                      {/* Publish Timing Options Selector */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Publish timing</label>
                        <div className="grid grid-cols-2 gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                          <button
                            type="button"
                            onClick={() => setPublishOption("now")}
                            className={cn(
                              "py-2.5 rounded-xl font-bold text-xs uppercase transition-all",
                              publishOption === "now"
                                ? "bg-white text-black shadow-md"
                                : "text-white/60 hover:text-white"
                            )}
                          >
                            Publish Now
                          </button>
                          <button
                            type="button"
                            onClick={() => setPublishOption("later")}
                            className={cn(
                              "py-2.5 rounded-xl font-bold text-xs uppercase transition-all",
                              publishOption === "later"
                                ? "bg-white text-black shadow-md"
                                : "text-white/60 hover:text-white"
                            )}
                          >
                            Schedule Later
                          </button>
                        </div>
                      </div>

                      {/* Date & Time Selectors */}
                      {publishOption === "later" && (
                        <div className="grid grid-cols-2 gap-4 animate-fade-in">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Target Date</label>
                            <input
                              type="date"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              onClick={(e) => { try { (e.target as any).showPicker(); } catch (err) {} }}
                              onFocus={(e) => { try { (e.target as any).showPicker(); } catch (err) {} }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-secondary/50 text-white font-semibold cursor-pointer"
                              style={{ colorScheme: "dark" }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Target Time</label>
                            <input
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                              onClick={(e) => { try { (e.target as any).showPicker(); } catch (err) {} }}
                              onFocus={(e) => { try { (e.target as any).showPicker(); } catch (err) {} }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-secondary/50 text-white font-semibold cursor-pointer"
                              style={{ colorScheme: "dark" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Schedule Generation Save Action */}
                    <button
                      type="button"
                      onClick={() => handleSave("scheduled")}
                      disabled={isSaving || (publishOption === "later" && (!scheduleDate || !scheduleTime))}
                      className="w-full py-4 rounded-2xl bg-secondary hover:bg-secondary-dark text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      <span>{publishOption === "now" ? "PUBLISH INSTANTLY" : "QUEUE SCHEDULED MASTERPIECE"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Glassmorphic Success Dialog */}
      {showSuccessDialog && dialogConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in animate-duration-300">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-[3rem] p-8 max-w-md w-full shadow-2xl relative space-y-6 text-center backdrop-blur-2xl">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight text-white">{dialogConfig.title}</h3>
              <p className="text-sm text-white/60 font-medium leading-relaxed">{dialogConfig.description}</p>
            </div>

            {dialogConfig.type === "scheduled" && dialogConfig.scheduledAt && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1">
                <span className="text-[8px] font-black uppercase text-white/40 tracking-wider">Scheduled Target</span>
                <p className="text-xs font-black text-secondary uppercase">
                  {new Date(dialogConfig.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-[10px] text-white/60">
                  Time: {new Date(dialogConfig.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setShowSuccessDialog(false);
                setDialogConfig(null);
              }}
              className="w-full py-4 rounded-2xl bg-white hover:bg-white/90 text-black font-black text-xs uppercase tracking-widest transition-all"
            >
              Okay, Back to Studio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
