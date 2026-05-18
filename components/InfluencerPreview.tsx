"use client";

import { ImageIcon, Maximize2, Download, Share2, Sparkles } from "lucide-react";
import Image from "next/image";
import { cn } from "@/utils/cn";

interface InfluencerPreviewProps {
  portraitUrl?: string;
  fullBodyUrl?: string;
  isGenerating: boolean;
  name?: string;
}

export default function InfluencerPreview({ portraitUrl, fullBodyUrl, isGenerating, name }: InfluencerPreviewProps) {
  if (isGenerating) {
    return (
      <div className="glass rounded-[32px] border border-white/10 p-8 h-full flex flex-col items-center justify-center text-center space-y-8 min-h-[600px] animate-pulse">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-primary animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Generating {name || "Influencer"}...</h3>
          <p className="text-white/40 max-w-[280px]">Our AI is crafting the perfect look based on your specifications. This usually takes 15-30 seconds.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="aspect-[3/4] rounded-2xl bg-white/5 border border-white/10" />
          <div className="aspect-[3/4] rounded-2xl bg-white/5 border border-white/10" />
        </div>
      </div>
    );
  }

  if (!portraitUrl && !fullBodyUrl) {
    return (
      <div className="glass rounded-[32px] border border-white/10 p-8 h-full flex flex-col items-center justify-center text-center space-y-6 min-h-[600px]">
        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 rotate-12">
          <ImageIcon className="w-12 h-12 text-white/10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white/80">Preview Generation</h3>
          <p className="text-sm text-white/40 max-w-[240px]">Configure your model traits and click generate to see the results here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in h-full">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Generation Results</span>
        </h2>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-primary border-primary/20">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100%-60px)]">
        {/* Portrait Image */}
        <div className="group relative glass rounded-[24px] border border-white/10 overflow-hidden aspect-[3/4] flex items-center justify-center bg-surface">
          {portraitUrl ? (
            <>
              <img 
                src={portraitUrl} 
                alt="Portrait Preview" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between translate-y-4 group-hover:translate-y-0 transition-transform opacity-0 group-hover:opacity-100">
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">Portrait View</span>
                <button className="p-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/20 hover:bg-white/30 transition-all">
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-white/10 text-sm font-medium">Portrait Loading...</div>
          )}
        </div>

        {/* Full Body Image */}
        <div className="group relative glass rounded-[24px] border border-white/10 overflow-hidden aspect-[3/4] flex items-center justify-center bg-surface">
          {fullBodyUrl ? (
            <>
              <img 
                src={fullBodyUrl} 
                alt="Full Body Preview" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between translate-y-4 group-hover:translate-y-0 transition-transform opacity-0 group-hover:opacity-100">
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">Full Body View</span>
                <button className="p-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/20 hover:bg-white/30 transition-all">
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-white/10 text-sm font-medium">Full Body Loading...</div>
          )}
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/10 bg-primary/5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">Generation Successful</p>
          <p className="text-xs text-white/50 leading-relaxed">
            Your influencer <span className="text-white font-bold">{name}</span> has been created. You can now use this model to generate posts in the Studio.
          </p>
        </div>
      </div>
    </div>
  );
}
