/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Recommendation } from "../types";
import { 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  HelpCircle, 
  Heart, 
  UserCheck, 
  Send, 
  MessageSquare, 
  Trash2, 
  Compass 
} from "lucide-react";
import { User } from "firebase/auth";
import { db, doc, setDoc, getDoc } from "../firebase";

interface PersonalizedRecommendationsProps {
  user: User | null;
  recommendations: Recommendation[];
  onVoteRecommendation: (id: string, helpful: boolean) => void;
  onRefreshRecommendations: (category: string) => void;
  triggerNotification: (title: string, message: string, type: "info" | "alert" | "success" | "warning") => void;
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default function PersonalizedRecommendations({
  user,
  recommendations,
  onVoteRecommendation,
  onRefreshRecommendations,
  triggerNotification
}: PersonalizedRecommendationsProps) {
  const [userInterest, setUserInterest] = useState<string>("beaches");
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  // Chatbot State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Greetings, voyager. I am your Aeris Affinity Companion, backed by the Gemini engine. Ask me anything about optimized flight segments, standard vs deluxe fare differences, hotel upgrades, or destination insights!"
    }
  ]);
  const [inputVal, setInputVal] = useState<string>("");
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync / Load user specific chat history from secure Firestore document
  useEffect(() => {
    if (!user) {
      setMessages([
        {
          role: "model",
          text: "Greetings, voyager. I am your Aeris Affinity Companion, backed by the Gemini engine. Ask me anything about optimized flight segments, standard vs deluxe fare differences, hotel upgrades, or destination insights!"
        }
      ]);
      return;
    }

    const chatDocRef = doc(db, "users", user.uid, "chats", "companion");
    const loadChatHistory = async () => {
      try {
        const docSnap = await getDoc(chatDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        } else {
          const initialMsgs: ChatMessage[] = [
            {
              role: "model",
              text: `Welcome back, ${user.displayName || user.email?.split('@')[0] || "voyager"}. I have synchronized your private Aeris Affinity companion line. How can I guide your aerospace preferences today?`
            }
          ];
          setMessages(initialMsgs);
          await setDoc(chatDocRef, { messages: initialMsgs });
        }
      } catch (err) {
        console.error("Error loading companion chat history:", err);
      }
    };

    loadChatHistory();
  }, [user]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const submitChatMessage = async (presetText?: string) => {
    const textToSend = (presetText || inputVal).trim();
    if (!textToSend) return;

    if (!presetText) {
      setInputVal("");
    }

    const nextMessages = [...messages, { role: "user" as const, text: textToSend }];
    setMessages(nextMessages);
    setIsComputing(true);

    try {
      const response = await fetch("/api/recommendations/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok) {
        throw new Error(`Chat API responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.text) {
        const finalMessages = [...nextMessages, { role: "model" as const, text: data.text }];
        setMessages(finalMessages);
        
        if (user) {
          try {
            const chatDocRef = doc(db, "users", user.uid, "chats", "companion");
            await setDoc(chatDocRef, { messages: finalMessages });
          } catch (dbErr) {
            console.error("Failed to sync message packet to secure ledger store:", dbErr);
          }
        }
      } else {
        throw new Error("No textual content regenerated by the Companion network.");
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMessages = [
        ...nextMessages,
        {
          role: "model" as const,
          text: `**Calibration Error**: System failed to synch payload. Ensure the Gemini service is reachable of database connection. Internal response: *"${err.message || "Unknown error"}"*`
        }
      ];
      setMessages(errorMessages);
      if (user) {
        try {
          const chatDocRef = doc(db, "users", user.uid, "chats", "companion");
          await setDoc(chatDocRef, { messages: errorMessages });
        } catch (dbErr) {
          console.error("Failed to commit chat session log with error:", dbErr);
        }
      }
      triggerNotification("AI Link Fault", "Failed to retrieve Gemini affinity calculation.", "alert");
    } finally {
      setIsComputing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submitChatMessage();
    }
  };

  const clearChat = async () => {
    const clearedMsgs: ChatMessage[] = [
      {
        role: "model",
        text: "Affinity registers cleared. Voyager stream reset. How can I guide your journey details next?"
      }
    ];
    setMessages(clearedMsgs);
    if (user) {
      try {
        const chatDocRef = doc(db, "users", user.uid, "chats", "companion");
        await setDoc(chatDocRef, { messages: clearedMsgs });
      } catch (err) {
        console.error("Failed to reset secure user chat registry:", err);
      }
    }
    triggerNotification("Companion Memory Cleared", "Traveler dialogue session registers updated.", "info");
  };

  // Human-crafted responsive markdown and block parser
  const renderMessageText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-gray-300 mb-1 font-sans">
            {trimmed.substring(2)}
          </li>
        );
      }
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }
      const boldParts = line.split("**");
      return (
        <p key={idx} className="text-xs text-gray-300 leading-relaxed font-sans mb-1.5">
          {boldParts.map((part, pIdx) => {
            if (pIdx % 2 === 1) {
              return <strong key={pIdx} className="text-[#F5F5F0] font-semibold">{part}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  const suggestedQuestions = [
    "Plan a 3-day SFO trip",
    "Standard vs Deluxe flights",
    "Review hotel recommendations"
  ];

  return (
    <div className="bg-panel border border-border-grid p-6 rounded-none flex flex-col gap-6" id="recommendations-container">
      {/* Dual Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Col Span 2): Vector Selector and Recommendations */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Top Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border-grid pb-5">
            <div>
              <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-1">AI Travel Dispatcher</span>
              <h2 className="font-serif italic font-bold text-2xl text-typography">Personalized Recommendations</h2>
              <p className="text-xs text-gray-400 font-sans mt-0.5">Custom destination vectors calculated from your logs. Fine-tune affinities in real-time.</p>
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
                  className={`py-1 text-[9px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                    userInterest === "beaches" ? "bg-accent border-accent text-canvas font-bold" : "border-border-grid text-gray-400 hover:text-white"
                  }`}
                >
                  Beach
                </button>
                <button
                  id="affinity-reach-history"
                  onClick={() => handleInterestChange("history")}
                  className={`py-1 text-[9px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                    userInterest === "history" ? "bg-accent border-accent text-canvas font-bold" : "border-border-grid text-gray-400 hover:text-white"
                  }`}
                >
                  Heritage
                </button>
                <button
                  id="affinity-reach-modern"
                  onClick={() => handleInterestChange("modern")}
                  className={`py-1 text-[9px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                    userInterest === "modern" ? "bg-accent border-accent text-canvas font-bold" : "border-border-grid text-gray-400 hover:text-white"
                  }`}
                >
                  Sleek Tech
                </button>
              </div>
            </div>
          </div>

          {/* Grid of Recommendation outputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <h4 className="font-serif italic font-bold text-base text-typography mt-0.5 leading-snug">
                      {rec.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-sans">{rec.subtitle}</p>
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
                          className="p-1 px-1.5 border border-border-grid hover:border-accent text-gray-400 hover:text-accent font-mono text-[8px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                          title="Mark as Helpful"
                        >
                          <ThumbsUp size={9} />
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
                          className="p-1 px-1.5 border border-border-grid hover:border-red-950 text-gray-400 hover:text-red-500 font-mono text-[8px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                          title="Hide/Refuse Recommendation"
                        >
                          <ThumbsDown size={9} />
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

        {/* Right Column (Col Span 1): Gemini AI Companion Chat Box */}
        <div className="lg:col-span-1 bg-[#121212] border border-border-grid flex flex-col justify-between h-[620px] rounded-none shadow-md">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-border-grid flex items-center justify-between bg-[#161616]">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent animate-pulse" />
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-typography">Affinity Companion</h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-gray-400 font-mono uppercase">Gemini Connected</span>
                </div>
              </div>
            </div>
            {messages.length > 1 && (
              <button
                onClick={clearChat}
                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                title="Reset conversation Stream"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {/* Message Stream */}
          <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent"
          >
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "self-end items-end" : "self-start items-start"}`}
              >
                <span className="font-mono text-[8px] text-gray-500 uppercase mb-1">
                  {msg.role === "user" ? "Traveler" : "Aeris Gemini"}
                </span>
                <div 
                  className={`p-3 border text-xs leading-relaxed transition-all ${
                    msg.role === "user" 
                      ? "bg-accent border-accent text-canvas font-medium" 
                      : "bg-[#181818] border-border-grid text-gray-300"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="font-sans leading-relaxed text-xs">{msg.text}</p>
                  ) : (
                    renderMessageText(msg.text)
                  )}
                </div>
              </div>
            ))}

            {isComputing && (
              <div className="self-start flex flex-col items-start max-w-[85%]">
                <span className="font-mono text-[8px] text-gray-500 uppercase mb-1">Aeris Gemini</span>
                <div className="bg-[#181818] border border-border-grid p-3 text-xs text-gray-400 flex items-center gap-2">
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></span>
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Computing affinity vectors...</span>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations Quick Injection / Suggestions */}
          <div className="p-3 bg-[#161616] border-t border-border-grid/50 flex flex-col gap-1.5">
            <span className="text-[8px] font-mono uppercase text-gray-500 tracking-wider">Quick Affinity Queries</span>
            <div className="flex flex-wrap gap-1">
              {suggestedQuestions.map((q, qidx) => (
                <button
                  key={qidx}
                  disabled={isComputing}
                  onClick={() => submitChatMessage(q)}
                  className="text-[9px] font-mono text-gray-400 hover:text-white border border-border-grid hover:border-gray-500 bg-[#121212] py-1 px-2 transition-colors text-left cursor-pointer disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Form Input Area */}
          <div className="p-3 border-t border-border-grid flex gap-2 bg-[#141414]">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isComputing}
              placeholder="Ask travel companion..."
              className="flex-1 bg-canvas border border-border-grid px-3 py-1.5 text-xs text-typography focus:border-accent focus:outline-none placeholder-gray-500 font-sans"
            />
            <button
              onClick={() => submitChatMessage()}
              disabled={isComputing || !inputVal.trim()}
              className="bg-accent hover:bg-opacity-90 text-canvas font-bold p-1 px-3 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
              title="Transmit log message"
            >
              <Send size={13} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
