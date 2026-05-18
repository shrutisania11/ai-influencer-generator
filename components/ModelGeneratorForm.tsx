"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  UserPlus, 
  Sparkles, 
  Palette, 
  Smile, 
  Camera, 
  Layers, 
  Type,
  ChevronRight,
  Zap
} from "lucide-react";
import { cn } from "@/utils/cn";

interface ModelGeneratorFormProps {
  onGenerate: (data: any) => void;
  isGenerating: boolean;
}

const GENDERS = [
  { id: "female", label: "Female", emoji: "👩" },
  { id: "male", label: "Male", emoji: "👨" },
];

const BODY_TYPES = [
  { id: "slim", label: "Slim" },
  { id: "athletic", label: "Athletic" },
  { id: "curvy", label: "Curvy" },
  { id: "muscular", label: "Muscular" },
  { id: "plus_size", label: "Plus Size" },
];

const SKIN_TONES = [
  { id: "fair", label: "Fair", hex: "#fdf5e6" },
  { id: "light", label: "Light", hex: "#f3d9c1" },
  { id: "medium", label: "Medium", hex: "#d2b48c" },
  { id: "tan", label: "Tan", hex: "#a0522d" },
  { id: "dark", label: "Dark", hex: "#5d4037" },
  { id: "deep", label: "Deep", hex: "#3e2723" },
];

const AGE_RANGES = [
  { id: "18-24", label: "18-24" },
  { id: "25-34", label: "25-34" },
  { id: "35-44", label: "35-44" },
  { id: "45+", label: "45+" },
];

const VIBES = [
  { id: "streetwear", label: "Streetwear", emoji: "👟" },
  { id: "minimalist", label: "Minimalist", emoji: "⚪" },
  { id: "luxury", label: "Luxury", emoji: "💎" },
  { id: "boho", label: "Boho", emoji: "🌿" },
  { id: "sporty", label: "Sporty", emoji: "🎾" },
  { id: "cyberpunk", label: "Cyberpunk", emoji: "⚡" },
];

const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "Silver", "Pink", "Blue"];
const HAIR_STYLES = ["Long Straight", "Wavy", "Curly", "Short Pixie", "Bob Cut", "Braids", "Bald"];
const EYE_COLORS = ["Brown", "Blue", "Green", "Hazel", "Grey", "Amber"];

export default function ModelGeneratorForm({ onGenerate, isGenerating }: ModelGeneratorFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    gender: "female",
    bodyType: "athletic",
    skinTone: "medium",
    ageRange: "25-34",
    hairColor: "Brown",
    hairStyle: "Long Straight",
    eyeColor: "Brown",
    vibe: "streetwear",
    prompt: ""
  });

  // Update prompt automatically based on selection
  useEffect(() => {
    const { gender, bodyType, skinTone, ageRange, hairColor, hairStyle, eyeColor, vibe } = formData;
    const newPrompt = `A stunning ${ageRange} year old ${gender} AI influencer with ${bodyType} body type and ${skinTone} skin tone. She has ${hairStyle} ${hairColor} hair and ${eyeColor} eyes. Her style is ${vibe}. High fashion photography, cinematic lighting, ultra-realistic.`;
    setFormData(prev => ({ ...prev, prompt: newPrompt }));
  }, [formData.gender, formData.bodyType, formData.skinTone, formData.ageRange, formData.hairColor, formData.hairStyle, formData.eyeColor, formData.vibe]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
      {/* Section: Basic Info */}
      <div className="glass p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Type className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Identity</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60 ml-1">Influencer Name</label>
          <input 
            type="text" 
            placeholder="e.g. Luna Sky"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder:text-white/20"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60 ml-1">Gender</label>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: g.id })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                    formData.gender === g.id 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                  )}
                >
                  <span>{g.emoji}</span>
                  <span className="text-sm font-medium">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60 ml-1">Age Range</label>
            <select 
              value={formData.ageRange}
              onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none text-white appearance-none cursor-pointer"
            >
              {AGE_RANGES.map(a => <option key={a.id} value={a.id} className="bg-[#0f0f15]">{a.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section: Physical Traits */}
      <div className="glass p-8 rounded-3xl border border-white/10 space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Smile className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold">Physical Appearance</h2>
        </div>

        {/* Body Type */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/60 ml-1">Body Type</label>
          <div className="flex flex-wrap gap-2">
            {BODY_TYPES.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setFormData({ ...formData, bodyType: b.id })}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm transition-all",
                  formData.bodyType === b.id 
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400" 
                    : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skin Tone */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/60 ml-1">Skin Tone</label>
          <div className="flex items-center gap-4">
            {SKIN_TONES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFormData({ ...formData, skinTone: s.id })}
                className={cn(
                  "w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center",
                  formData.skinTone === s.id ? "border-white scale-110 shadow-lg" : "border-transparent"
                )}
                title={s.label}
              >
                <div className="w-7 h-7 rounded-full" style={{ backgroundColor: s.hex }} />
              </button>
            ))}
          </div>
        </div>

        {/* Hair & Eyes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60 ml-1">Hair Style</label>
            <select 
              value={formData.hairStyle}
              onChange={(e) => setFormData({ ...formData, hairStyle: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer"
            >
              {HAIR_STYLES.map(h => <option key={h} value={h} className="bg-[#0f0f15]">{h}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60 ml-1">Hair Color</label>
            <select 
              value={formData.hairColor}
              onChange={(e) => setFormData({ ...formData, hairColor: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer"
            >
              {HAIR_COLORS.map(h => <option key={h} value={h} className="bg-[#0f0f15]">{h}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60 ml-1">Eye Color</label>
            <select 
              value={formData.eyeColor}
              onChange={(e) => setFormData({ ...formData, eyeColor: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer"
            >
              {EYE_COLORS.map(e => <option key={e} value={e} className="bg-[#0f0f15]">{e}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section: Aesthetic */}
      <div className="glass p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Palette className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold">Vibe & Aesthetic</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {VIBES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setFormData({ ...formData, vibe: v.id })}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                formData.vibe === v.id 
                  ? "bg-purple-500/20 border-purple-500/50 text-white" 
                  : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
              )}
            >
              <span className="text-lg">{v.emoji}</span>
              <span className="text-sm font-medium">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section: Prompt Builder */}
      <div className="glass p-8 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold">Prompt Builder</h2>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">
            Auto-Generated
          </span>
        </div>

        <textarea 
          value={formData.prompt}
          onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-white/80 text-sm leading-relaxed"
        />

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-wider">
            Cost: 50 Credits
          </div>
          
          <button 
            type="submit"
            disabled={isGenerating || !formData.name}
            className={cn(
              "flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl",
              isGenerating || !formData.name
                ? "bg-white/10 text-white/20 cursor-not-allowed"
                : "bg-white text-black hover:bg-white/90 active:scale-95 shadow-white/10"
            )}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Influencer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
