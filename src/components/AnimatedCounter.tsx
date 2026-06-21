import React, { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number; // total animation time in ms
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1000,
  decimals = 0,
  prefix = "",
  suffix = ""
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState<string>("");
  const targetValueRef = useRef<number>(value);
  const startTimeRef = useRef<number | null>(null);

  // Keep target updated
  useEffect(() => {
    targetValueRef.current = value;
    startTimeRef.current = null; // Reset animation
  }, [value]);

  useEffect(() => {
    let animationFrameId: number;
    let startValue = 0;

    const tick = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }

      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);
      
      // Easing function: easeOutQuad
      const easedProgress = progress * (2 - progress);

      const currentValue = startValue + (targetValueRef.current - startValue) * easedProgress;

      if (progress < 1) {
        // Scramble remaining digits for a cyberdecrypt animation
        const realStr = currentValue.toFixed(decimals);
        let scrambled = "";
        
        for (let i = 0; i < realStr.length; i++) {
          const char = realStr[i];
          if (char === "." || char === "," || char === "-" || char === " ") {
            scrambled += char;
          } else {
            // Random numbers or glitch glyphs
            if (Math.random() > 0.45) {
              scrambled += Math.floor(Math.random() * 10);
            } else {
              scrambled += char;
            }
          }
        }
        setDisplayValue(scrambled);
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(targetValueRef.current.toFixed(decimals));
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration, decimals]);

  return (
    <span className="font-mono font-bold select-none tracking-tight">
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
