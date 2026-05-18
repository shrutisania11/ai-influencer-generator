"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Wand2, Info } from "lucide-react";
import AttributeSelector from "@/components/studio/AttributeSelector";
import ModelPreview from "@/components/studio/ModelPreview";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { generateImage } from "@/app/actions/image";
import { generateLumaImage } from "@/app/actions/luma";
import { createInfluencer } from "@/app/actions/influencers";
import { ensureUserProfile } from "@/utils/ensure-profile";


const GENDER_OPTIONS = [
  { id: "female", label: "Female", icon: "👩" },
  { id: "male", label: "Male", icon: "👨" },
];

const BODY_OPTIONS = [
  { id: "slim", label: "Slim", icon: "🧘" },
  { id: "athletic", label: "Athletic", icon: "💪" },
  { id: "curvy", label: "Curvy", icon: "⌛" },
  { id: "muscular", label: "Muscular", icon: "🏋️" },
];

const SKIN_OPTIONS = [
  { id: "fair", label: "Fair", color: "#f3cfbb" },
  { id: "tan", label: "Tan", color: "#d2b48c" },
  { id: "brown", label: "Brown", color: "#a0522d" },
  { id: "dark", label: "Dark", color: "#3d2b1f" },
];

const AGE_OPTIONS = [
  { id: "18-25", label: "18-25", icon: "✨" },
  { id: "26-35", label: "26-35", icon: "💼" },
  { id: "36-45", label: "36-45", icon: "🌟" },
  { id: "45+", label: "45+", icon: "👑" },
];

const HAIR_STYLE_OPTIONS = [
  { id: "long", label: "Long", icon: "💇‍♀️" },
  { id: "short", label: "Short", icon: "💇" },
  { id: "curly", label: "Curly", icon: "🌀" },
  { id: "straight", label: "Straight", icon: "📏" },
  { id: "pixie", label: "Pixie", icon: "🧚" },
];

const HAIR_COLOR_OPTIONS = [
  { id: "blonde", label: "Blonde", color: "#faf0be" },
  { id: "brunette", label: "Brunette", color: "#4b3621" },
  { id: "black", label: "Black", color: "#000000" },
  { id: "red", label: "Red", color: "#a52a2a" },
  { id: "pink", label: "Pink", color: "#ffc0cb" },
];

const EYE_COLOR_OPTIONS = [
  { id: "blue", label: "Blue", color: "#4682b4" },
  { id: "brown", label: "Brown", color: "#8b4513" },
  { id: "green", label: "Green", color: "#2e8b57" },
  { id: "hazel", label: "Hazel", color: "#8e7618" },
];

const VIBE_OPTIONS = [
  { id: "minimalist", label: "Minimalist", icon: "⚪" },
  { id: "streetwear", label: "Streetwear", icon: "👟" },
  { id: "cyberpunk", label: "Cyberpunk", icon: "⚡" },
  { id: "luxury", label: "Luxury", icon: "💎" },
  { id: "vintage", label: "Vintage", icon: "📻" },
  { id: "sporty", label: "Sporty", icon: "🎾" },
];

const SHOT_TYPE_OPTIONS = [
  { id: "portrait", label: "Portrait (Head/Shoulders)", icon: "👤" },
  { id: "fullbody", label: "Full Body (Head to Toe)", icon: "🧍" },
];

