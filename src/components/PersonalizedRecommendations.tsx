/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Recommendation } from "../types";
import { Sparkles, ThumbsUp, ThumbsDown, HelpCircle, Heart, Compass, RefreshCw, UserCheck } from "lucide-react";

interface PersonalizedRecommendationsProps {
  recommendations: Recommendation[];
  onVoteRecommendation: (id: string, helpful: boolean) => void;
  onRefreshRecommendations: (category: string) => void;
  triggerNotification: (title: string, message: string, type: "info" | "alert" | "success" | "warning") => void;
}

export default function PersonalizedRecommendations({
  recommendations,
  onVoteRecommendation,
  onRefreshRecommendations,
  triggerNotification
}: PersonalizedRecommendationsProps) {
  const [userInterest, setUserInterest] = useState<string>("beaches");
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const handleInterestChange = (category: string) => {
    setUserInterest(category);
    onRefreshRecommendations(category);
    
    let label = "";
    if (category === "beaches") label = "Tropical Beaches & Serene Havens";
    else if (category === "history") label = "Historic Stone Archives & Ryokans";
    else if (category === "modern") label = "Metropolitan Tech Spires & Obsidian Towers";

    triggerNotification(
      "Profile Signal Shift",
      `Primary profile affinity set to: ${label}. Collaborative matching vectors updated instantly.`,
      "success"
    );
  };

  return (
    <div className="bg-panel border border-border-grid p-6 rounded-none flex flex-col gap-6" id="recommendations-container">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border-grid pb-5">
        <div>
          <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-1">AI Travel Dispatcher</span>
          <h2 className="font-serif italic font-bold text-2xl text-typography">Personalized Recommendations</h2>
          <p className="text-xs text-gray-400 font-sans mt-0.5">Custom destination vectors calculated from your historical logs. Fine-tune affinities in real-time.</p>
        </div>

        {/* Dynamic Affinity Swapper */}
        <div className="bg-[#141414] border border-border-grid p-3 flex flex-col gap-2 min-w-[260px]">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <UserCheck size={12} className="text-accent" />
            <span>Persona Vector Simulator</span>
          </span>
          <div className="grid grid-cols-3 gap-1">
            <button
              id="affinity-reach-beaches"
              onClick={() => handleInterestChange("beaches")}
              className={`py-1 text-[9px] font-mono uppercase tracking-wider border transition-all ${
                userInterest === "beaches" ? "bg-accent border-accent text-canvas font-bold" : "border-border-grid text-gray-400 hover:text-white"
              }`}
            >
              Beach
            </button>
            <button
              id="affinity-reach-history"
              onClick={() => handleInterestChange("history")}
              className={`py-1 text-[9px] font-mono uppercase tracking-wider border transition-all ${
                userInterest === "history" ? "bg-accent border-accent text-canvas font-bold" : "border-border-grid text-gray-400 hover:text-white"
              }`}
            >
              Heritage
            </button>
            <button
              id="affinity-reach-modern"
              onClick={() => handleInterestChange("modern")}
              className={`py-1 text-[9px] font-mono uppercase tracking-wider border transition-all ${
                userInterest === "modern" ? "bg-accent border-accent text-canvas font-bold" : "border-border-grid text-gray-400 hover:text-white"
              }`}
            >
              Sleek Tech
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Recommendation outputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            id={`rec-card-${rec.id}`}
            className="border border-border-grid bg-[#121212] p-4 flex flex-col justify-between gap-4 hover:border-gray-600 transition-all group hover:bg-[#151515]"
          >
            {/* Header: Title and Match index */}
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[9px] text-accent block uppercase">
                  {rec.targetType === "flight" ? "Flight Vector suggestion" : "Hotel stay suggestion"}
                </span>
                <h4 className="font-serif italic font-bold text-lg text-typography mt-0.5 leading-snug">
                  {rec.title}
                </h4>
                <p className="text-xs text-gray-400 font-sans">{rec.subtitle}</p>
              </div>

              {/* Match indicator */}
              <div className="text-right shrink-0">
                <span className="font-mono text-sm font-extrabold text-[#F5F5F0] block leading-none">
                  {rec.matchPercentage}%
                </span>
                <span className="font-sans text-[8px] text-gray-500 uppercase tracking-wider">Algorithmic Match</span>
              </div>
            </div>

            {/* Explainer with tooltip */}
            <div className="p-3 bg-panel border border-border-grid flex flex-col gap-2 relative">
              <div className="flex items-start justify-between gap-2">
                <span className="font-sans text-[11px] text-gray-300 italic leading-relaxed">
                  "{rec.reason}"
                </span>
                <div className="relative shrink-0 mt-0.5">
                  <button
                    id={`tooltip-trigger-${rec.id}`}
                    onClick={() => setActiveTooltipId(activeTooltipId === rec.id ? null : rec.id)}
                    className="text-accent hover:text-white transition-all cursor-pointer"
                    title="Examine 'Why this recommendation?'"
                  >
                    <HelpCircle size={13} />
                  </button>
                </div>
              </div>

              {/* Interactive Tooltip Card */}
              {activeTooltipId === rec.id && (
                <div
                  id={`tooltip-explainer-${rec.id}`}
                  className="absolute bottom-full left-0 mb-2 w-64 bg-canvas border border-accent p-3 z-20 text-[10px] font-mono leading-relaxed text-gray-300 shadow-xl"
                >
                  <div className="flex items-center gap-1 text-accent font-semibold uppercase tracking-wider mb-1.5 border-b border-border-grid pb-1">
                    <Sparkles size={10} />
                    <span>Affinity Query Logic:</span>
                  </div>
                  <p>{rec.whyTooltip}</p>
                  <div className="text-[8px] text-gray-500 mt-1.5 uppercase font-bold text-right">
                    COLLABORATIVE FILTERING v4.2
                  </div>
                </div>
              )}
            </div>

            {/* Price and feedback loop triggers */}
            <div className="flex items-center justify-between border-t border-border-grid/50 pt-3 mt-1.5">
              <div>
                <span className="font-sans text-[9px] text-gray-500 block uppercase">Estimated Tarif</span>
                <span className="font-mono text-xs font-bold text-typography">${rec.price} USD</span>
              </div>

              {/* Helpful vs Irrelevant toggle */}
              <div className="flex items-center gap-1" id={`feedback-loop-${rec.id}`}>
                {rec.helpful === null ? (
                  <>
                    <button
                      id={`rec-helpful-${rec.id}`}
                      onClick={() => {
                        onVoteRecommendation(rec.id, true);
                        triggerNotification(
                          "Preference Recorded",
                          `Marked feedback for ${rec.title} as Helpful. Recommendation weights adjusted.`,
                          "success"
                        );
                      }}
                      className="p-1 px-2 border border-border-grid hover:border-accent text-gray-400 hover:text-accent font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                      title="Mark as Helpful"
                    >
                      <ThumbsUp size={10} />
                      <span>Helpful</span>
                    </button>
                    <button
                      id={`rec-irrelevant-${rec.id}`}
                      onClick={() => {
                        onVoteRecommendation(rec.id, false);
                        triggerNotification(
                          "Preference Restricted",
                          `Flagged ${rec.title} as Irrelevant. Alternative recommendation corridors loaded.`,
                          "info"
                        );
                      }}
                      className="p-1 px-2 border border-border-grid hover:border-red-950 text-gray-400 hover:text-red-500 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                      title="Hide/Refuse Recommendation"
                    >
                      <ThumbsDown size={10} />
                      <span>Irrelevant</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 font-mono text-[9px] text-gray-400 py-1 uppercase tracking-wider italic">
                    {rec.helpful ? (
                      <span className="text-accent flex items-center gap-1"><Heart size={10} /> affinity saved</span>
                    ) : (
                      <span className="text-gray-500 line-through">filtered out</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
