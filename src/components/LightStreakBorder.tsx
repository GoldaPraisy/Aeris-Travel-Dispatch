import React from "react";

interface LightStreakBorderProps {
  children?: React.ReactNode;
  color?: "cyan" | "magenta" | "orange";
  className?: string;
}

export default function LightStreakBorder({
  children,
  color = "orange",
  className = ""
}: LightStreakBorderProps) {
  // Map beautiful retro glow colours
  const glowStyles = {
    cyan: {
      border: "border-cyan-500/25",
      glow: "shadow-[0_0_12px_rgba(6,182,212,0.15)]",
      gradient: "from-transparent via-cyan-400/90 to-transparent",
      accent: "bg-cyan-500/10"
    },
    magenta: {
      border: "border-[#FF007F]/25",
      glow: "shadow-[0_0_12px_rgba(255,0,127,0.15)]",
      gradient: "from-transparent via-[#FF007F]/90 to-transparent",
      accent: "bg-[#FF007F]/10"
    },
    orange: {
      border: "border-accent/25",
      glow: "shadow-[0_0_12px_rgba(255,77,0,0.15)]",
      gradient: "from-transparent via-accent/90 to-transparent",
      accent: "bg-accent/10"
    }
  };

  const active = glowStyles[color];

  return (
    <div 
      className={`relative border ${active.border} bg-[#07040E]/82 ${active.glow} overflow-hidden ${className}`}
    >
      {/* Absolute Explosive Sweeping Light Streak (Left to Right Beam) */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden z-10"
      >
        <div 
          className={`absolute top-0 bottom-0 w-32 bg-gradient-to-r ${active.gradient} opacity-75 -skew-x-12 animate-streak`}
        />
        
        {/* Subtle high-neon horizontal scan beam crawling down */}
        <div 
          className="absolute inset-x-0 h-[1px] bg-white/20 animate-scanline pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, transparent, var(--color-accent), transparent)`
          }}
        />
      </div>

      {/* Cybernetic Tech-Gaming Corner brackets */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-current opacity-80 text-white z-20 pointer-events-none" style={{ color: color === "cyan" ? "#00F2FE" : color === "magenta" ? "#FF007F" : "#FF4D00" }} />
      <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-current opacity-80 text-white z-20 pointer-events-none" style={{ color: color === "cyan" ? "#00F2FE" : color === "magenta" ? "#FF007F" : "#FF4D00" }} />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-current opacity-80 text-white z-20 pointer-events-none" style={{ color: color === "cyan" ? "#00F2FE" : color === "magenta" ? "#FF007F" : "#FF4D00" }} />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-current opacity-80 text-white z-20 pointer-events-none" style={{ color: color === "cyan" ? "#00F2FE" : color === "magenta" ? "#FF007F" : "#FF4D00" }} />

      {/* Embedded UI Content */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}