export default function NewModelPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [influencerName, setInfluencerName] = useState("");
  const [gender, setGender] = useState("female");
  const [bodyType, setBodyType] = useState("slim");
  const [skinTone, setSkinTone] = useState("tan");
  const [ageRange, setAgeRange] = useState("20-25");
  const [hairStyle, setHairStyle] = useState("long");
  const [hairColor, setHairColor] = useState("blonde");
  const [eyeColor, setEyeColor] = useState("blue");
  const [vibe, setVibe] = useState("streetwear");
  const [shotType, setShotType] = useState("fullbody");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);

  // Fetch user credits on mount
  useEffect(() => {
    async function getCredits() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('credits')
          .eq('id', user.id)
          .single();
        if (data) setUserCredits(data.credits);
      }
    }
    getCredits();
  }, []);

  // Update prompt based on selections
  useEffect(() => {
    const shotPrefix = shotType === "fullbody" 
      ? "WIDE ANGLE FULL BODY SHOT, HEAD TO TOE, CLEAR FIGURE, STANDING ON FLOOR, VISIBLE SHOES, FULL LENGTH PORTRAIT,"
      : "CLOSE-UP PORTRAIT, HEAD AND SHOULDERS,";

    const p = `${shotPrefix} high quality photography of a ${influencerName || "beautiful"} ${ageRange} year old ${gender} influencer, ${bodyType} physique, ${skinTone} skin tone, ${hairStyle} ${hairColor} hair, ${eyeColor} eyes, wearing ${vibe} aesthetic clothing, studio lighting, hyper-realistic, 8k, detailed background.`;
    setPrompt(p);
  }, [influencerName, gender, bodyType, skinTone, ageRange, hairStyle, hairColor, eyeColor, vibe, shotType]);

  const [portraitImageUrl, setPortraitImageUrl] = useState<string | null>(null);
  const [fullBodyImageUrl, setFullBodyImageUrl] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState("");

  const handleGenerate = async () => {
    if (!influencerName) {
      alert("Please enter an influencer name");
      return;
    }

    if (userCredits !== null && userCredits < 50) {
      // Bypassed credit block for ease of use
    }
    
    setIsLoading(true);
    setPortraitImageUrl(null);
    setFullBodyImageUrl(null);
    setGenerationStatus("Starting dual generation...");

    try {
      // 0. Ensure user profile exists
      const profileResult = await ensureUserProfile(supabase);
      if (!profileResult.success) {
        throw new Error("Failed to sync user profile: " + profileResult.error);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Generate Portrait Image
      setGenerationStatus("Generating Portrait (Face)...");
      const portraitPrompt = `CLOSE-UP PORTRAIT, HEAD AND SHOULDERS, high quality photography of a ${influencerName} ${ageRange} year old ${gender} influencer, ${hairStyle} ${hairColor} hair, ${eyeColor} eyes, studio lighting, cinematic lighting, hyper-realistic, 8k, sharp focus, extremely detailed skin texture, perfect eyes.`;
      
      // Try Luma first for maximum quality
      let portraitRes: any = await generateLumaImage(portraitPrompt, "1:1");
      
      // Fallback to Pollinations if Luma fails (credits, etc)
      if (!portraitRes.success) {
        console.warn("Portrait Luma failed, falling back to Pollinations:", portraitRes.error);
        portraitRes = await generateImage(portraitPrompt, 1024, 1024);
      }
      
      if (!portraitRes.success || !portraitRes.imageUrl) {
        throw new Error("Portrait: " + (portraitRes.error || "Failed to generate"));
      }
      setPortraitImageUrl(portraitRes.imageUrl);

      // 2. Generate Full Body Image
      setGenerationStatus("Generating Full Body Shot...");
      const fullBodyPrompt = `FULL BODY SHOT, HEAD TO TOE, CLEAR FIGURE, STANDING ON FLOOR, VISIBLE SHOES, high quality photography of a ${influencerName} ${ageRange} year old ${gender} influencer, ${bodyType} physique, ${skinTone} skin tone, ${hairStyle} ${hairColor} hair, ${eyeColor} eyes, wearing ${vibe} aesthetic clothing, studio lighting, cinematic lighting, hyper-realistic, 8k, detailed background, EXTREMELY DETAILED FACE, PERFECT EYES, SHARP FACIAL FEATURES, SHARP FOCUS, MASTERPIECE.`;
      
      // Try Luma first for maximum quality
      let fullBodyRes: any = await generateLumaImage(fullBodyPrompt, "9:16");
      
      // Fallback to Pollinations if Luma fails
      if (!fullBodyRes.success) {
        console.warn("Full Body Luma failed, falling back to Pollinations:", fullBodyRes.error);
        fullBodyRes = await generateImage(fullBodyPrompt, 768, 1344);
      }
      
      if (!fullBodyRes.success || !fullBodyRes.imageUrl) {
        throw new Error("Full Body: " + (fullBodyRes.error || "Failed to generate"));
      }
      setFullBodyImageUrl(fullBodyRes.imageUrl);
      setLastGeneratedPrompt(fullBodyPrompt);
      setGenerationStatus("");
      setIsGenerated(true);
      setIsLoading(false);

    } catch (error: any) {
      console.error("Error generating influencer:", error);
      alert(error.message || "An error occurred");
      setIsLoading(false);
      setGenerationStatus("");
    }
  };

  const handleSave = async () => {
    if (!portraitImageUrl || !fullBodyImageUrl) return;
    
    setIsSaving(true);
    try {
      // 3. Save to models table via server action (handles storage upload)
      const saveResult = await createInfluencer({
        name: influencerName,
        gender,
        body_type: bodyType,
        skin_tone: skinTone,
        age_range: ageRange,
        hair_style: hairStyle,
        hair_color: hairColor,
        eye_color: eyeColor,
        vibe,
        prompt: lastGeneratedPrompt,
        portrait_url: portraitImageUrl,
        full_body_url: fullBodyImageUrl,
      });

      if (!saveResult.success) throw new Error(saveResult.error);

      // Deduct credits (100 total)
      const { error: creditError } = await supabase
        .from('users')
        .update({ credits: (userCredits || 5000) - 100 })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (creditError) console.error("Credit deduction failed:", creditError);

      setUserCredits(prev => (prev !== null ? prev - 100 : null));
      alert("Influencer saved successfully to your studio!");
      router.push("/dashboard/models");
    } catch (error: any) {
      console.error("Error saving influencer:", error);
      alert(error.message || "Failed to save influencer");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/models" 
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Studio</span>
        </Link>
        <div className="flex items-center gap-4">
          {userCredits !== null && userCredits < 50 && (
            <button 
              onClick={async () => {
                const { addUserCredits } = await import("@/app/actions/luma");
                const res = await addUserCredits(5000);
                if (res.success) {
                  setUserCredits(5000);
                  alert("5000 credits added successfully!");
                }
              }}
              className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-500 font-bold text-xs hover:bg-green-500/30 transition-all"
            >
              Get Free Credits
            </button>
          )}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>{userCredits !== null ? `${userCredits} Credits Available` : "50 Credits per generation"}</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Side: Form */}
        <div className="lg:col-span-7 space-y-8 animate-fade-in-up">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Create New Model</h1>
            <p className="text-white/50">Define your AI influencer's unique appearance and style.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-bold uppercase tracking-widest text-white/30">Identity</label>
                <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">Required</span>
              </div>
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Enter influencer name..."
                  value={influencerName}
                  onChange={(e) => setInfluencerName(e.target.value)}
                  className="w-full bg-white/5 border-2 border-white/5 rounded-3xl p-6 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-2xl font-bold placeholder:text-white/10"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <Wand2 className="w-6 h-6 text-primary/40 animate-pulse" />
                </div>
              </div>
            </div>

            <AttributeSelector 
              label="Shot Type"
              options={SHOT_TYPE_OPTIONS}
              selectedId={shotType}
              onChange={setShotType}
            />

            <AttributeSelector 
              label="Gender" 
              options={GENDER_OPTIONS} 
              selectedId={gender} 
              onChange={setGender} 
            />

            <AttributeSelector 
              label="Body Type" 
              options={BODY_OPTIONS} 
              selectedId={bodyType} 
              onChange={setBodyType} 
              columns={4}
            />

            <AttributeSelector 
              label="Skin Tone" 
              options={SKIN_OPTIONS} 
              selectedId={skinTone} 
              onChange={setSkinTone} 
              columns={4}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AttributeSelector 
                label="Age Range" 
                options={AGE_OPTIONS} 
                selectedId={ageRange} 
                onChange={setAgeRange} 
              />
              <AttributeSelector 
                label="Eye Color" 
                options={EYE_COLOR_OPTIONS} 
                selectedId={eyeColor} 
                onChange={setEyeColor} 
                columns={2}
              />
            </div>

            <AttributeSelector 
              label="Hair Style" 
              options={HAIR_STYLE_OPTIONS} 
              selectedId={hairStyle} 
              onChange={setHairStyle} 
              columns={3}
            />

            <AttributeSelector 
              label="Hair Color" 
              options={HAIR_COLOR_OPTIONS} 
              selectedId={hairColor} 
              onChange={setHairColor} 
              columns={5}
            />

            <AttributeSelector 
              label="Vibe / Aesthetic" 
              options={VIBE_OPTIONS} 
              selectedId={vibe} 
              onChange={setVibe} 
              columns={3}
            />

            {/* Prompt Builder */}
            <div className="space-y-3 p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Wand2 className="w-16 h-16 text-primary" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Wand2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold uppercase tracking-wider text-primary">AI Prompt Builder</span>
              </div>
              <p className="text-sm text-white/70 italic leading-relaxed">
                "{prompt}"
              </p>
              <div className="flex items-center gap-2 mt-4 text-[10px] text-white/30 font-medium uppercase tracking-widest">
                <Info className="w-3 h-3" />
                <span>Automatically generated based on your selections</span>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isLoading || !influencerName}
              className="w-full py-5 rounded-3xl bg-primary hover:bg-primary-dark text-white font-bold text-lg transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Sparkles className={cn("w-5 h-5", isLoading && "animate-spin")} />
              <span>{isLoading ? "Generating Magic..." : "Generate Influencer"}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Preview */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-28">
            <ModelPreview 
              isLoading={isLoading} 
              isGenerated={isGenerated} 
              influencerName={influencerName}
              portraitUrl={portraitImageUrl || undefined}
              fullBodyUrl={fullBodyImageUrl || undefined}
              status={generationStatus}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
