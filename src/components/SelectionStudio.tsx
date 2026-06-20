/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Flight, Hotel, Booking } from "../types";
import { Plane, Home, Shield, Sparkles, Check, Armchair, RotateCcw, ZoomIn, ZoomOut, Compass } from "lucide-react";

interface SelectionStudioProps {
  flights: Flight[];
  hotels: Hotel[];
  bookings: Booking[];
  onSavePreferences: (bookingId: string, itemType: "seat" | "room", value: string, priceDelta: number) => void;
  triggerNotification: (title: string, message: string, type: "info" | "alert" | "success" | "warning") => void;
}

// -------------------------------------------------------------
// HELPER FOR REAL-TIME WIREFRAME 3D PROJECTION CANVAS
// -------------------------------------------------------------
interface Wireframe3DProps {
  type: "seat" | "room";
  selectedValue: string; // e.g. "8A" or "Deluxe Upgraded"
  onStatusUpdate?: (msg: string) => void;
}

function Wireframe3DPreview({ type, selectedValue, onStatusUpdate }: Wireframe3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [yaw, setYaw] = useState<number>(45);
  const [pitch, setPitch] = useState<number>(-25);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameId = useRef<number | null>(null);
  const autoRotateRef = useRef<boolean>(true);

  // Auto-rotation incremental effect when not dragging
  useEffect(() => {
    let lastTime = Date.now();
    const tick = () => {
      if (autoRotateRef.current) {
        setYaw((y) => (y + 0.3) % 360);
      }
      animFrameId.current = requestAnimationFrame(tick);
    };
    animFrameId.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  // Projection math
  const transformPoint = (x: number, y: number, z: number, w: number, h: number) => {
    // Apply zoom
    const sx = x * zoom;
    const sy = y * zoom;
    const sz = z * zoom;

    // Yaw rotation (about Y axis)
    const sinYaw = Math.sin((yaw * Math.PI) / 180);
    const cosYaw = Math.cos((yaw * Math.PI) / 180);
    const x1 = sx * cosYaw - sz * sinYaw;
    const z1 = sx * sinYaw + sz * cosYaw;

    // Pitch rotation (about X axis)
    const sinPitch = Math.sin((pitch * Math.PI) / 180);
    const cosPitch = Math.cos((pitch * Math.PI) / 180);
    const y2 = sy * cosPitch - z1 * sinPitch;
    const z2 = sy * sinPitch + z1 * cosPitch;

    // Isometric / Orthographic perspective projection with camera offset
    const distance = 250;
    const scale = distance / (distance + z2 * 0.4);
    const px = x1 * scale + w / 2;
    const py = -y2 * scale + h / 2;

    return { x: px, y: py, depth: z2 };
  };

  // Draw wireframe of cabin or room on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid details
    const themeColor = type === "seat" ? "#10b981" : "#f59e0b"; // green for avionic seat, gold for hotel room
    const ambientBg = type === "seat" ? "rgba(16, 185, 129, 0.05)" : "rgba(245, 158, 11, 0.03)";

    // DRAW BACKGROUND RADAR / SCAN GRAPHICS
    ctx.strokeStyle = "rgba(100, 100, 100, 0.15)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i < w; i += 40) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
    }
    for (let j = 0; j < h; j += 40) {
      ctx.moveTo(0, j);
      ctx.lineTo(w, j);
    }
    ctx.stroke();

    // Polar lines
    ctx.strokeStyle = "rgba(100, 100, 100, 0.2)";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.45, 0, Math.PI * 2);
    ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.3, 0, Math.PI * 2);
    ctx.stroke();

    // Ambient wireframe grid box
    ctx.fillStyle = ambientBg;
    ctx.fillRect(10, 10, w - 20, h - 20);

    // -------------------------------------------------------------
    // RENDER ROOM TIER / SEAT GEOMETRY
    // -------------------------------------------------------------
    if (type === "room") {
      // Draw 3D Hotel Room Model (bed, television shelf, pool, doors)
      const lines: Array<{ p1: [number, number, number]; p2: [number, number, number]; color: string; width: number }> = [];

      // Main room bounding walls
      const sizeX = 80;
      const sizeY = 45;
      const sizeZ = 80;

      // Outer room cuboid floor bounds
      const points = [
        [-sizeX, -sizeY, -sizeZ], // 0: bottom L - front
        [sizeX, -sizeY, -sizeZ],  // 1: bottom R - front
        [sizeX, -sizeY, sizeZ],   // 2: bottom R - back
        [-sizeX, -sizeY, sizeZ],  // 3: bottom L - back
        [-sizeX, sizeY, -sizeZ],  // 4: top L - front
        [sizeX, sizeY, -sizeZ],   // 5: top R - front
        [sizeX, sizeY, sizeZ],    // 6: top R - back
        [-sizeX, sizeY, sizeZ],   // 7: top L - back
      ];

      // Outline floors & ceilings
      const addBoxLines = (pts: number[][], color: string, wScale = 1) => {
        const indices = [
          [0, 1], [1, 2], [2, 3], [3, 0], // floor
          [4, 5], [5, 6], [6, 7], [7, 4], // ceiling
          [0, 4], [1, 5], [2, 6], [3, 7], // columns
        ];
        indices.forEach(([a, b]) => {
          lines.push({
            p1: pts[a] as [number, number, number],
            p2: pts[b] as [number, number, number],
            color,
            width: wScale
          });
        });
      };

      // Room bounds (subtle charcoal grey)
      addBoxLines(points, "rgba(255, 255, 255, 0.15)", 0.5);

      // Bed Frame vertices
      // Bed positioned at back right corner
      const bx1 = 10;
      const bx2 = 70;
      const by1 = -sizeY;
      const by2 = -sizeY + 15;
      const bz1 = -10;
      const bz2 = 65;

      const bedPts = [
        [bx1, by1, bz1], [bx2, by1, bz1], [bx2, by1, bz2], [bx1, by1, bz2], // Bed bottom
        [bx1, by2, bz1], [bx2, by2, bz1], [bx2, by2, bz2], [bx1, by2, bz2], // Bed top
      ];
      // Draw bed structure (amber gold)
      const isPenthouse = selectedValue === "Premium Executive";
      const isDeluxe = selectedValue === "Deluxe Upgraded";
      const primaryGold = isPenthouse ? "#ef4444" : isDeluxe ? "#f59e0b" : "#b45309";
      
      bedPts.forEach((_, idx) => {
        // Floor relations
        const indices = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7]
        ];
        indices.forEach(([a, b]) => {
          lines.push({
            p1: bedPts[a] as [number, number, number],
            p2: bedPts[b] as [number, number, number],
            color: primaryGold,
            width: 1.5
          });
        });
      });

      // Pillow block
      const pilPts = [
        [bx1 + 10, by2, bz2 - 15], [bx2 - 10, by2, bz2 - 15], [bx2 - 10, by2, bz2 - 5], [bx1 + 10, by2, bz2 - 5],
        [bx1 + 10, by2 + 5, bz2 - 15], [bx2 - 10, by2 + 5, bz2 - 15], [bx2 - 10, by2 + 5, bz2 - 5], [bx1 + 10, by2 + 5, bz2 - 5]
      ];
      pilPts.forEach((_, idx) => {
        const indices = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
        indices.forEach(([a,b]) => {
          lines.push({
            p1: pilPts[a] as [number, number, number],
            p2: pilPts[b] as [number, number, number],
            color: "rgba(255, 255, 255, 0.4)",
            width: 1
          });
        });
      });

      // Special items inside Room
      if (isPenthouse) {
        // Crimson obsidian Penthouse: Adds continuous glowing pool inside corner & starlight ceiling track
        // Pool at back left
        const px1 = -70;
        const px2 = -20;
        const py1 = -sizeY;
        const py2 = -sizeY + 8;
        const pz1 = 10;
        const pz2 = 60;
        const poolPts = [
          [px1, py1, pz1], [px2, py1, pz1], [px2, py1, pz2], [px1, py1, pz2],
          [px1, py2, pz1], [px2, py2, pz1], [px2, py2, pz2], [px1, py2, pz2]
        ];
        poolPts.forEach((_, idx) => {
          const indices = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
          indices.forEach(([a,b]) => {
            lines.push({
              p1: poolPts[a] as [number, number, number],
              p2: poolPts[b] as [number, number, number],
              color: "#38bdf8", // Glowing cyan water ring
              width: 1.5
            });
          });
        });

        // Draw starlight ceiling lines
        lines.push({ p1: [-sizeX * 0.5, sizeY, -sizeZ * 0.5], p2: [sizeX * 0.5, sizeY, sizeZ * 0.5], color: "rgba(239, 68, 68, 0.6)", width: 1 });
        lines.push({ p1: [-sizeX * 0.5, sizeY, sizeZ * 0.5], p2: [sizeX * 0.5, sizeY, -sizeZ * 0.5], color: "rgba(239, 68, 68, 0.6)", width: 1 });
      } else if (isDeluxe) {
        // Luxury Spa Tub
        const tx = -55;
        const ty1 = -sizeY;
        const ty2 = -sizeY + 12;
        const tz = 40;
        const rad = 20;
        // Circular cedar tub represented via octagon layers
        for (let th = 0; th < 360; th += 45) {
          const r1 = (th * Math.PI) / 180;
          const r2 = ((th + 45) * Math.PI) / 180;
          const px1 = tx + Math.cos(r1) * rad;
          const pz1 = tz + Math.sin(r1) * rad;
          const px2 = tx + Math.cos(r2) * rad;
          const pz2 = tz + Math.sin(r2) * rad;
          // Bottom circle
          lines.push({ p1: [px1, ty1, pz1], p2: [px2, ty1, pz2], color: "#b45309", width: 1.5 });
          // Top circle
          lines.push({ p1: [px1, ty2, pz1], p2: [px2, ty2, pz2], color: "#b45309", width: 1.5 });
          // Ribs
          lines.push({ p1: [px1, ty1, pz1], p2: [px1, ty2, pz1], color: "#d97706", width: 1 });
        }
      } else {
        // Standard cozy details - simple small table next to standard bed
        const tx1 = -50;
        const tx2 = -30;
        const ty1 = -sizeY;
        const ty2 = -sizeY + 20;
        const tz1 = 15;
        const tz2 = 35;
        const tabPts = [
          [tx1, ty1, tz1], [tx2, ty1, tz1], [tx2, ty1, tz2], [tx1, ty1, tz2],
          [tx1, ty2, tz1], [tx2, ty2, tz1], [tx2, ty2, tz2], [tx1, ty2, tz2]
        ];
        tabPts.forEach((_, idx) => {
          const indices = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
          indices.forEach(([a,b]) => {
            lines.push({
              p1: tabPts[a] as [number, number, number],
              p2: tabPts[b] as [number, number, number],
              color: "rgba(255, 255, 255, 0.2)",
              width: 0.8
            });
          });
        });
      }

      // -------------------------------------------------------------
      // DRAW ROOM WIREFRAME ON SCREEN
      // -------------------------------------------------------------
      // Sort lines by depth for painter algorithm
      const projectedLines = lines.map((line) => {
        const trans1 = transformPoint(line.p1[0], line.p1[1], line.p1[2], w, h);
        const trans2 = transformPoint(line.p2[0], line.p2[1], line.p2[2], w, h);
        const avgDepth = (trans1.depth + trans2.depth) / 2;
        return { trans1, trans2, color: line.color, width: line.width, depth: avgDepth };
      });

      // Process and render
      projectedLines.sort((a, b) => b.depth - a.depth);
      projectedLines.forEach((pline) => {
        ctx.strokeStyle = pline.color;
        ctx.lineWidth = pline.width;
        ctx.beginPath();
        ctx.moveTo(pline.trans1.x, pline.trans1.y);
        ctx.lineTo(pline.trans2.x, pline.trans2.y);
        ctx.stroke();
      });

      // Render glowing nodes inside Room
      ctx.fillStyle = primaryGold;
      projectedLines.forEach((pline) => {
        if (pline.width > 1.2) {
          ctx.beginPath();
          ctx.arc(pline.trans1.x, pline.trans1.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

    } else {
      // -------------------------------------------------------------
      // 3D SEAT/PLANE CABIN PROFILE PREVIEW
      // -------------------------------------------------------------
      // Render a wireframe model of the plane fuselage section with selected seat highlighted in neon green!
      const lines: Array<{ p1: [number, number, number]; p2: [number, number, number]; color: string; width: number }> = [];

      // Plane cylinder bounds
      const radius = 60;
      const length = 110;
      const steps = 12;

      // Draw cylindrical rings (Boeing fuselage interior ribs)
      for (let z = -length / 2; z <= length / 2; z += length / 3) {
        for (let d = 0; d < 360; d += 360 / steps) {
          const r1 = (d * Math.PI) / 180;
          const r2 = (((d + 360 / steps) % 360) * Math.PI) / 180;
          const py1 = Math.sin(r1) * radius;
          const px1 = Math.cos(r1) * radius;
          const py2 = Math.sin(r2) * radius;
          const px2 = Math.cos(r2) * radius;

          // Only keep cabin profile walls (cut off the bottom somewhat to show the floor plate)
          if (py1 > -radius * 0.6 || py2 > -radius * 0.6) {
            lines.push({
              p1: [px1, py1, z],
              p2: [px2, py2, z],
              color: "rgba(255, 255, 255, 0.08)",
              width: 0.5
            });
          }
        }
      }

      // Connect rings to draw length-wise fuselage ribs
      for (let d = 0; d < 360; d += 72) {
        const rad = (d * Math.PI) / 180;
        const py = Math.sin(rad) * radius;
        const px = Math.cos(rad) * radius;
        if (py > -radius * 0.6) {
          lines.push({
            p1: [px, py, -length / 2],
            p2: [px, py, length / 2],
            color: "rgba(100, 116, 139, 0.2)",
            width: 0.4
          });
        }
      }

      // Draw Floor deck plate inside fuselage
      const floorHalfW = Math.sqrt(radius * radius - (radius * 0.6) * (radius * 0.6));
      lines.push({ p1: [-floorHalfW, -radius * 0.6, -length / 2], p2: [floorHalfW, -radius * 0.6, -length / 2], color: "rgba(255, 255, 255, 0.2)", width: 1 });
      lines.push({ p1: [-floorHalfW, -radius * 0.6, length / 2], p2: [floorHalfW, -radius * 0.6, length / 2], color: "rgba(255, 255, 255, 0.2)", width: 1 });
      lines.push({ p1: [-floorHalfW, -radius * 0.6, -length / 2], p2: [-floorHalfW, -radius * 0.6, length / 2], color: "rgba(255, 255, 255, 0.2)", width: 1 });
      lines.push({ p1: [floorHalfW, -radius * 0.6, -length / 2], p2: [floorHalfW, -radius * 0.6, length / 2], color: "rgba(255, 255, 255, 0.2)", width: 1 });

      // Draw 3 rows of seats in a 2-2 configuration (First / Premium layout)
      const seatRows = [-35, 0, 35];
      const seatOffsetsX = [-30, -10, 10, 30];

      seatRows.forEach((sz) => {
        seatOffsetsX.forEach((sx) => {
          // Determine if this seat is the highlighted one!
          // We map rows to sz and letters to sx
          const isLSelected = selectedValue && selectedValue.length > 0;
          const isOurRow = sz === 0; // Center row represents active selection space
          const isOurCol = (sx === -30 && selectedValue?.endsWith("A")) || 
                           (sx === -10 && selectedValue?.endsWith("B")) ||
                           (sx === 10 && selectedValue?.endsWith("E")) || 
                           (sx === 30 && selectedValue?.endsWith("F"));
          
          const highlightActive = isLSelected && isOurRow && isOurCol;
          const sColor = highlightActive ? "#10b981" : "rgba(16, 185, 129, 0.25)";
          const sWidth = highlightActive ? 2.0 : 0.8;

          // Seat box coordinates on deck
          const sy1 = -radius * 0.6;
          const sy2 = sy1 + 18;
          const sz1 = sz - 8;
          const sz2 = sz + 8;

          // Draws simple wireframe armchair
          // Base cushion
          lines.push({ p1: [sx - 6, sy1, sz1], p2: [sx + 6, sy1, sz1], color: sColor, width: sWidth });
          lines.push({ p1: [sx - 6, sy1, sz2], p2: [sx + 6, sy1, sz2], color: sColor, width: sWidth });
          lines.push({ p1: [sx - 6, sy1, sz1], p2: [sx - 6, sy1, sz2], color: sColor, width: sWidth });
          lines.push({ p1: [sx + 6, sy1, sz1], p2: [sx + 6, sy1, sz2], color: sColor, width: sWidth });

          // Cushion top
          lines.push({ p1: [sx - 6, sy1 + 4, sz1], p2: [sx + 6, sy1 + 4, sz1], color: sColor, width: sWidth });
          lines.push({ p1: [sx - 6, sy1 + 4, sz2], p2: [sx + 6, sy1 + 4, sz2], color: sColor, width: sWidth });
          lines.push({ p1: [sx - 6, sy1 + 4, sz1], p2: [sx - 6, sy1 + 4, sz2], color: sColor, width: sWidth });
          lines.push({ p1: [sx + 6, sy1 + 4, sz1], p2: [sx + 6, sy1 + 4, sz2], color: sColor, width: sWidth });

          // Vertical columns supporting cushion
          [[sx-6, sz1], [sx+6, sz1], [sx-6, sz2], [sx+6, sz2]].forEach(([cx, cz]) => {
            lines.push({ p1: [cx, sy1, cz], p2: [cx, sy1 + 4, cz], color: sColor, width: sWidth });
          });

          // Seat Backrest (slightly tilted back)
          lines.push({ p1: [sx - 6, sy1 + 4, sz2], p2: [sx - 6, sy2, sz2 + 3], color: sColor, width: sWidth });
          lines.push({ p1: [sx + 6, sy1 + 4, sz2], p2: [sx + 6, sy2, sz2 + 3], color: sColor, width: sWidth });
          lines.push({ p1: [sx - 6, sy2, sz2 + 3], p2: [sx + 6, sy2, sz2 + 3], color: sColor, width: sWidth });

          // Armrests
          lines.push({ p1: [sx - 6, sy1 + 4, sz1], p2: [sx - 6, sy1 + 10, sz1], color: sColor, width: sWidth });
          lines.push({ p1: [sx - 6, sy1 + 10, sz1], p2: [sx - 6, sy1 + 10, sz2], color: sColor, width: sWidth });
          lines.push({ p1: [sx - 6, sy1 + 10, sz2], p2: [sx - 6, sy1 + 4, sz2], color: sColor, width: sWidth });

          lines.push({ p1: [sx + 6, sy1 + 4, sz1], p2: [sx + 6, sy1 + 10, sz1], color: sColor, width: sWidth });
          lines.push({ p1: [sx + 6, sy1 + 10, sz1], p2: [sx + 6, sy1 + 10, sz2], color: sColor, width: sWidth });
          lines.push({ p1: [sx + 6, sy1 + 10, sz2], p2: [sx + 6, sy1 + 4, sz2], color: sColor, width: sWidth });
        });
      });

      // Project and draw painter's algorithm
      const projectedLines = lines.map((line) => {
        const trans1 = transformPoint(line.p1[0], line.p1[1], line.p1[2], w, h);
        const trans2 = transformPoint(line.p2[0], line.p2[1], line.p2[2], w, h);
        const avgDepth = (trans1.depth + trans2.depth) / 2;
        return { trans1, trans2, color: line.color, width: line.width, depth: avgDepth };
      });

      projectedLines.sort((a, b) => b.depth - a.depth);
      projectedLines.forEach((pline) => {
        ctx.strokeStyle = pline.color;
        ctx.lineWidth = pline.width;
        ctx.beginPath();
        ctx.moveTo(pline.trans1.x, pline.trans1.y);
        ctx.lineTo(pline.trans2.x, pline.trans2.y);
        ctx.stroke();
      });

      // Overlay text label pointing directly to target seat
      if (selectedValue) {
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "#10b981";
        ctx.fillText(`LOCKED POSITION COORDINATE: ${selectedValue}`, 12, 22);
      }
    }

    // Compass graphic (static bottom corner coordinate helper)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(w - 25, h - 25, 12, 0, Math.PI * 2);
    ctx.moveTo(w - 25, h - 37);
    ctx.lineTo(w - 25, h - 13);
    ctx.moveTo(w - 37, h - 25);
    ctx.lineTo(w - 13, h - 25);
    ctx.stroke();

    ctx.font = "8px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText("N", w - 28, h - 39);
    ctx.fillText(`${yaw.toFixed(0)}°`, w - 38, h - 6);

  }, [yaw, pitch, zoom, type, selectedValue]);

  // Drag interaction events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    autoRotateRef.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };

    setYaw((y) => (y + dx * 0.8) % 360);
    setPitch((p) => Math.max(-60, Math.min(10, p - dy * 0.8)));

    if (onStatusUpdate) {
      onStatusUpdate(`Pivoting 3D Vector Camera: Alt/Azi [${pitch.toFixed(0)}°, ${yaw.toFixed(0)}°]`);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    // Restart automatic slow orbit after 3 seconds
    setTimeout(() => {
      if (!isDragging) autoRotateRef.current = true;
    }, 4000);
  };

  return (
    <div className="relative border border-border-grid bg-[#0a0a0a] rounded-none overflow-hidden h-72 w-full flex items-center justify-center group">
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        width={340}
        height={288}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="cursor-grab active:cursor-grabbing w-full h-full block"
      />

      {/* Control overlay indicators */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 p-1.5 bg-[#0F0F0FD0] border border-border-grid rounded-none select-none">
        <button
          onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))}
          className="p-1 hover:bg-[#1A1A1A] transition text-gray-400 hover:text-white"
          title="Zoom In Model"
        >
          <ZoomIn size={12} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
          className="p-1 hover:bg-[#1A1A1A] transition text-gray-400 hover:text-white"
          title="Zoom Out Model"
        >
          <ZoomOut size={12} />
        </button>
        <button
          onClick={() => { setYaw(45); setPitch(-25); setZoom(1.0); }}
          className="p-1 hover:bg-[#1A1A1A] transition text-gray-400 hover:text-white"
          title="Reset View Coordinates"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[8px] font-mono text-gray-500 bg-[#0F0F0FB0] px-1.5 py-0.5 border border-border-grid/50 pointer-events-none uppercase">
        <Compass size={10} className="animate-spin" />
        <span>Orbit Active. Hold mouse & Drag outer mesh to rotate.</span>
      </div>
    </div>
  );
}

