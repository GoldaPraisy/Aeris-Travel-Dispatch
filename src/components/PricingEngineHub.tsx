/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Flight, Hotel, PriceFreeze, PricingSeason } from "../types";
import { TrendingUp, Snowflake, Calendar, ShieldCheck, Timer, Zap, CheckCircle, RefreshCw, Bookmark } from "lucide-react";

interface PricingEngineHubProps {
  flights: Flight[];
  hotels: Hotel[];
  pricingSeason: PricingSeason;
  setPricingSeason: (season: PricingSeason) => void;
  priceFreezes: PriceFreeze[];
  onAddPriceFreeze: (freeze: Omit<PriceFreeze, "id" | "expiresAt">) => void;
  onRemovePriceFreeze: (id: string) => void;
  onCreateBookingFromFreeze: (freeze: PriceFreeze) => void;
  triggerNotification: (title: string, message: string, type: "info" | "alert" | "success" | "warning") => void;
}

export default function PricingEngineHub({
  flights,
  hotels,
  pricingSeason,
  setPricingSeason,
  priceFreezes,
  onAddPriceFreeze,
  onRemovePriceFreeze,
  onCreateBookingFromFreeze,
  triggerNotification
}: PricingEngineHubProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>("fl-1");
  const [now, setNow] = useState<number>(Date.now());

  // Keep a ticking clock for countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPricingFactor = () => {
    switch (pricingSeason) {
      case "peak": return 1.15;
      case "holiday": return 1.20;
      case "offpeak": return 0.85;
      default: return 1.0;
    }
  };

  const factor = getPricingFactor();

  // Combine items for selector
  const allItems = [
    ...flights.map(f => ({ id: f.id, name: `${f.flightNumber} (${f.originCode}➔${f.destinationCode})`, type: "flight" as const, basePrice: f.basePrice })),
    ...hotels.map(h => ({ id: h.id, name: h.name, type: "hotel" as const, basePrice: h.basePricePerNight }))
  ];

  const currentItem = allItems.find(i => i.id === selectedTargetId) || allItems[0];
  const adjustedPrice = Math.round(currentItem.basePrice * factor);

  const [chartOrientation, setChartOrientation] = useState<"vertical" | "horizontal">("vertical");

  // Fictional monthly price fluctuations for price charts, uniquely seeded by item ID to prevent identical curves
  const getHistoricalData = (baseVal: number, id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const trendSeed = Math.abs(hash % 4);
    
    switch (trendSeed) {
      case 0: // Peak summer wave
        return [
          { month: "Jan", val: Math.round(baseVal * 0.82) },
          { month: "Feb", val: Math.round(baseVal * 0.85) },
          { month: "Mar", val: Math.round(baseVal * 0.98) },
          { month: "Apr", val: Math.round(baseVal * 1.05) },
          { month: "May", val: Math.round(baseVal * 1.28) },
          { month: "Jun", val: Math.round(baseVal * 1.45) }
        ];
      case 1: // Volatile business route
        return [
          { month: "Jan", val: Math.round(baseVal * 1.15) },
          { month: "Feb", val: Math.round(baseVal * 0.92) },
          { month: "Mar", val: Math.round(baseVal * 1.22) },
          { month: "Apr", val: Math.round(baseVal * 0.88) },
          { month: "May", val: Math.round(baseVal * 1.05) },
          { month: "Jun", val: Math.round(baseVal * 1.18) }
        ];
      case 2: // Promotional descent
        return [
          { month: "Jan", val: Math.round(baseVal * 1.30) },
          { month: "Feb", val: Math.round(baseVal * 1.20) },
          { month: "Mar", val: Math.round(baseVal * 1.10) },
          { month: "Apr", val: Math.round(baseVal * 0.95) },
          { month: "May", val: Math.round(baseVal * 0.88) },
          { month: "Jun", val: Math.round(baseVal * 0.92) }
        ];
      case 3:
      default: // Double hump curve
        return [
          { month: "Jan", val: Math.round(baseVal * 0.90) },
          { month: "Feb", val: Math.round(baseVal * 1.18) },
          { month: "Mar", val: Math.round(baseVal * 0.85) },
          { month: "Apr", val: Math.round(baseVal * 0.95) },
          { month: "May", val: Math.round(baseVal * 1.25) },
          { month: "Jun", val: Math.round(baseVal * 1.10) }
        ];
    }
  };

  const historyPoints = getHistoricalData(currentItem.basePrice, currentItem.id);

  // SVG dimensions for custom price chart
  const width = 450;
  const height = 150;
  const padding = 25;
  const maxVal = Math.max(...historyPoints.map(p => p.val)) * 1.05;
  const minVal = Math.min(...historyPoints.map(p => p.val)) * 0.95;

  const pointsString = historyPoints.map((p, idx) => {
    const x = padding + (idx * (width - padding * 2)) / (historyPoints.length - 1);
    const y = height - padding - ((p.val - minVal) * (height - padding * 2)) / (maxVal - minVal);
    return `${x},${y}`;
  }).join(" ");

  const handleApplyFreeze = () => {
    // Check if already frozen
    const alreadyFrozen = priceFreezes.some(f => f.targetId === currentItem.id);
    if (alreadyFrozen) {
      triggerNotification(
        "Freeze Blocked",
        `You already have an active price freeze locked for ${currentItem.name}.`,
        "warning"
      );
      return;
    }

    onAddPriceFreeze({
      type: currentItem.type,
      targetId: currentItem.id,
      title: currentItem.name,
      frozenPrice: adjustedPrice
    });

    triggerNotification(
      "Price Corridor Frozen",
      `Locked tariff of $${adjustedPrice} USD for ${currentItem.name}. Protected from season surge fluctuations for 15 minutes.`,
      "success"
    );
  };

  return (
    <div className="bg-panel border border-border-grid p-6 rounded-none flex flex-col gap-6" id="pricing-engine-hub">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border-grid pb-5">
        <div>
          <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-1">Dynamic Tariff Ledger</span>
          <h2 className="font-serif italic font-bold text-2xl text-typography">Economic & Pricing Engine</h2>
          <p className="text-xs text-gray-400 font-sans mt-0.5">Control global seasons and audit historical prices under the price freeze shield.</p>
        </div>

        {/* Global Season Factor Controls */}
        <div className="bg-[#141414] border border-border-grid p-3 flex flex-col gap-2 min-w-[260px]">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Zap size={11} className="text-accent animate-pulse" />
            <span>Active Environmental Season Coefficient</span>
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {(["standard", "peak", "holiday", "offpeak"] as PricingSeason[]).map((season) => (
              <button
                key={season}
                id={`season-btn-${season}`}
                onClick={() => {
                  setPricingSeason(season);
                  triggerNotification(
                    "Macro Price Adjuster",
                    `Global season coefficient converted to ${season.toUpperCase()}. Tariffs computed dynamically at ${
                      season === "holiday" ? "+20%" : season === "peak" ? "+15%" : season === "offpeak" ? "-15%" : "Standard"
                    }.`,
                    "info"
                  );
                }}
                className={`py-1.5 text-[9px] font-mono uppercase tracking-wider text-center border transition-all ${
                  pricingSeason === season
                    ? "bg-accent border-accent text-canvas font-bold"
                    : "border-border-grid text-gray-400 hover:text-white"
                }`}
              >
                {season}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Auditing & Forecasting Component */}
        <div className="lg:col-span-7 flex flex-col gap-4 border-r border-border-grid pr-0 lg:pr-6">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-gray-500 uppercase">Item Selector</span>
            <select
              id="pricing-target-selector"
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="bg-panel-light text-typography font-mono text-xs border border-border-grid px-3 py-2.5 w-full focus:outline-none focus:border-accent"
            >
              {allItems.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.type.toUpperCase()}] {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Current Live Tariff Card */}
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-border-grid bg-[#141414] p-3 flex flex-col">
              <span className="font-mono text-[9px] text-gray-500 uppercase">Catalog Base</span>
              <span className="font-mono text-base font-bold text-typography mt-1">${currentItem.basePrice} USD</span>
            </div>
            <div className="border border-border-grid bg-[#141414] p-3 flex flex-col">
              <span className="font-mono text-[9px] text-gray-500 uppercase">Active Multiplier</span>
              <span className="font-mono text-base font-bold text-accent mt-1">x{factor.toFixed(2)}</span>
            </div>
            <div className="border border-gradient-ring p-3 flex flex-col bg-accent/5 border-dashed border-accent">
              <span className="font-mono text-[10px] text-accent font-semibold uppercase">Live Active Rate</span>
              <span className="font-mono text-base font-extrabold text-typography mt-1">${adjustedPrice} USD</span>
            </div>
          </div>

          {/* Chart Section */}
          <div className="border border-border-grid p-4 bg-[#111111] flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-grid pb-2">
              <div className="flex items-center gap-2">
                <span className="font-serif italic text-xs text-gray-400">Quarterly Pricing Index (Jan - Jun)</span>
                <span className="text-[9px] font-mono bg-neutral-900 border border-zinc-800 text-gray-500 px-1.5 py-0.5 rounded-none uppercase">
                  Seed-ID: {currentItem.id}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-[#161616] border border-border-grid p-0.5">
                <button
                  id="chart-orient-vert-btn"
                  onClick={() => setChartOrientation("vertical")}
                  className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    chartOrientation === "vertical"
                      ? "bg-accent/80 text-canvas font-bold"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Price as Y-Axis vertical dimension"
                >
                  Vertical Line
                </button>
                <button
                  id="chart-orient-horiz-btn"
                  onClick={() => setChartOrientation("horizontal")}
                  className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    chartOrientation === "horizontal"
                      ? "bg-accent/80 text-canvas font-bold"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Price as X-Axis horizontal dimension"
                >
                  Horizontal Bar
                </button>
              </div>
            </div>

            {chartOrientation === "vertical" ? (
              /* SVG Visual Chart - Vertical Orientation (Y-axis stands for price scale) */
              <div className="w-full flex justify-center">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-lg bg-[#0E0E0E] overflow-visible">
                  {/* Gridlines */}
                  <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#2A2A2A" strokeWidth="1" />
                  <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#2A2A2A" strokeDasharray="3,3" strokeWidth="1" />
                  <line x1={padding} y1={(height) / 2} x2={width - padding} y2={(height) / 2} stroke="#2A2A2A" strokeDasharray="2,2" strokeWidth="0.5" />

                  {/* Y Axis Grid values */}
                  <text x={padding - 5} y={padding + 4} fill="#666" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">${Math.round(maxVal)}</text>
                  <text x={padding - 5} y={height - padding + 3} fill="#666" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">${Math.round(minVal)}</text>

                  {/* Grid Point Markers & Connecting Lines */}
                  <polyline
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="2"
                    points={pointsString}
                  />

                  {historyPoints.map((p, idx) => {
                    const x = padding + (idx * (width - padding * 2)) / (historyPoints.length - 1);
                    const y = height - padding - ((p.val - minVal) * (height - padding * 2)) / (maxVal - minVal);
                    const isLast = idx === historyPoints.length - 1;

                    return (
                      <g key={idx}>
                        <circle
                          cx={x}
                          cy={y}
                          r="4.5"
                          fill="#0F0F0F"
                          stroke={isLast ? "var(--color-accent)" : "#FFF"}
                          strokeWidth="1.5"
                        />
                        {/* Price Label */}
                        <text
                          x={x}
                          y={y - 8}
                          fill={isLast ? "var(--color-accent)" : "#F5F5F0"}
                          fontSize="9"
                          fontFamily="var(--font-mono)"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          ${p.val}
                        </text>
                        {/* Month Label */}
                        <text
                          x={x}
                          y={height - padding + 12}
                          fill="#888"
                          fontSize="8"
                          fontFamily="var(--font-sans)"
                          textAnchor="middle"
                        >
                          {p.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              /* Horizontal Bar Chart Orientation (X-axis represents price intensity, months stacked vertically) */
              <div className="w-full flex flex-col gap-2.5 py-1.5 px-1 bg-[#0E0E0E] min-h-[120px] justify-center">
                {historyPoints.map((p, idx) => {
                  const scaleMin = minVal * 0.9;
                  const scaleMax = maxVal * 1.05;
                  const ratio = (p.val - scaleMin) / (scaleMax - scaleMin);
                  const percentage = Math.max(12, Math.min(100, Math.round(ratio * 100)));
                  
                  return (
                    <div key={idx} className="flex items-center gap-3 w-full group">
                      <span className="font-mono text-[10px] text-gray-500 w-8 tracking-wider font-semibold uppercase">
                        {p.month}
                      </span>
                      <div className="flex-1 bg-[#121212] h-6 relative flex items-center overflow-hidden border border-zinc-900 group-hover:border-accent/30 transition-colors">
                        <div 
                          style={{ width: `${percentage}%` }}
                          className="bg-accent/15 border-r border-accent h-full transition-all duration-500 ease-out"
                        />
                        <span className="absolute left-3 font-mono text-[10px] text-typography font-bold flex items-center gap-1.5">
                          <span>${p.val} USD</span>
                          <span className="text-[8px] text-gray-500 font-normal">
                            ({percentage}% factor)
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            id="freeze-rate-btn"
            onClick={handleApplyFreeze}
            className="w-full mt-1.5 py-3 bg-[#1A1A1A] hover:bg-accent hover:text-canvas border border-accent text-accent font-mono font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Snowflake size={14} />
            <span>Lock & Freeze Current Price Rate</span>
          </button>
        </div>

        {/* Right Side: Active Saved Locks / Ticking Freeze Inventory */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            <div className="border-b border-border-grid pb-2">
              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">Active Frozen Ledgers</span>
              <h3 className="font-serif italic font-bold text-lg text-typography mt-1">Locked Price Inventory</h3>
            </div>

            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Locked prices stay live for 15 minutes from crystallization. Execute immediately before standard or holiday coefficients apply.
            </p>

            {/* List of active freezes */}
            <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1 mt-2">
              {priceFreezes.length > 0 ? (
                priceFreezes.map((freeze) => {
                  const timeLeftMs = freeze.expiresAt - now;
                  const isExpired = timeLeftMs <= 0;

                  // Format countdown MM:SS
                  const minutes = Math.max(0, Math.floor(timeLeftMs / 1000 / 60));
                  const seconds = Math.max(0, Math.floor((timeLeftMs / 1000) % 60));
                  const timerStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

                  return (
                    <div
                      key={freeze.id}
                      id={`freeze-row-${freeze.id}`}
                      className={`border p-3.5 bg-[#141414] flex flex-col gap-3 transition-all ${
                        isExpired ? "border-dashed border-red-950/40 opacity-50" : "border-border-grid hover:border-gray-600"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="font-mono text-[9px] text-gray-500 block uppercase">
                            {freeze.type === "flight" ? "Flight Path Locked" : "Suite Allotment Locked"}
                          </span>
                          <span className="font-serif italic font-bold text-[14px] text-typography leading-tight">
                            {freeze.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-accent/5 border border-accent/20 font-mono text-[10px] text-accent animate-pulse">
                          <Timer size={11} />
                          <span>{isExpired ? "EXPIRED" : timerStr}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-[#1D1D1D] p-2 text-xs font-mono">
                        <span className="text-gray-400">Guaranteed rate:</span>
                        <span className="text-typography font-bold text-[14px]">${freeze.frozenPrice} USD</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          id={`book-freeze-${freeze.id}`}
                          disabled={isExpired}
                          onClick={() => {
                            onCreateBookingFromFreeze(freeze);
                          }}
                          className="flex-1 py-1 px-3 bg-accent text-canvas font-mono font-bold uppercase tracking-wider text-[10px] hover:bg-accent/95 disabled:bg-gray-800 disabled:text-gray-600 transition-all cursor-pointer"
                        >
                          Book at frozen rate
                        </button>
                        <button
                          id={`release-freeze-${freeze.id}`}
                          onClick={() => {
                            onRemovePriceFreeze(freeze.id);
                            triggerNotification(
                              "Freeze Released",
                              `Voluntary release of locked rate for ${freeze.title}.`,
                              "info"
                            );
                          }}
                          className="py-1 px-2.5 border border-border-grid font-mono text-[10px] text-gray-400 hover:text-white hover:border-gray-500 transition-all cursor-pointer"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="border border-border-grid border-dashed p-8 text-center italic text-xs text-gray-500 bg-[#111111] flex flex-col items-center gap-2">
                  <Bookmark size={20} className="text-gray-600" />
                  <span>No active locked price records detected in dispatch session.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick tip */}
          <div className="mt-4 pt-4 border-t border-border-grid/50 flex items-start gap-2.5 text-[10px] text-gray-500 font-sans leading-relaxed">
            <ShieldCheck size={14} className="text-gray-400 shrink-0" />
            <span>
              The Dynamic Pricing Engine evaluates high search corridors every minute. Utilize the fee-free lock mechanism to claim a 15-minute price shield.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
