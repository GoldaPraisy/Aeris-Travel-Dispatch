/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Flight, Notification } from "../types";
import { Radio, AlertCircle, Plane, Clock, Navigation, Play, Pause, RadioTower, Globe, HardDrive } from "lucide-react";

interface LiveFlightStatusTrackProps {
  flights: Flight[];
  onUpdateFlights: (updated: Flight[]) => void;
  triggerNotification: (title: string, message: string, type: "info" | "alert" | "success" | "warning") => void;
}

// -------------------------------------------------------------
// SATELLITE RADAR/FEED GEO-PROJECTION ENGINE
// Draws real-time satellite orbit tracks with pulsing signal arcs
// -------------------------------------------------------------
interface SatelliteMapProps {
  flight: Flight;
  isSimulating: boolean;
}

function SatelliteMapVisualizer({ flight, isSimulating }: SatelliteMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [satelliteAngle, setSatelliteAngle] = useState<number>(0);
  const [pulseRadius, setPulseRadius] = useState<number>(0);

  // Animate the satellite and communication pulse wave
  useEffect(() => {
    let animId: number;
    const tick = () => {
      setSatelliteAngle((prev) => (prev + 0.01) % (Math.PI * 2));
      setPulseRadius((prev) => (prev + 1) % 50);
      animId = requestAnimationFrame(tick);
    };

    if (isSimulating) {
      animId = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animId);
  }, [isSimulating]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Dark grid background
    ctx.fillStyle = "#0c0c0c";
    ctx.fillRect(0, 0, w, h);

    // Tactical Radar Sweep line
    ctx.strokeStyle = "rgba(16, 185, 129, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < w; x += 30) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += 30) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Map outlines (Simulated stylized coordinates vector map)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 1.5;

    // Drawing simulated continents (outline polygons)
    const contours = [
      // North America
      [[20, 40], [60, 30], [90, 50], [80, 80], [40, 110], [15, 60]],
      // Europe/Asia
      [[150, 20], [210, 30], [250, 15], [310, 40], [330, 80], [270, 120], [200, 100], [160, 50]],
      // Japan / Islands
      [[320, 60], [335, 75], [315, 90]],
      // Africa
      [[140, 100], [180, 120], [195, 155], [170, 190], [145, 160], [130, 125]]
    ];

    contours.forEach((polygon) => {
      ctx.beginPath();
      polygon.forEach(([x, y], idx) => {
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // Determine the coordinates based on flight routing codes
    // mapping locations
    const airports: { [key: string]: [number, number] } = {
      "CDG": [155, 45],  // Paris
      "NRT": [323, 70],  // Tokyo Narita
      "SFO": [40, 65],   // San Francisco
      "ORD": [65, 55],   // Chicago
      "FRA": [168, 40]   // Frankfurt
    };

    const p1 = airports[flight.originCode] || [100, 60];
    const p2 = airports[flight.destinationCode] || [280, 90];

    // Draw routing arc
    ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    // Bezier control point for elegant curved transoceanic track
    const cx = (p1[0] + p2[0]) / 2;
    const cy = Math.min(p1[1], p2[1]) - 35;
    ctx.quadraticCurveTo(cx, cy, p2[0], p2[1]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Draw Location Beacons
    Object.entries(airports).forEach(([code, [ax, ay]]) => {
      const isTarget = code === flight.originCode || code === flight.destinationCode;
      ctx.fillStyle = isTarget ? "#10b981" : "rgba(156, 163, 175, 0.4)";
      ctx.beginPath();
      ctx.arc(ax, ay, isTarget ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing lock circle for airports active
      if (isTarget) {
        ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ax, ay, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = "bold 8px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(code, ax - 8, ay - 8);
      }
    });

    // Calculate live plane position along bezier arc
    // We can simulate its progress using the ETA.
    // ETA ranges from 0 to 500. Less eta = closer to destination.
    const maxEta = 480;
    const ratio = Math.max(0, Math.min(1, (maxEta - flight.etaMinutes) / maxEta));

    // Bezier position interpolation
    const t = ratio;
    const planeX = (1 - t) * (1 - t) * p1[0] + 2 * (1 - t) * t * cx + t * t * p2[0];
    const planeY = (1 - t) * (1 - t) * p1[1] + 2 * (1 - t) * t * cy + t * t * p2[1];

    // DRAW AIRPLANE SYMBOL OVER RADAR
    ctx.save();
    ctx.translate(planeX, planeY);
    
    // Calculate angle tangent to route
    const tangentX = 2 * (1 - t) * (cx - p1[0]) + 2 * t * (p2[0] - cx);
    const tangentY = 2 * (1 - t) * (cy - p1[1]) + 2 * t * (p2[1] - cy);
    const planeAngle = Math.atan2(tangentY, tangentX);
    ctx.rotate(planeAngle);

    // Plane outline vector (Neon Emerald)
    ctx.strokeStyle = "#10b981";
    ctx.fillStyle = "#0c0c0c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-5, -6);
    ctx.lineTo(-3, -2);
    ctx.lineTo(-8, -1);
    ctx.lineTo(-8, 1);
    ctx.lineTo(-3, 2);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Pulse communcation waves from airplane
    ctx.strokeStyle = "rgba(16, 185, 129, " + (1 - pulseRadius / 50) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(planeX, planeY, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // DRAW SATELLITE IN GEOSYNC CORRIDOR
    // Satellite moves dynamically along a slow circular orbit centered at top
    const satCenterX = w / 2;
    const satCenterY = -5;
    const satRadiusX = 130;
    const satRadiusY = 35;
    
    const satX = satCenterX + Math.cos(satelliteAngle) * satRadiusX;
    const satY = satCenterY + Math.sin(satelliteAngle) * satRadiusY;

    // Draw orbiting track
    ctx.strokeStyle = "rgba(56, 189, 248, 0.1)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(satCenterX, satCenterY, satRadiusX, satRadiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Satellite node (Cyan Blue)
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(satX, satY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Satellite solar panels
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(satX - 8, satY);
    ctx.lineTo(satX + 8, satY);
    ctx.stroke();

    // Draw Telemetry beam linking satellite to active flight
    ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(satX, satY);
    ctx.lineTo(planeX, planeY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // Text Overlay values
    ctx.font = "bold 8px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("SAT: GEOSYNC-AERIS-V", satX - 25, satY - 8);

    ctx.font = "8px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillText("SATELLITE DOWNLINK STATUS: SECURE (100% SIGNAL)", 8, h - 30);
    ctx.fillText(`GEO-LOCK LAT: ${(25.3214 + ratio * 15).toFixed(4)}° N | LON: ${(110.1425 + ratio * 30).toFixed(4)}° E`, 8, h - 18);
    ctx.fillText("SOURCE FEED: SATELLITE L1 TELEMETRY TRANSCEIVER", 8, h - 6);

    // Frame Borders
    ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);

    // Pulsing REC icon in top right
    ctx.fillStyle = isSimulating ? "#ef4444" : "#6b7280";
    ctx.beginPath();
    ctx.arc(w - 18, 16, 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (isSimulating && Math.floor(Date.now() / 1000) % 2 === 0) {
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "#ef4444";
      ctx.fillText("SAT-FEED", w - 74, 19);
    }
  }, [satelliteAngle, pulseRadius, flight, isSimulating]);

  return (
    <div className="relative border border-border-grid bg-[#0a0a0a] rounded-none overflow-hidden h-64 w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={360}
        height={256}
        className="w-full h-full block"
      />
    </div>
  );
}

export default function LiveFlightStatusTrack({
  flights,
  onUpdateFlights,
  triggerNotification
}: LiveFlightStatusTrackProps) {
  const [trackedFlightIds, setTrackedFlightIds] = useState<string[]>(["fl-1", "fl-2"]);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>("fl-1");

  // Simulated real-time updates for tracked flights
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      onUpdateFlights(
        flights.map((flight) => {
          if (!trackedFlightIds.includes(flight.id)) return flight;

          // Introduce minor real-time variations (altitude, speed, countdown)
          let updatedAltitude = flight.altitude;
          let updatedSpeed = flight.speed;
          let updatedEta = flight.etaMinutes;
          let updatedStatus = flight.status;
          let updatedDelayReason = flight.delayReason;
          let updatedRevised = flight.revisedSchedule;

          if (flight.status === "On Time") {
            if (updatedEta > 5) {
              updatedEta -= 1;
            } else if (updatedEta <= 5 && updatedEta > 0) {
              updatedStatus = "Boarding";
              triggerNotification(
                `Flight ${flight.flightNumber} Status Alteration`,
                `Gate coordinates locked. ${flight.flightNumber} to ${flight.destinationCode} is now Boarding at ${flight.gate}.`,
                "warning"
              );
            }

            if (flight.altitude && flight.altitude.includes("ft")) {
              const altNum = parseInt(flight.altitude.replace(/[^0-9]/g, ""));
              const nextAlt = altNum + (Math.random() > 0.5 ? 100 : -100);
              updatedAltitude = `${nextAlt.toLocaleString()} ft`;
            }
            if (flight.speed && flight.speed.includes("kts")) {
              const speedNum = parseInt(flight.speed.replace(/[^0-9]/g, ""));
              const nextSpeed = speedNum + (Math.random() > 0.5 ? 5 : -5);
              updatedSpeed = `${nextSpeed} kts`;
            }
          } else if (flight.status === "Delayed") {
            if (Math.random() > 0.85) {
              updatedStatus = "On Time";
              updatedEta = 340;
              updatedDelayReason = undefined;
              updatedRevised = undefined;
              updatedAltitude = "31,000 ft";
              updatedSpeed = "480 kts";
              triggerNotification(
                `Delay Resolved: ${flight.flightNumber}`,
                `Weather clearance achieved for route ${flight.originCode} ➔ ${flight.destinationCode}. Flight is now ON TIME.`,
                "success"
              );
            }
          } else if (flight.status === "Boarding") {
            if (Math.random() > 0.90) {
              updatedStatus = "On Time";
              updatedEta = 450;
              updatedAltitude = "10,000 ft (Climbing)";
              updatedSpeed = "320 kts";
              triggerNotification(
                `Flight Departure: ${flight.flightNumber}`,
                `${flight.flightNumber} has successfully pushed back from ${flight.gate} and is airborne.`,
                "info"
              );
            }
          }

          return {
            ...flight,
            status: updatedStatus,
            delayReason: updatedDelayReason,
            revisedSchedule: updatedRevised,
            etaMinutes: updatedEta,
            altitude: updatedAltitude,
            speed: updatedSpeed
          };
        })
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [isSimulating, trackedFlightIds, flights, onUpdateFlights, triggerNotification]);

  const toggleTracking = (id: string) => {
    if (trackedFlightIds.includes(id)) {
      if (trackedFlightIds.length === 1) {
        triggerNotification(
          "Tracking Core Restriction",
          "At least one active vector must remain in the telemetry tracker.",
          "warning"
        );
        return;
      }
      setTrackedFlightIds(trackedFlightIds.filter((fId) => fId !== id));
      triggerNotification("Vector Untracked", `Ceased simultaneous tracking of Flight ${id}.`, "info");
    } else {
      setTrackedFlightIds([...trackedFlightIds, id]);
      const targetFl = flights.find(f => f.id === id);
      triggerNotification(
        "Vector Locked",
        `Simultaneous telemetry locked on ${targetFl?.flightNumber || id} | ${targetFl?.originCode}➔${targetFl?.destinationCode}`,
        "success"
      );
    }
  };

  const simulateIncident = (type: "delay" | "boarding" | "timeChange") => {
    if (!selectedFlightId) return;
    const target = flights.find((f) => f.id === selectedFlightId);
    if (!target) return;

    let updated: Flight = { ...target };

    if (type === "delay") {
      updated.status = "Delayed";
      updated.delayReason = "Air traffic control density overhead departure corridor due to flight grid saturation.";
      updated.revisedSchedule = "Revised departure rescheduled +45 mins. Est arrival: +50 mins.";
      updated.altitude = "0 ft (Holding)";
      updated.speed = "0 kts";
      triggerNotification(
        `INCIDENT ALERT: ${target.flightNumber}`,
        `Flight delayed by +45m due to severe air traffic control density. Revised schedules dispatched.`,
        "alert"
      );
    } else if (type === "boarding") {
      updated.status = "Boarding";
      updated.altitude = "0 ft (Pre-flight check)";
      updated.speed = "0 kts";
      triggerNotification(
        `BOARDING REPORT: ${target.flightNumber}`,
        `Now boarding terminal group alpha/beta at ${target.gate}. Prepare boarding credentials.`,
        "success"
      );
    } else if (type === "timeChange") {
      updated.status = "On Time";
      updated.departureTime = "14:15";
      updated.etaMinutes = Math.max(10, target.etaMinutes - 30);
      triggerNotification(
        `SCHEDULE ADVISORY: ${target.flightNumber}`,
        `Departure slot optimized. Flight scheduled early at 14:15. Revised ETA applied.`,
        "info"
      );
    }

    onUpdateFlights(flights.map((f) => (f.id === selectedFlightId ? updated : f)));
  };

  const selectedFlight = flights.find(f => f.id === selectedFlightId) || flights[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-panel p-6 border border-border-grid rounded-none shadow-sm" id="flight-status-track-container">
      {/* Flight Controller Pane (Left Side) */}
      <div className="lg:col-span-4 flex flex-col gap-4 border-r border-border-grid pr-0 lg:pr-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="text-secondary-accent animate-pulse text-accent" size={18} />
            <span className="font-serif italic font-semibold text-lg text-typography">Telemetry Registry</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1A1A1A] p-1 border border-border-grid">
            <button
              id="simulation-toggle-btn"
              onClick={() => setIsSimulating(!isSimulating)}
              className={`p-1.5 transition-all text-xs font-mono uppercase tracking-wider flex items-center gap-1 ${
                isSimulating ? "bg-accent text-canvas font-bold" : "text-gray-500 hover:text-white"
              }`}
              title={isSimulating ? "Pause live data drift" : "Resume live data drift"}
            >
              {isSimulating ? <Pause size={12} /> : <Play size={12} />}
              <span>{isSimulating ? "Live" : "Stale"}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 font-sans leading-relaxed">
          Select individual vectors to audit status charts. Toggle the radar track box to configure continuous geosynchronous satellite tracking in real-time.
        </p>

        {/* Flight list */}
        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[340px] pr-1">
          {flights.map((flight) => {
            const isTracked = trackedFlightIds.includes(flight.id);
            const isSelected = selectedFlightId === flight.id;

            return (
              <div
                key={flight.id}
                id={`flight-card-${flight.id}`}
                onClick={() => setSelectedFlightId(flight.id)}
                className={`group cursor-pointer p-3 border transition-all flex flex-col gap-2 ${
                  isSelected ? "border-accent bg-[#1A1A1A]" : "border-border-grid hover:border-gray-600 bg-panel"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-accent font-semibold">{flight.flightNumber}</span>
                    {flight.isRealApiData && (
                      <span className="inline-flex items-center px-1 bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-[7px] uppercase tracking-widest font-mono scale-90">
                        API Live
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 animate-fade">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-none uppercase tracking-wide ${
                        flight.status === "On Time"
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"
                          : flight.status === "Delayed"
                          ? "bg-amber-950/40 text-amber-400 border border-amber-900/40"
                          : "bg-red-950/40 text-red-500 border border-red-950/40"
                      }`}
                    >
                      {flight.status}
                    </span>
                    <button
                      id={`radar-toggle-${flight.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTracking(flight.id);
                      }}
                      className={`text-[9px] font-mono uppercase tracking-wider border px-1.5 py-0.5 transition-all ${
                        isTracked
                          ? "border-accent bg-accent/10 text-accent font-semibold"
                          : "border-border-grid text-gray-400 hover:text-white"
                      }`}
                    >
                      {isTracked ? "Radar ON" : "Radar OFF"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-sans text-typography">
                  <div>
                    <span className="font-semibold block">{flight.originCode}</span>
                    <span className="text-[10px] text-gray-500">{flight.departureTime}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center px-4 relative">
                    <div className="w-full border-b border-dashed border-border-grid absolute top-1/2 left-0 transform -translate-y-1/2" />
                    <Plane size={11} className={`text-gray-500 z-10 ${flight.status === "On Time" && isSimulating ? "animate-pulse" : ""}`} />
                  </div>
                  <div className="text-right">
                    <span className="font-semibold block">{flight.destinationCode}</span>
                    <span className="text-[10px] text-gray-500">{flight.arrivalTime}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Status Display Screen (Center-Right) */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        {selectedFlight ? (
          <>
            {/* Header Telemetry */}
            <div className="border border-border-grid p-4 bg-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] text-gray-400 block tracking-wider uppercase flex items-center flex-wrap gap-2">
                  <span>Active Dispatch Profile</span>
                  {selectedFlight.isRealApiData && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-cyan-950/40 border border-cyan-800 text-cyan-400 text-[8px] uppercase tracking-widest font-mono font-semibold animate-pulse">
                      ● Live Worldwide Route API Link
                    </span>
                  )}
                </span>
                <h3 className="font-serif italic font-bold text-2xl text-typography flex items-center gap-2 mt-1">
                  {selectedFlight.carrier} <span className="font-mono not-italic text-sm text-accent">({selectedFlight.flightNumber})</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-xs font-mono text-xs">
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase">Route Vectors</span>
                  <span className="text-typography">{selectedFlight.originCode} ➔ {selectedFlight.destinationCode}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase">Base Fare</span>
                  <span className="text-accent">${selectedFlight.basePrice} USD</span>
                </div>
              </div>
            </div>

            {/* LIVE SATELLITE VISUAL MAP SCREEN */}
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-1 flex items-center gap-1">
                <Globe size={11} className="animate-spin text-accent" />
                <span>Active Geo-Synchronous Satellite Downlink Tracker</span>
              </span>
              <SatelliteMapVisualizer
                flight={selectedFlight}
                isSimulating={isSimulating}
              />
            </div>

            {/* Tactical Grid Screen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-border-grid bg-[#111111]" style={{ fontFamily: "var(--font-mono)" }}>
              <div className="p-3 border border-border-grid bg-[#151515]">
                <span className="text-[9px] text-gray-500 block uppercase tracking-wider">Gate Assignment</span>
                <span className="text-sm font-semibold text-typography block mt-1">{selectedFlight.gate}</span>
              </div>
              <div className="p-3 border border-border-grid bg-[#151515]">
                <span className="text-[9px] text-gray-500 block uppercase tracking-wider">Est Time Enroute</span>
                <span className="text-sm font-semibold text-typography block mt-1">{selectedFlight.duration}</span>
              </div>
              <div className="p-3 border border-border-grid bg-[#151515]">
                <span className="text-[9px] text-gray-500 block uppercase tracking-wider">Telemetry Altitude</span>
                <span className="text-sm font-semibold text-accent block mt-1">{selectedFlight.altitude || "35,000 ft"}</span>
              </div>
              <div className="p-3 border border-border-grid bg-[#151515]">
                <span className="text-[9px] text-gray-500 block uppercase tracking-wider">Avionic Airspeed</span>
                <span className="text-sm font-semibold text-accent block mt-1">{selectedFlight.speed || "490 kts"}</span>
              </div>
            </div>

            {/* Live Delay Context Notice / ETA Timeline */}
            <div className="p-4 border border-border-grid bg-[#181818] flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border-grid pb-2">
                <span className="font-serif italic text-sm text-typography">Estimations & Timelines</span>
                <div className="flex items-center gap-1.5 text-xs text-accent font-mono">
                  <Clock size={12} />
                  <span>ETA countdown: {Math.max(0, selectedFlight.etaMinutes)} minutes remaining</span>
                </div>
              </div>

              {selectedFlight.status === "Delayed" ? (
                <div className="flex items-start gap-3 bg-amber-950/20 border border-amber-900/30 p-3 italic text-xs text-amber-300 animate-fade">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold font-mono not-italic block uppercase tracking-wider mb-1 text-[10px]">Delay Cause Registry:</span>
                    <p>{selectedFlight.delayReason}</p>
                    {selectedFlight.revisedSchedule && (
                      <p className="mt-1.5 font-mono not-italic font-semibold text-[10px] text-typography bg-[#221A0F] inline-block px-1.5 py-0.5 border border-amber-800/40">
                        {selectedFlight.revisedSchedule}
                      </p>
                    )}
                  </div>
                </div>
              ) : selectedFlight.status === "Boarding" ? (
                <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 p-3 italic text-xs text-accent animate-fade">
                  <RadioTower size={15} className="mt-0.5 shrink-0 animate-bounce" />
                  <div>
                    <span className="font-bold font-mono not-italic block uppercase tracking-wider mb-1 text-[10px]">Gate Radio Broadcast:</span>
                    <p>Passenger boarding processes initialized at {selectedFlight.gate}. Telemetry suggests departure clearance shortly.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-emerald-950/20 border border-emerald-900/30 p-3 text-xs text-emerald-400 animate-fade">
                  <Navigation size={15} className="mt-0.5 shrink-0 animate-pulse text-emerald-500" />
                  <div>
                    <span className="font-bold font-mono block uppercase tracking-wider mb-1 text-[10px]">Route Optimization Status:</span>
                    <p>Atmospheric weather corridors cleared. {selectedFlight.flightNumber} cruising efficiently with zero delay conditions logged.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Event Toggles (Proof of Concept Controls) */}
            <div className="border border-border-grid p-4 bg-[#141414]">
              <span className="font-mono text-[9px] text-gray-500 block uppercase tracking-wider mb-2.5">Mock API Avionics Control (Simulation Deck)</span>
              <div className="flex flex-wrap gap-2">
                <button
                  id="simulate-delay-btn"
                  onClick={() => simulateIncident("delay")}
                  className="px-3 py-1.5 border border-amber-900/40 hover:border-amber-700 bg-amber-950/20 text-amber-400 transition-all text-xs font-mono cursor-pointer"
                >
                  Force Delay Incident (API)
                </button>
                <button
                  id="simulate-boarding-btn"
                  onClick={() => simulateIncident("boarding")}
                  className="px-3 py-1.5 border border-red-950/40 hover:border-red-950 bg-red-950/20 text-red-500 transition-all text-xs font-mono cursor-pointer"
                >
                  Force Boarding Event (API)
                </button>
                <button
                  id="simulate-schedule-btn"
                  onClick={() => simulateIncident("timeChange")}
                  className="px-3 py-1.5 border border-blue-900/40 hover:border-blue-700 bg-blue-950/20 text-blue-400 transition-all text-xs font-mono cursor-pointer"
                >
                  Optimize Schedule Slot (API)
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 border border-border-grid border-dashed text-gray-500 rounded-none bg-[#111111]">
            <Radio size={36} className="animate-pulse mb-3" />
            <span className="font-serif italic">No Flight Vector Loaded</span>
            <span className="text-xs font-sans mt-1">Select a flight from the registry on the left to review metrics</span>
          </div>
        )}
      </div>
    </div>
  );
}