export default function SelectionStudio({
  flights,
  hotels,
  bookings,
  onSavePreferences,
  triggerNotification
}: SelectionStudioProps) {
  // Filter bookings to active ones (flights and hotels)
  const activeBookings = bookings.filter((b) => b.status === "active");

  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [studioStatus, setStudioStatus] = useState<string>("Render Frame Stable. Calibration Sync OK.");

  const selectedBooking = activeBookings.find((b) => b.id === activeBookingId);

  // Sync activeBookingId with activeBookings when bookings list changes or active booking becomes inactive
  useEffect(() => {
    if (activeBookings.length > 0) {
      if (!activeBookingId || !activeBookings.some((b) => b.id === activeBookingId)) {
        setActiveBookingId(activeBookings[0].id);
      }
    } else {
      setActiveBookingId(null);
    }
  }, [bookings, activeBookingId]);

  // Set default selection state based on loaded booking
  useEffect(() => {
    if (selectedBooking) {
      if (selectedBooking.type === "flight") {
        let seat = selectedBooking.seatSelection || "2A";
        if (seat.toLowerCase().includes("premium") || seat.toLowerCase().includes("standard") || seat === "Deluxe") {
          seat = "2A";
        }
        setSelectedSeat(seat);
        setSelectedRoomType(null);
      } else {
        let room = selectedBooking.roomSelection || "Standard";
        if (room === "Deluxe") {
          room = "Deluxe Upgraded";
        }
        setSelectedRoomType(room);
        setSelectedSeat(null);
      }
    }
  }, [activeBookingId, selectedBooking]);

  const generateSeats = () => {
    const seatRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const seatLetters = ["A", "B", "C", "D", "E", "F"];
    const seatsList: Array<{ id: string; row: number; letter: string; type: "first" | "cabin-plus" | "standard"; price: number; taken: boolean }> = [];

    // Predefined simulated taken seats
    const takenSeats = ["1A", "1D", "2F", "3B", "3C", "4D", "6A", "6B", "8E", "9F", "10A", "10D"];

    seatRows.forEach((row) => {
      seatLetters.forEach((letter) => {
        const id = `${row}${letter}`;
        let type: "first" | "cabin-plus" | "standard" = "standard";
        let price = 0;

        if (row <= 2) {
          type = "first";
          price = 150;
        } else if (row <= 4) {
          type = "cabin-plus";
          price = 50;
        }

        seatsList.push({
          id,
          row,
          letter,
          type,
          price,
          taken: takenSeats.includes(id)
        });
      });
    });

    return seatsList;
  };

  const seats = generateSeats();

  const HOTEL_ROOMS = [
    {
      id: "rm-std",
      name: "Basalt Cozy Suite (Standard)",
      type: "Standard",
      priceDelta: 0,
      description: "Organic wood frame bed with natural straw tatami underlay. Complete peace with default amenities.",
      perks: ["Twin Bed", "Local Green Tea Set", "Digital Climate Control"],
      image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80",
      view3D: "Classic View: Ground Garden Shrubbery"
    },
    {
      id: "rm-dlx",
      name: "Tactical Charcoal Loft (Deluxe)",
      type: "Deluxe Upgraded",
      priceDelta: 85,
      description: "Expanded lounge space styled with deep charcoal micro-cement walls, authentic cedar hot-pot tub, and high floor skyline vistas.",
      perks: ["King Bed", "Private Cedar Bath", "Surround Audio Grid", "Priority Valet"],
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80",
      view3D: "Panorama View: Mount Kyoto Bamboo Treeline"
    },
    {
      id: "rm-exec",
      name: "The Vermilion Obsidian Penthouse",
      type: "Premium Executive",
      priceDelta: 195,
      description: "Our signature residence. Overlooking top landmarks, framed by a striking crimson glow ceiling, natural basalt slab wet-bar, and custom-designed wellness retreat elements.",
      perks: ["Emperor Bed", "Private Onsen Waterfall Pool", "Starlight Retractable Roof", "Butler Dispatch Access"],
      image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=400&q=80",
      view3D: "3D Projection: Interactive Arc de Triomphe Skyline Preview Active"
    }
  ];

  const handleSeatClick = (seatId: string, seatType: string, isTaken: boolean) => {
    if (isTaken) {
      triggerNotification("Seat Blocked", `Seat ${seatId} was locked by previous flight check-ins.`, "warning");
      return;
    }
    setSelectedSeat(seatId);
    setStudioStatus(`Stage Buffered: Flight seat vector set to coordinates ${seatId}.`);
  };

  const handleSaveSeatSelection = () => {
    if (!selectedBooking || !selectedSeat) return;
    const seatObj = seats.find((s) => s.id === selectedSeat);
    const upcharge = seatObj ? seatObj.price : 0;

    onSavePreferences(selectedBooking.id, "seat", selectedSeat, upcharge);
    triggerNotification(
      "Seat Secured",
      `Seat ${selectedSeat} (${seatObj?.type.toUpperCase()} CLASS) locked successfully. ${
        upcharge > 0 ? `Premium charge of $${upcharge} logged to reservation.` : "Standard position applied."
      }`,
      "success"
    );
  };

  const handleSaveRoomSelection = () => {
    if (!selectedBooking || !selectedRoomType) return;
    const roomObj = HOTEL_ROOMS.find((r) => r.type === selectedRoomType);
    const upcharge = roomObj ? roomObj.priceDelta : 0;

    onSavePreferences(selectedBooking.id, "room", selectedRoomType, upcharge);
    triggerNotification(
      "Room Selection Logged",
      `Accommodations converted to ${selectedRoomType}. ${
        upcharge > 0 ? `Bespoke upgraded charge of +$${upcharge}/night added.` : "Stay initialized."
      }`,
      "success"
    );
  };

  return (
    <div className="bg-panel border border-border-grid p-6 rounded-none flex flex-col gap-6" id="selection-studio-card">
      {/* Top Banner Selection Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-grid pb-5">
        <div>
          <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-1">Configuration Studio</span>
          <h2 className="font-serif italic font-bold text-2xl text-typography">Configuration & Preferences</h2>
          <p className="text-xs text-gray-400 font-sans mt-0.5">Customize your travel cabin layout or guest room specs with real-time 3D vector graphics.</p>
        </div>

        {/* Selected Booking Selector */}
        <div className="flex flex-col gap-1.5 min-w-[240px]">
          <span className="font-mono text-[9px] text-gray-500 uppercase">Active Bookings Registry</span>
          {activeBookings.length > 0 ? (
            <select
              id="booking-pref-selector"
              value={activeBookingId || ""}
              onChange={(e) => {
                setActiveBookingId(e.target.value);
                setSelectedSeat(null);
                setSelectedRoomType(null);
              }}
              className="bg-panel-light text-typography text-xs font-mono border border-border-grid px-3 py-2 focus:border-accent focus:outline-none cursor-pointer"
            >
              {activeBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.type.toUpperCase()})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-gray-500 italic block border border-dashed border-border-grid p-2">
              No active reservations logged
            </span>
          )}
        </div>
      </div>

      {selectedBooking ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* FLIGHT MAP INTERACTIVE (If selected booking is flight) */}
          {selectedBooking.type === "flight" ? (
            <>
              {/* Left Seat Selector Map */}
              <div className="xl:col-span-7 border border-border-grid p-4 bg-[#111111] flex flex-col items-center">
                <span className="font-mono text-[10px] text-gray-400 self-start uppercase tracking-wider mb-4 border-b border-border-grid pb-2 w-full flex items-center justify-between">
                  <span>Boeing 777-300 Transcontinental Deck</span>
                  <span className="text-accent">Carrier: {selectedBooking.title}</span>
                </span>

                {/* Nose Cone Graphic */}
                <div className="w-48 h-12 border-t border-x border-dashed border-border-grid/80 rounded-t-full flex items-center justify-center mb-6 bg-[#161616]">
                  <span className="font-serif italic text-[11px] text-gray-500">Flight Deck (Avionics Limit)</span>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-[10px] font-mono justify-center mb-6 max-w-md border-b border-border-grid/50 pb-4 w-full">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-accent/20 border border-accent" />
                    <span>First/Premium Upcharge (+$150)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-[#443322]/40 border border-amber-600/60" />
                    <span>Extra Legroom (+$50)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-panel border border-border-grid" />
                    <span>Standard Economy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-[#251010] border border-red-950/60 text-gray-600 line-through text-center leading-none text-[8px]" />
                    <span>Seat Taken</span>
                  </div>
                </div>

                {/* Seat Map Layout Grid */}
                <div className="flex flex-col gap-2.5 max-w-sm w-full p-4 border border-dashed border-border-grid bg-panel">
                  {/* Generate actual row layouts */}
                  {Array.from({ length: 12 }).map((_, rIdx) => {
                    const rowNumber = rIdx + 1;
                    return (
                      <div key={rowNumber} className="flex items-center justify-between gap-1">
                        {/* Left window seats */}
                        <div className="flex items-center gap-1.5">
                          {["A", "B", "C"].map((letter) => {
                            const id = `${rowNumber}${letter}`;
                            const seatObj = seats.find((s) => s.id === id) || { id, row: rowNumber, letter, type: "standard" as const, price: 0, taken: false };
                            const isSelected = selectedSeat === id || selectedBooking.seatSelection === id;

                            let bgClass = "bg-[#181818] border-border-grid text-gray-400 hover:border-gray-500";
                            if (seatObj.taken) bgClass = "bg-[#251010] border-red-950/50 text-gray-600 line-through cursor-not-allowed";
                            else if (isSelected) bgClass = "bg-accent text-canvas border-accent font-bold scale-105 shadow-md shadow-accent/20";
                            else if (seatObj.type === "first") bgClass = "bg-accent/10 border-accent text-accent hover:bg-accent/20";
                            else if (seatObj.type === "cabin-plus") bgClass = "bg-[#443322]/20 border-amber-600/50 text-amber-500 hover:bg-[#443322]/45";

                            return (
                              <button
                                key={id}
                                id={`seat-btn-${id}`}
                                disabled={seatObj.taken}
                                onClick={() => handleSeatClick(id, seatObj.type, seatObj.taken)}
                                className={`w-8 h-8 rounded-none transition-all text-[10px] font-mono flex items-center justify-center border ${bgClass}`}
                                title={`${id} (${seatObj.type}) - ${seatObj.taken ? "Booked" : `+$${seatObj.price}`}`}
                              >
                                {id}
                              </button>
                            );
                          })}
                        </div>

                        {/* Aisle */}
                        <div className="w-8 flex items-center justify-center">
                          <span className="font-mono text-[9px] font-semibold text-gray-600">{rowNumber}</span>
                        </div>

                        {/* Right window seats */}
                        <div className="flex items-center gap-1.5">
                          {["D", "E", "F"].map((letter) => {
                            const id = `${rowNumber}${letter}`;
                            const seatObj = seats.find((s) => s.id === id) || { id, row: rowNumber, letter, type: "standard" as const, price: 0, taken: false };
                            const isSelected = selectedSeat === id || selectedBooking.seatSelection === id;

                            let bgClass = "bg-[#181818] border-border-grid text-gray-400 hover:border-gray-500";
                            if (seatObj.taken) bgClass = "bg-[#251010] border-red-950/50 text-gray-600 line-through cursor-not-allowed";
                            else if (isSelected) bgClass = "bg-accent text-canvas border-accent font-bold scale-105 shadow-md shadow-accent/20";
                            else if (seatObj.type === "first") bgClass = "bg-accent/10 border-accent text-accent hover:bg-accent/20";
                            else if (seatObj.type === "cabin-plus") bgClass = "bg-[#443322]/20 border-amber-600/50 text-amber-500 hover:bg-[#443322]/45";

                            return (
                              <button
                                key={id}
                                id={`seat-btn-${id}`}
                                disabled={seatObj.taken}
                                onClick={() => handleSeatClick(id, seatObj.type, seatObj.taken)}
                                className={`w-8 h-8 rounded-none transition-all text-[10px] font-mono flex items-center justify-center border ${bgClass}`}
                                title={`${id} (${seatObj.type}) - ${seatObj.taken ? "Booked" : `+$${seatObj.price}`}`}
                              >
                                {id}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Booking / 3D Cabin Preview Pane */}
              <div className="xl:col-span-5 flex flex-col justify-between border border-border-grid p-5 bg-[#141414]">
                <div className="flex flex-col gap-4">
                  <div className="border-b border-border-grid pb-3">
                    <span className="text-[10px] uppercase font-mono text-gray-500">Interactive Seating Deck (Satellite link)</span>
                    <h3 className="font-serif italic font-semibold text-lg text-typography mt-1">Configure Cabin Coordinates</h3>
                  </div>

                  {/* 3D Wireframe Preview */}
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider mb-1 block">Live Flight Cabin 3D View</span>
                    <Wireframe3DPreview
                      type="seat"
                      selectedValue={selectedSeat || ""}
                      onStatusUpdate={setStudioStatus}
                    />
                  </div>

                  <div className="flex flex-col gap-2.5 font-mono text-xs mt-2">
                    <div className="flex justify-between py-1 border-b border-border-grid/40">
                      <span className="text-gray-500">Currently Saved Seat:</span>
                      <span className="text-typography font-semibold">{selectedBooking.seatSelection || "None Set"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-grid/40">
                      <span className="text-gray-500">Staged Assignment:</span>
                      <span className="text-accent font-bold">{selectedSeat || "None Selected"}</span>
                    </div>
                  </div>

                  {selectedSeat ? (
                    (() => {
                      const seatUnit = seats.find((s) => s.id === selectedSeat) || {
                        id: selectedSeat,
                        row: parseInt(selectedSeat) || 1,
                        letter: selectedSeat.slice(-1),
                        type: "standard" as const,
                        price: 0,
                        taken: false
                      };
                      return (
                        <div className="p-3 border border-border-grid bg-panel flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-accent">
                            <Sparkles size={13} />
                            <span className="font-mono font-bold capitalize">{seatUnit.type} Position Selected</span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                            {seatUnit.type === "first"
                              ? "First class provides fully reclining beds, noise-canceling headphones, and dynamic chef gourmet service in-flight."
                              : seatUnit.type === "cabin-plus"
                              ? "Cabin Plus offers extra stretch legroom, premium window and aisle positions, and expedited priority luggage drop-off."
                              : "Standard Economy provides cozy contoured seating with full access to standard audio and entertainment features."}
                          </p>
                          <div className="flex justify-between items-center bg-[#1A1A1A] p-2 mt-1 font-mono text-xs">
                            <span className="text-gray-400">Position Upcharge:</span>
                            <span className="text-typography font-bold">+${seatUnit.price} USD</span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="border border-border-grid border-dashed p-4 text-center italic text-xs text-gray-500">
                      Click an available coordinate from our Boeing radar projection to stage a change.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                  <span className="text-[8px] font-mono text-gray-500 block text-right">{studioStatus}</span>
                  <button
                    id="save-seat-pref-btn"
                    disabled={!selectedSeat}
                    onClick={handleSaveSeatSelection}
                    className="w-full py-2.5 bg-accent hover:bg-accent/90 disabled:bg-gray-800 disabled:text-gray-600 text-canvas font-mono font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Secure & Lock Seat Selection</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* HOTEL ROOM TYPE GRIDS (If selected booking is hotel staying) */
            <>
              {/* Left Grid Selector */}
              <div className="xl:col-span-7 flex flex-col gap-4">
                <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest block border-b border-border-grid pb-2">
                  Interactive Room-Type Allotments
                </span>

                <div className="flex flex-col gap-4">
                  {HOTEL_ROOMS.map((room) => {
                    const mappedBookingRoom = selectedBooking.roomSelection === "Deluxe" ? "Deluxe Upgraded" : selectedBooking.roomSelection;
                    const isSelected = selectedRoomType === room.type || mappedBookingRoom === room.type;
                    const isActiveChoice = selectedRoomType === room.type;

                    return (
                      <div
                        key={room.id}
                        id={`room-card-${room.id}`}
                        onClick={() => {
                          setSelectedRoomType(room.type);
                          setStudioStatus(`Stage Buffered: Suite style category set to ${room.type}.`);
                        }}
                        className={`border rounded-none overflow-hidden transition-all grid grid-cols-1 md:grid-cols-12 cursor-pointer ${
                          isSelected ? "border-accent bg-[#161616]" : "border-border-grid hover:border-gray-500 bg-panel"
                        }`}
                      >
                        {/* Room Mock Render */}
                        <div className="md:col-span-4 h-32 md:h-full relative bg-gray-900">
                          <img
                            src={room.image}
                            alt={room.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover grayscale opacity-85 group-hover:grayscale-0 transition-all animate-fade"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                        </div>

                        {/* Room Info */}
                        <div className="md:col-span-8 p-4 flex flex-col justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-serif italic font-bold text-base text-typography">{room.name}</h4>
                              <span className="font-mono text-xs text-accent font-bold">
                                {room.priceDelta === 0 ? "Default Included" : `+$${room.priceDelta}/N Upcharge`}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-sans leading-relaxed">{room.description}</p>
                          </div>

                          {/* Perks */}
                          <div className="flex flex-wrap gap-1.5">
                            {room.perks.map((p, pIdx) => (
                              <span
                                key={pIdx}
                                className="font-mono text-[9px] bg-[#1A1A1A] border border-border-grid text-gray-300 px-2 py-0.5 animate-fade"
                              >
                                {p}
                              </span>
                            ))}
                          </div>

                          {/* 3D view metadata */}
                          <div className="font-mono text-[9px] text-gray-500 pt-2 border-t border-border-grid/50 flex justify-between">
                            <span>REPRESENTIVE GRAPHIC VIEW:</span>
                            <span className="text-gray-400 italic font-semibold">{room.view3D}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Booking Room Preference Saving Panel */}
              <div className="xl:col-span-5 flex flex-col justify-between border border-border-grid p-5 bg-[#141414]">
                <div className="flex flex-col gap-4">
                  <div className="border-b border-border-grid pb-3">
                    <span className="text-[10px] uppercase font-mono text-gray-500">Hotel Room Upgrade Configurator</span>
                    <h3 className="font-serif italic font-semibold text-lg text-typography mt-1">Suite Booking Audit</h3>
                  </div>

                  {/* 3D Wireframe Preview of Hotel Room */}
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] text-amber-500 uppercase tracking-wider mb-1 block">Dynamic 3D Suite Wireframe Model</span>
                    <Wireframe3DPreview
                      type="room"
                      selectedValue={selectedRoomType || ""}
                      onStatusUpdate={setStudioStatus}
                    />
                  </div>

                  <div className="flex flex-col gap-2.5 font-mono text-xs mt-2">
                    <div className="flex justify-between py-1 border-b border-border-grid/40">
                      <span className="text-gray-500">Current Reserved Tier:</span>
                      <span className="text-typography font-semibold">{selectedBooking.roomSelection || "Standard"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-grid/40">
                      <span className="text-gray-500">Proposed Selection Level:</span>
                      <span className="text-accent font-bold">{selectedRoomType || "None Highlighted"}</span>
                    </div>
                  </div>

                  {selectedRoomType ? (
                    (() => {
                      const roomUnit = HOTEL_ROOMS.find((r) => r.type === selectedRoomType) || {
                        id: "rm-std",
                        name: "Standard Room",
                        type: selectedRoomType,
                        priceDelta: 0,
                        description: "Standard amenities",
                        perks: [],
                        image: "",
                        view3D: ""
                      };
                      return (
                        <div className="p-3 border border-border-grid bg-panel flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-accent">
                            <Sparkles size={13} />
                            <span className="font-mono font-bold">{roomUnit.type} Upgrades Stage</span>
                          </div>
                          <div className="bg-[#1A1A1A] p-2 mt-1 font-mono text-xs flex justify-between items-center">
                            <span className="text-gray-400">Upgrade Surcharge:</span>
                            <span className="text-typography font-bold">+{roomUnit.priceDelta === 0 ? "None" : `$${roomUnit.priceDelta} USD / night`}</span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="border border-border-grid border-dashed p-4 text-center italic text-xs text-gray-500">
                      Please highlight your preferred suite choice in the interactive grid left to secure rooms.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                  <span className="text-[8px] font-mono text-gray-500 block text-right">{studioStatus}</span>
                  <button
                    id="save-room-pref-btn"
                    disabled={!selectedRoomType}
                    onClick={handleSaveRoomSelection}
                    className="w-full py-2.5 bg-accent hover:bg-accent/90 disabled:bg-gray-800 disabled:text-gray-600 text-canvas font-mono font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Authorize Room Type Preferences</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="border border-border-grid border-dashed p-10 text-center italic text-sm text-gray-500 rounded-none bg-[#111111]">
          No active, config-eligible bookings detected. Register bookings first before utilizing the preferences dashboard.
        </div>
      )}
    </div>
  );
}
