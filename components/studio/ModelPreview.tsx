"use client";

import { User, ShieldCheck, Sparkles, Download, Share2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface ModelPreviewProps {
  isLoading: boolean;
  isGenerated: boolean;
  influencerName: string;
  portraitUrl?: string;
  fullBodyUrl?: string;
  status?: string;
  onSave?: () => void;
  isSaving?: boolean;
}

export default function ModelPreview({
  isLoading,
  isGenerated,
  influencerName,
  portraitUrl,
  fullBodyUrl,
  status,
  onSave,
  isSaving
}: ModelPreviewProps) {
  if (isLoading) {
    return (
      <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/10 border-dashed animate-pulse">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-primary animate-spin" />
        </div>
        <h3 className="text-xl font-bold">Generating {influencerName || "Influencer"}...</h3>
        <p className="text-primary font-medium mt-2">{status || "Processing..."}</p>
        <p className="text-white/40 text-center mt-4 max-w-xs text-sm">
          Our AI is meticulously crafting your influencer's unique look. This usually takes 30-60 seconds.
        </p>
      </div>
    );
  }

  if (!isGenerated) {
    return (
      <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/10 border-dashed group">
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
          <User className="w-10 h-10 text-white/20" />
        </div>
        <h3 className="text-xl font-bold">Preview Ready</h3>
        <p className="text-white/40 text-center mt-2 max-w-xs">
          Configure your influencer attributes and click "Generate" to see the magic happen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Identity Card */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-lg">
            {influencerName?.[0]?.toUpperCase() || "I"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{influencerName || "New Influencer"}</h3>
              <ShieldCheck className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-xs text-white/40">Verified AI Identity</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Portrait Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white/60">Portrait Shot</span>
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold">HD Face</span>
        </div>
        <div className="aspect-square rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative group">
          <img 
            src={portraitUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"} 
            alt="Portrait" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
            <p className="text-xs text-white/80">Face detail & expression check</p>
          </div>
        </div>
      </div>

      {/* Full Body Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white/60">Full Body Shot</span>
          <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">Studio Style</span>
        </div>
        <div className="aspect-[3/4] rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative group">
          <img 
            src={fullBodyUrl || "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800"} 
            alt="Full Body" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
            <p className="text-xs text-white/80">Outfit & physique visualization</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {onSave && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full py-5 rounded-3xl bg-secondary hover:bg-secondary-dark text-white font-bold text-lg transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isSaving ? (
            <Sparkles className="w-5 h-5 animate-spin" />
          ) : (
            <ShieldCheck className="w-5 h-5" />
          )}
          <span>{isSaving ? "Saving to Studio..." : "Save to My Models"}</span>
        </button>
      )}
    </div>
  );
}
