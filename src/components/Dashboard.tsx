/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Sparkles, 
  Map, 
  Compass, 
  ChevronRight, 
  TrendingUp, 
  Send, 
  UserCheck, 
  Plane, 
  ShieldAlert, 
  Activity, 
  Layers, 
  FileCheck, 
  Star, 
  HelpCircle,
  Building,
  Lock,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { User } from "firebase/auth";

interface DashboardProps {
  user: User | null;
  hotelsCount: number;
  flightsCount: number;
  averageRating: number;
  reviewsCount: number;
  onNavigateTab: (tab: "avionics" | "economics" | "preferences" | "claims" | "recommendations" | "forum") => void;
  onTriggerLogin: () => void;
  triggerNotification: (title: string, message: string, type: "info" | "alert" | "success" | "warning") => void;
}

export default function Dashboard({
  user,
  hotelsCount,
  flightsCount,
  averageRating,
  reviewsCount,
  onNavigateTab,
  onTriggerLogin,
  triggerNotification
}: DashboardProps) {
  // Local state for Aeris AI introductory interaction box on the dashboard
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiOutput, setAiOutput] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const handleQuickAccess = (tab: "avionics" | "economics" | "preferences" | "claims" | "recommendations" | "forum") => {
    if (!user) {
      triggerNotification(
        "Authentication Required",
        `Access to ${tab === "avionics" ? "Avionics" : tab === "recommendations" ? "AI Affinities" : "aerospace catalog"} requires a secured sync session. Directing to login module.`,
        "warning"
      );
      onTriggerLogin();
    } else {
      onNavigateTab(tab);
    }
  };

  const handleAiTry = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiOutput("");

    try {
      const response = await fetch("/api/recommendations/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              text: `Explain briefly in 2 to 3 sentences for a traveler: ${aiPrompt}`
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }

      const data = await response.json();
      if (data.text) {
        setAiOutput(data.text);
      } else {
        setAiOutput("Aeris AI online. Ready to optimize your affinity vectors.");
      }
    } catch (err) {
      setAiOutput("I am ready to curate your flight segments, select the best seating layout, and match hotel upgrades once you initiate a secure sync!");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade" id="dashboard-view-pane">
      
      {/* Hero Welcome / Header Banner */}
      <div className="relative border border-border-grid bg-panel p-6 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Background Accent Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
        
        <div className="relative z-10 max-w-xl">
          <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-1">Global Workspace Node</span>
          <h1 className="font-serif italic font-bold text-3xl md:text-4xl text-typography tracking-tight">
            Aeris Intelligence
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-2 leading-relaxed">
            Welcome to the aeris tactical avionics and dynamic booking portal. We orchestrate live satellite flight coordinates, predictive pricing matrices, and cognitive travelers AI companion models to optimize your pathing.
          </p>
        </div>

        {/* Dynamic State Overview Button */}
        <div className="relative z-10 shrink-0">
          {!user ? (
            <button
              onClick={onTriggerLogin}
              className="px-5 py-2 bg-accent hover:bg-opacity-95 text-canvas font-mono uppercase text-xs font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-accent/10"
            >
              <Lock size={12} />
              <span>Initiate Cloud Sync</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-[#161616] border border-accent/30 px-4 py-2">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <div className="text-left font-mono">
                <span className="text-[9px] text-gray-500 block uppercase">Telemetry Status</span>
                <span className="text-[11px] text-[#F5F5F0] font-bold">LINK_SECURED_ACTIVE</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Ledger Section - Highlighting the active user when logged in */}
      <div className="border border-border-grid bg-[#121212] p-5" id="dashboard-account-ledger-section">
        <div className="flex items-center justify-between border-b border-border-grid pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="text-accent animate-pulse" size={15} />
            <h3 className="font-mono text-[10px] uppercase text-typography tracking-wider">Account Ledger Registry</h3>
          </div>
          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">REG_LEDGER_V4.2</span>
        </div>

        {user ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-slide-up">
            <div className="p-4 bg-panel border border-accent/20 flex flex-col gap-1.5 relative overflow-hidden">
              <div className="absolute top-2 right-2 text-accent/10"><UserCheck size={40} /></div>
              <span className="font-sans text-[10px] text-gray-500 uppercase">Synchronized Voyager</span>
              <span className="font-mono text-sm font-bold text-accent truncate" id="ledger-user-username">
                {user.displayName || user.email?.split("@")[0] || "Passenger 99"}
              </span>
              <span className="text-[9px] text-gray-400 font-sans mt-1">Verified secure cloud profile</span>
            </div>

            <div className="p-4 bg-panel border border-border-grid flex flex-col gap-1.5">
              <span className="font-sans text-[10px] text-gray-500 uppercase">Identity Credentials</span>
              <span className="font-mono text-xs text-secondary truncate">
                {user.email || "No email verified"}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[8px] uppercase tracking-wider font-mono text-emerald-500 bg-emerald-950/30 border border-emerald-900 px-1 py-0.5 rounded-sm">
                  AUTHORIZED
                </span>
                <span className="text-[8px] uppercase tracking-wider font-mono text-gray-500 bg-neutral-900 border border-border-grid px-1 py-0.5 rounded-sm">
                  UID: {user.uid.slice(0, 8)}...
                </span>
              </div>
            </div>

            <div className="p-4 bg-panel border border-border-grid flex flex-col justify-between">
              <div>
                <span className="font-sans text-[10px] text-gray-500 uppercase block mb-0.5">Cloud Storage Sync</span>
                <span className="font-mono text-xs text-[#F5F5F0] font-bold">Continuous Real-time</span>
              </div>
              <div className="text-[9px] text-gray-400 mt-2 font-sans">
                Reservations ledger synchronized securely in Firestore database.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center bg-panel border border-dashed border-border-grid">
            <Lock size={20} className="text-amber-500 mb-2" />
            <h4 className="font-mono text-xs uppercase font-bold text-typography">Voyager Ledger Is Stale / Unsynchronized</h4>
            <p className="text-[11px] text-gray-400 font-sans max-w-md mt-1 mb-4 leading-relaxed">
              Login to synchronize your reservation coordinates, seating selection states, and personal dialog caches with the main secure cloud node.
            </p>
            <button
              onClick={onTriggerLogin}
              className="py-1 px-3.5 bg-amber-500 hover:bg-amber-400 text-[#121212] font-mono uppercase text-[9px] font-bold tracking-wider transition-all"
            >
              Sync Account Ledger
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Counter Showcase (Flights, Hotels, ratings) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="dashboard-counter-stats">
        <div className="border border-border-grid bg-panel p-4 flex flex-col gap-1 hover:border-gray-600 transition-all">
          <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-0.5">Avionics Feed</span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif italic font-bold text-3xl text-typography" id="dashboard-flights-count">
              {flightsCount}
            </span>
            <span className="text-xs font-mono text-gray-500">Live Flight Vectors</span>
          </div>
          <p className="text-[10px] text-gray-400 font-sans mt-1">Satellite metrics synchronizing active global corridors.</p>
        </div>

        <div className="border border-border-grid bg-panel p-4 flex flex-col gap-1 hover:border-gray-600 transition-all">
          <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-0.5">Premium Stays</span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif italic font-bold text-3xl text-typography" id="dashboard-hotels-count">
              {hotelsCount}
            </span>
            <span className="text-xs font-mono text-gray-500">Curated Hotels</span>
          </div>
          <p className="text-[10px] text-gray-400 font-sans mt-1">High-fidelity catalog integrations with deluxe room sync.</p>
        </div>

        <div className="border border-border-grid bg-panel p-4 flex flex-col gap-1 hover:border-gray-600 transition-all">
          <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-0.5">Community Weight</span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif italic font-bold text-3xl text-typography" id="dashboard-reviews-score">
              {averageRating.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-gray-500">/ 5.0 Rating</span>
          </div>
          <p className="text-[10px] text-gray-400 font-sans mt-1">Aggregated reviews across {reviewsCount} traveler dispatches.</p>
        </div>
      </div>

      {/* Quick Access Navigational Buttons Grid */}
      <div className="border border-border-grid bg-panel p-5" id="quick-access-section">
        <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-1">Interactive Telemetry Launchers</span>
        <h3 className="font-serif italic font-bold text-xl text-typography mb-4">Quick Access Terminal</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            id="quick-access-btn-avionics"
            onClick={() => handleQuickAccess("avionics")}
            className="flex flex-col items-center justify-center p-4 border border-border-grid bg-[#121212] hover:bg-[#181818] hover:border-accent transition-all duration-300 group cursor-pointer text-center"
          >
            <div className="p-2 border border-border-grid group-hover:border-accent/40 bg-panel mb-3 transition-all rounded-sm text-gray-400 group-hover:text-accent">
              <Plane size={16} />
            </div>
            <span className="font-mono text-[10px] uppercase font-bold text-typography group-hover:text-white block">Telemetry</span>
            <span className="text-[8px] text-gray-500 font-sans mt-1">Live Coordinates</span>
          </button>

          <button
            id="quick-access-btn-economics"
            onClick={() => handleQuickAccess("economics")}
            className="flex flex-col items-center justify-center p-4 border border-border-grid bg-[#121212] hover:bg-[#181818] hover:border-accent transition-all duration-300 group cursor-pointer text-center"
          >
            <div className="p-2 border border-border-grid group-hover:border-accent/40 bg-panel mb-3 transition-all rounded-sm text-gray-400 group-hover:text-accent">
              <TrendingUp size={16} />
            </div>
            <span className="font-mono text-[10px] uppercase font-bold text-typography group-hover:text-white block">Economics</span>
            <span className="text-[8px] text-gray-500 font-sans mt-1">Tariff Engineers</span>
          </button>

          <button
            id="quick-access-btn-preferences"
            onClick={() => handleQuickAccess("preferences")}
            className="flex flex-col items-center justify-center p-4 border border-border-grid bg-[#121212] hover:bg-[#181818] hover:border-accent transition-all duration-300 group cursor-pointer text-center"
          >
            <div className="p-2 border border-border-grid group-hover:border-accent/40 bg-panel mb-3 transition-all rounded-sm text-gray-400 group-hover:text-accent">
              <Layers size={16} />
            </div>
            <span className="font-mono text-[10px] uppercase font-bold text-typography group-hover:text-white block">Preferences</span>
            <span className="text-[8px] text-gray-500 font-sans mt-1">Seat Layout Cabin</span>
          </button>

          <button
            id="quick-access-btn-claims"
            onClick={() => handleQuickAccess("claims")}
            className="flex flex-col items-center justify-center p-4 border border-border-grid bg-[#121212] hover:bg-[#181818] hover:border-accent transition-all duration-300 group cursor-pointer text-center"
          >
            <div className="p-2 border border-border-grid group-hover:border-accent/40 bg-panel mb-3 transition-all rounded-sm text-gray-400 group-hover:text-accent">
              <FileCheck size={16} />
            </div>
            <span className="font-mono text-[10px] uppercase font-bold text-typography group-hover:text-white block">Claims</span>
            <span className="text-[8px] text-gray-500 font-sans mt-1">Revocation Portal</span>
          </button>

          <button
            id="quick-access-btn-recommendations"
            onClick={() => handleQuickAccess("recommendations")}
            className="flex flex-col items-center justify-center p-4 border border-border-grid bg-[#121212] hover:bg-[#181818] hover:border-accent transition-all duration-300 group cursor-pointer text-center"
          >
            <div className="p-2 border border-border-grid group-hover:border-accent/40 bg-panel mb-3 transition-all rounded-sm text-gray-400 group-hover:text-accent">
              <Sparkles size={16} />
            </div>
            <span className="font-mono text-[10px] uppercase font-bold text-typography group-hover:text-white block">Affinity AI</span>
            <span className="text-[8px] text-gray-500 font-sans mt-1">Personal Companions</span>
          </button>

          <button
            id="quick-access-btn-forum"
            onClick={() => handleQuickAccess("forum")}
            className="flex flex-col items-center justify-center p-4 border border-border-grid bg-[#121212] hover:bg-[#181818] hover:border-accent transition-all duration-300 group cursor-pointer text-center"
          >
            <div className="p-2 border border-border-grid group-hover:border-accent/40 bg-panel mb-3 transition-all rounded-sm text-gray-400 group-hover:text-accent">
              <MessageSquare size={16} />
            </div>
            <span className="font-mono text-[10px] uppercase font-bold text-typography group-hover:text-white block">Feedback</span>
            <span className="text-[8px] text-gray-500 font-sans mt-1">Travelers Forum</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid: About Company & Aeris AI Preview Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-about-and-ai-grid">
        
        {/* Left Column: About aeris */}
        <div className="border border-border-grid bg-panel p-6 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center gap-1.5 border-b border-border-grid pb-3 mb-4">
              <Compass size={14} className="text-accent" />
              <h3 className="font-serif italic font-bold text-lg text-typography">About Our Aerospace Consortium</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans mb-3.5">
              Aeris is a pioneer in collaborative flight path logistics and intelligent booking solutions. Born out of the desire to modernize sovereign airline schedules with high-precision satellite telemetry, Aeris enables low-latency mapping, customizable passenger seating profiles, and dynamic multi-tiered cost freezing under standard protocols.
            </p>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              Our servers bind real-time operations into a singular, synchronized passenger ledger, protecting premium fares through autonomous smart-claims and refund guarantees. We serve over 15,000+ travel coordinate logs daily with standard class, business, and bespoke hotel upgrade pipelines.
            </p>
          </div>

          <div className="bg-[#141414] p-3.5 border border-border-grid flex items-center justify-between">
            <div className="font-mono text-[10px]">
              <span className="text-accent font-semibold block uppercase">Compliance Certification</span>
              <span className="text-gray-400">ICAO & FAA Grid Calibration OK</span>
            </div>
            <Compass size={18} className="text-gray-500" />
          </div>
        </div>

        {/* Right Column: Aeris AI Introductory Interactive Sandbox */}
        <div className="border border-border-grid bg-[#121212] p-6 flex flex-col justify-between gap-5 relative">
          
          <div>
            <div className="flex items-center justify-between border-b border-border-grid pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-accent animate-pulse" />
                <h3 className="font-serif italic font-bold text-lg text-typography">Aeris AI Affinity Engine</h3>
              </div>
              <span className="text-[8px] font-mono uppercase bg-accent/10 text-accent px-1.5 py-0.5 border border-accent/20">
                Trial Console
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans mb-4">
              Try a direct test prompt with the Aeris AI system. Our neural nodes analyze flight vectors, lodging configurations, and traveler feedback to find optimized solutions.
            </p>

            {/* Trial response wrapper */}
            {aiOutput && (
              <div className="p-3 bg-panel border border-border-grid text-xs text-gray-300 font-sans leading-relaxed mb-4">
                <span className="font-mono text-[8px] text-accent uppercase block mb-1">AI Output:</span>
                <p>{aiOutput}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-mono text-gray-500 uppercase">Input prompt trial query</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiTry()}
                placeholder="e.g. Suggest standard vs deluxe class seating options"
                className="flex-1 bg-canvas border border-border-grid px-3 py-1.5 text-xs text-typography focus:border-accent focus:outline-none placeholder-gray-500"
              />
              <button
                onClick={handleAiTry}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="bg-accent hover:bg-opacity-95 text-canvas px-3 disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer"
              >
                <Send size={12} className={isAiLoading ? "animate-spin" : ""} />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-grid/50">
              <span className="text-[8px] font-mono text-gray-500 uppercase">Connected version: Gemini 3.5 Flash</span>
              {user ? (
                <button
                  onClick={() => handleQuickAccess("recommendations")}
                  className="font-mono text-[9px] text-accent hover:text-white uppercase flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <span>Open Companion Line</span>
                  <ArrowRight size={10} />
                </button>
              ) : (
                <span className="text-[8px] font-mono text-amber-500">Sync account to store chats</span>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Featured Community Reviews list on Dashboard */}
      <div className="border border-border-grid bg-[#121212] p-6" id="dashboard-featured-feedback">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-grid pb-3 mb-4 gap-3">
          <div className="flex items-center gap-1.5">
            <Star className="text-yellow-500 fill-yellow-500" size={14} />
            <h3 className="font-serif italic font-bold text-lg text-typography">Voyager Testimonials</h3>
          </div>
          <button
            onClick={() => handleQuickAccess("forum")}
            className="font-mono text-[9px] text-accent hover:text-white uppercase tracking-wider flex items-center gap-0.5 transition-all cursor-pointer"
          >
            <span>View All Reviews ({reviewsCount})</span>
            <ArrowRight size={10} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-panel border border-border-grid flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={11} className="text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-xs text-gray-300 italic font-sans leading-relaxed">
                "The real-time seating configuration tools in the Configuration Studio made picking premium seating so painless. High fidelity visual design!"
              </p>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>Voyager @flight-fanatic</span>
              <span className="text-accent uppercase">VERIFIED FLIGHT COORDINATE</span>
            </div>
          </div>

          <div className="p-4 bg-panel border border-border-grid flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={11} className="text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-xs text-gray-300 italic font-sans leading-relaxed">
                "The claims center is robust and instantaneous. When my schedule shifted, my deluxe upgrade was secured via transaction routing with refund protection."
              </p>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>Voyager @travel-pro</span>
              <span className="text-accent uppercase">VERIFIED LEDGER CLAIM</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
