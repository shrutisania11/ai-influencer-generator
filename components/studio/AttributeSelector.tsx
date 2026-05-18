"use client";

import { cn } from "@/utils/cn";

interface Option {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

interface AttributeSelectorProps {
  label: string;
  options: Option[];
  selectedId: string;
  onChange: (id: string) => void;
  columns?: number;
}

export default function AttributeSelector({
  label,
  options,
  selectedId,
  onChange,
  columns = 2
}: AttributeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-white/60 ml-1">{label}</label>
      <div 
        className={cn(
          "grid gap-2",
          columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-4"
        )}
      >
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                "relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-500 group overflow-hidden",
                isSelected 
                  ? "bg-white/10 border-primary/50 shadow-[0_0_20px_rgba(139,92,246,0.15)] ring-1 ring-primary/20" 
                  : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
              )}
            >
              {/* Active Gradient Background */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50" />
              )}
              
              <div className="relative z-10 flex items-center gap-3 w-full">
                {option.color && (
                  <div 
                    className="w-5 h-5 rounded-full border border-white/20 shrink-0 shadow-sm" 
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {option.icon && (
                  <span className="text-xl shrink-0 group-hover:scale-125 transition-transform duration-500">
                    {option.icon}
                  </span>
                )}
                <span className={cn(
                  "text-sm font-bold transition-colors",
                  isSelected ? "text-white" : "text-white/40"
                )}>
                  {option.label}
                </span>
              </div>
              
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(139,92,246,1)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
