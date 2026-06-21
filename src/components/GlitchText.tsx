import React, { useEffect, useState, useRef } from "react";

interface GlitchTextProps {
  text: string;
  delay?: number;
  className?: string;
  triggerOnHover?: boolean;
}

const GLITCH_GLYPHS = "01$#@&%*=+?!XZ[]{}<>";

export default function GlitchText({
  text,
  delay = 300,
  className = "",
  triggerOnHover = true
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const originalTextRef = useRef<string>(text);

  useEffect(() => {
    originalTextRef.current = text;
    triggerReveal();
  }, [text]);

  const triggerReveal = () => {
    const original = originalTextRef.current;
    let iterations = 0;
    setIsGlitching(true);

    const interval = setInterval(() => {
      setDisplayText((current) => {
        return original
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iterations) {
              return original[index];
            }
            // Scramble characters
            return GLITCH_GLYPHS[Math.floor(Math.random() * GLITCH_GLYPHS.length)];
          })
          .join("");
      });

      if (iterations >= original.length) {
        clearInterval(interval);
        setDisplayText(original);
        setIsGlitching(false);
      }

      iterations += 1.5; // Controls reveal cascade rate
    }, 30);

    return () => clearInterval(interval);
  };

  return (
    <span
      className={`relative inline-block select-none ${className}`}
      onMouseEnter={() => {
        if (triggerOnHover && !isGlitching) {
          triggerReveal();
        }
      }}
    >
      {/* Absolute Magenta Glitch Underlay */}
      {isGlitching && (
        <span 
          className="absolute left-[1px] top-0 text-[#FF007F] opacity-75 select-none pointer-events-none font-bold"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 45%)", textShadow: "0.5px 0 #FF007F" }}
        >
          {displayText}
        </span>
      )}

      {/* Primary Visible Base Text */}
      <span className={isGlitching ? "text-white text-shadow-neo" : ""}>
        {displayText}
      </span>

      {/* Absolute Cyan Glitch Underlay */}
      {isGlitching && (
        <span 
          className="absolute -left-[1.5px] -top-[0.5px] text-[#00F2FE] opacity-75 select-none pointer-events-none font-bold animate-[pulse_0.1s_infinite]"
          style={{ clipPath: "polygon(0 45%, 100% 45%, 100% 100%, 0 100%)", textShadow: "-0.5px 0 #00F2FE" }}
        >
          {displayText}
        </span>
      )}
    </span>
  );
}
