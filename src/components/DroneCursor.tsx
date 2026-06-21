import React, { useEffect, useState } from "react";

interface ClickPulse {
  id: number;
  x: number;
  y: number;
}

export default function DroneCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [clicks, setClicks] = useState<ClickPulse[]>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device to disable custom cursor on mobile
    const checkTouch = () => {
      if (window.matchMedia("(pointer: coarse)").matches) {
        setIsTouchDevice(true);
      }
    };
    checkTouch();

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);

      // Inspect hovered target to check if it's premium clickable element
      const target = e.target as HTMLElement | null;
      if (target) {
        const isClickable =
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.onclick !== null ||
          target.closest("button") !== null ||
          target.closest("a") !== null ||
          target.classList.contains("cursor-pointer") ||
          target.closest(".cursor-pointer") !== null ||
          target.tagName === "SELECT" ||
          target.tagName === "INPUT";
        setIsHovered(!!isClickable);
      }
    };

    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);

    const handleMouseDown = (e: MouseEvent) => {
      const newClick: ClickPulse = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };
      setClicks((prev) => [...prev, newClick]);

      // Remove after animation completes
      setTimeout(() => {
        setClicks((prev) => prev.filter((c) => c.id !== newClick.id));
      }, 700);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [visible]);

  if (isTouchDevice || !visible) return null;

  return (
    <>
      {/* CSS Injections for cursor occlusion, hovering bobbing loops and radar animations */}
      <style>{`
        @media (any-hover: hover) {
          /* occlude native system cursor across all actionable surfaces */
          body, html, #app-root, button, a, input, select, textarea, [role="button"], .cursor-pointer {
            cursor: none !important;
          }
        }

        @keyframes droneHover {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(2deg);
          }
        }

        @keyframes shadowHover {
          0%, 100% {
            transform: scale(1.0) translateX(-50%);
            opacity: 0.3;
          }
          50% {
            transform: scale(0.65) translateX(-50%);
            opacity: 0.12;
          }
        }

        @keyframes radarExpandUnit1 {
          0% {
            transform: translate(-50%, -50%) scale(0.15);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.4);
            opacity: 0;
          }
        }

        @keyframes radarExpandUnit2 {
          0% {
            transform: translate(-50%, -50%) scale(0.05);
            opacity: 0;
          }
          20% {
            transform: translate(-50%, -50%) scale(0.05);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.8);
            opacity: 0;
          }
        }

        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spinFast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-drone-bob {
          animation: droneHover 1.8s ease-in-out infinite;
        }

        .animate-shadow-bob {
          animation: shadowHover 1.8s ease-in-out infinite;
        }

        .animate-radar-unit1 {
          animation: radarExpandUnit1 0.7s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }

        .animate-radar-unit2 {
          animation: radarExpandUnit2 0.7s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>

      {/* Render Active Click radar pulse indicators */}
      {clicks.map((pulse) => (
        <div
          key={pulse.id}
          className="fixed pointer-events-none z-[9999] mix-blend-screen"
          style={{
            left: pulse.x,
            top: pulse.y,
          }}
        >
          {/* Cyan Outer Shockwave */}
          <div
            className="absolute rounded-full border-2 border-cyan-400/80 animate-radar-unit1 w-16 h-16"
            style={{ transform: "translate(-50%, -50%)" }}
          />
          {/* Accent-Orange Inner Shockwave */}
          <div
            className="absolute rounded-full border border-accent animate-radar-unit2 w-16 h-16"
            style={{ transform: "translate(-50%, -50%)" }}
          />
          {/* Laser-dot epicenter core */}
          <div
            className="absolute bg-white rounded-full w-2.5 h-2.5 shadow-[0_0_8px_#ffffff]"
            style={{ transform: "translate(-50%, -50%)" }}
          />
        </div>
      ))}

      {/* Main Tactical Drone Cursor element */}
      <div
        className="fixed pointer-events-none z-[9998] transition-all duration-75 ease-out"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="relative w-12 h-12">
          {/* 1. Dynamic Shadow below the drone */}
          <div
            className="absolute left-1/2 bottom-[-16px] w-6 h-1.5 bg-black rounded-full filter blur-[2px] animate-shadow-bob"
            style={{ transform: "translateX(-50%)" }}
          />

          {/* 2. Floating Space Drone with Hover Bobbing and Target Locks */}
          <div
            className={`w-full h-full flex items-center justify-center animate-drone-bob transition-transform duration-300 ${
              isHovered ? "scale-125" : "scale-100"
            }`}
          >
            {/* Drone Vector Graphics */}
            <svg
              viewBox="0 0 64 64"
              className="w-10 h-10 drop-shadow-[0_0_5px_rgba(255,77,0,0.4)]"
            >
              {/* Rotor Wings Crossbar */}
              <path
                d="M12 12 L52 52 M52 12 L12 52"
                stroke={isHovered ? "#FF007F" : "#555"}
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-colors duration-300"
              />

              {/* Rotors (4 points of flight vector stabilizers) */}
              {/* Top-Left stabilisation node */}
              <circle
                cx="12"
                cy="12"
                r="4.5"
                fill="#111"
                stroke={isHovered ? "#FF007F" : "#00F2FE"}
                strokeWidth="2"
              />
              <path
                d="M8 12 L16 12"
                stroke="#fff"
                strokeWidth="1"
                style={{
                  transformOrigin: "12px 12px",
                  animation: `spinSlow ${isHovered ? "0.2s" : "0.6s"} linear infinite`,
                }}
              />

              {/* Top-Right stabilisation node */}
              <circle
                cx="52"
                cy="12"
                r="4.5"
                fill="#111"
                stroke={isHovered ? "#FF007F" : "#00F2FE"}
                strokeWidth="2"
              />
              <path
                d="M48 12 L56 12"
                stroke="#fff"
                strokeWidth="1"
                style={{
                  transformOrigin: "52px 12px",
                  animation: `spinSlow ${isHovered ? "0.2s" : "0.6s"} linear infinite`,
                }}
              />

              {/* Bottom-Left stabilisation node */}
              <circle
                cx="12"
                cy="52"
                r="4.5"
                fill="#111"
                stroke={isHovered ? "#FF007F" : "#00F2FE"}
                strokeWidth="2"
              />
              <path
                d="M8 52 L16 52"
                stroke="#fff"
                strokeWidth="1"
                style={{
                  transformOrigin: "12px 52px",
                  animation: `spinSlow ${isHovered ? "0.2s" : "0.6s"} linear infinite`,
                }}
              />

              {/* Bottom-Right stabilisation node */}
              <circle
                cx="52"
                cy="52"
                r="4.5"
                fill="#111"
                stroke={isHovered ? "#FF007F" : "#00F2FE"}
                strokeWidth="2"
              />
              <path
                d="M48 52 L56 52"
                stroke="#fff"
                strokeWidth="1"
                style={{
                  transformOrigin: "52px 52px",
                  animation: `spinSlow ${isHovered ? "0.2s" : "0.6s"} linear infinite`,
                }}
              />

              {/* Main Core Body */}
              <polygon
                points="32,16 44,32 32,48 20,32"
                fill="#16161a"
                stroke={isHovered ? "#FF007F" : "#ff4d00"}
                strokeWidth="2.5"
                className="transition-all duration-300"
              />

              {/* Core Active Lens / Sensor eye */}
              <circle
                cx="32"
                cy="32"
                r="4.5"
                fill={isHovered ? "#FF007F" : "#ff4d00"}
                className={`transition-all duration-300 ${
                  isHovered ? "animate-ping" : "animate-pulse"
                }`}
              />

              {/* Advanced UI crosshair overlay framing */}
              {isHovered && (
                <path
                  d="M 24 20 L 20 20 L 20 24 M 40 20 L 44 20 L 44 24 M 20 40 L 20 44 L 24 44 M 44 40 L 44 44 L 40 44"
                  stroke="#00F2FE"
                  strokeWidth="1.5"
                  fill="none"
                />
              )}
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
