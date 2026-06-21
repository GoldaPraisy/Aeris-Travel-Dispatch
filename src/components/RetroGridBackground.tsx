import React, { useEffect, useRef } from "react";

export default function RetroGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Use ResizeObserver to adapt precisely to layout bounds
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: entryWidth, height: entryHeight } = entry.contentRect;
        width = Math.floor(entryWidth);
        height = Math.floor(entryHeight);
        canvas.width = width;
        canvas.height = height;
      }
    });

    resizeObserver.observe(canvas.parentElement || document.body);

    // Grid scrolling position accumulator
    let scrollOffset = 0;

    // Star cluster simulation (cyber space style)
    const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.5, // Keep stars in the upper half (sky region)
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.0003 + 0.0001
      });
    }

    // High performance wireframe mountain vertex arrays
    const mountainPoints1: { x: number; y: number }[] = [];
    const mountainPoints2: { x: number; y: number }[] = [];
    const mountainPointCount = 20;

    // Build mountain range ridges (deterministic heights for stylized aesthetic)
    for (let i = 0; i <= mountainPointCount; i++) {
      const xPercent = i / mountainPointCount;
      // Ridge 1 (Far left block)
      let heightVal1 = 0;
      if (xPercent < 0.45) {
        heightVal1 = Math.sin(xPercent * Math.PI * 2.5) * 80 + Math.cos(xPercent * 12) * 20;
      } else if (xPercent > 0.55) {
        heightVal1 = Math.sin((xPercent - 0.5) * Math.PI * 2) * 60 + Math.sin(xPercent * 24) * 10;
      }
      // Ridge 2 (foreground left/right peaks)
      let heightVal2 = 0;
      if (xPercent < 0.3) {
        heightVal2 = Math.sin(xPercent * Math.PI * 3.3) * 110 + Math.sin(xPercent * 30) * 15;
      } else if (xPercent > 0.7) {
        heightVal2 = Math.sin((xPercent - 0.6) * Math.PI * 2.5) * 130 + Math.cos(xPercent * 18) * 12;
      }

      mountainPoints1.push({ x: xPercent, y: heightVal1 });
      mountainPoints2.push({ x: xPercent, y: heightVal2 });
    }

    // Unified Synthwave Core Loop
    const draw = () => {
      if (!ctx || width === 0 || height === 0) return;

      // Clear Screen with deep retro space gradient (indigo-black to deep velvet)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, "#03020A");
      skyGrad.addColorStop(0.4, "#0B0616");
      skyGrad.addColorStop(0.75, "#180922");
      skyGrad.addColorStop(1, "#0A0510");

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      const horizonY = height * 0.48; // Grid horizon line

      // 1. Draw Space Twinkling Stars
      stars.forEach((star) => {
        star.alpha += (Math.random() - 0.5) * 0.08;
        star.alpha = Math.max(0.2, Math.min(1.0, star.alpha));
        ctx.fillStyle = `rgba(255, 77, 0, ${star.alpha * 0.65})`; // Hot orange neon stars
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * horizonY, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Retro Neon Sunset Glow (Sun rays in the middle)
      const sunRadius = Math.min(width * 0.18, 140);
      const sunX = width / 2;
      const sunY = horizonY - 15;

      const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
      sunGrad.addColorStop(0, "#FF007F"); // Hot premium pink
      sunGrad.addColorStop(0.5, "#FF4D00"); // Hot neon orange
      sunGrad.addColorStop(1, "#FFDD00"); // Yellow gold

      ctx.save();
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, Math.PI, 0, false); // Half circle sunset
      ctx.fill();

      // Draw stylized scanlines/slots in the sun (Synthwave Retro Sun effect)
      ctx.globalCompositeOperation = "destination-out";
      const totalSlices = 7;
      for (let s = 1; s <= totalSlices; s++) {
        const sliceY = sunY - (sunRadius * s) / (totalSlices + 1);
        const sliceHeight = 1.5 + s * 1.2; // wider slits closer to the base
        ctx.fillRect(sunX - sunRadius - 10, sliceY - sliceHeight / 2, sunRadius * 2 + 20, sliceHeight);
      }
      ctx.restore();

      // Neon horizon haze
      const horizonHaze = ctx.createLinearGradient(0, horizonY - 30, 0, horizonY + 15);
      horizonHaze.addColorStop(0, "rgba(255, 0, 127, 0)");
      horizonHaze.addColorStop(0.6, "rgba(255, 77, 0, 0.25)");
      horizonHaze.addColorStop(1, "rgba(255, 0, 127, 0)");
      ctx.fillStyle = horizonHaze;
      ctx.fillRect(0, horizonY - 35, width, 55);

      // 3. Draw Wireframe Terrain Mountains in the distance (Left and Right clusters)
      const drawMountainRange = (points: { x: number; y: number }[], baseColor: string, scaleHeight: number, opacity: number) => {
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1.2;
        ctx.fillStyle = "rgba(4, 2, 8, 0.95)";
        ctx.beginPath();

        points.forEach((pt, idx) => {
          const currentX = pt.x * width;
          const currentY = horizonY - pt.y * scaleHeight;
          if (idx === 0) {
            ctx.moveTo(currentX, horizonY);
            ctx.lineTo(currentX, currentY);
          } else {
            ctx.lineTo(currentX, currentY);
          }
        });
        ctx.lineTo(width, horizonY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Add 3D Wireframe structural lattice ribs
        ctx.strokeStyle = `rgba(255, 0, 127, ${opacity * 0.35})`;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < points.length; i += 2) {
          const currentX = points[i].x * width;
          const currentY = horizonY - points[i].y * scaleHeight;
          ctx.beginPath();
          ctx.moveTo(currentX, currentY);
          ctx.lineTo(currentX, horizonY);
          ctx.stroke();
        }
      };

      // Draw Range 1 (Far background mountains, purple)
      drawMountainRange(mountainPoints1, "rgba(110, 4, 180, 0.45)", 0.65, 0.3);
      // Draw Range 2 (Foreground mountains, retro pink & neon orange)
      drawMountainRange(mountainPoints2, "rgba(255, 77, 0, 0.55)", 0.8, 0.6);

      // Draw clean flat vector ocean line at horizon
      ctx.strokeStyle = "#FF4D00";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();

      // 4. Draw Flying Infinite Glowing Grid (Lower half)
      const gridRegionHeight = height - horizonY;
      scrollOffset += 1.4; // Speed of movement
      if (scrollOffset >= 40) {
        scrollOffset = 0;
      }

      ctx.save();
      // Establish grid clipping boundary (fully standard viewport safety)
      ctx.beginPath();
      ctx.rect(0, horizonY, width, gridRegionHeight);
      ctx.clip();

      // perspective calculations
      const perspectiveScale = 1.6;
      ctx.strokeStyle = "rgba(255, 77, 0, 0.14)"; // Soft red grid default
      ctx.lineWidth = 1.0;

      // Draw scrolling horizontal grid lines with perspective projection
      const numHorizontalLines = 18;
      for (let i = 0; i <= numHorizontalLines; i++) {
        // Logarithmic spacing to project 3D-depth on 2D scene
        const relativePos = (i * 40 - scrollOffset) / (numHorizontalLines * 40);
        // Map 0 -> 1 curve non-linearly
        const normalizedY = Math.pow(relativePos, 3.2); // exponential curve to mimic 3D depth
        if (normalizedY < 0 || normalizedY > 1) continue;

        const currentY = horizonY + normalizedY * gridRegionHeight;

        // Glow stronger as lines move closer to the spectator front
        ctx.strokeStyle = `rgba(255, 0, 127, ${normalizedY * 0.36 + 0.05})`;
        ctx.lineWidth = normalizedY * 1.8 + 0.3;

        ctx.beginPath();
        ctx.moveTo(0, currentY);
        ctx.lineTo(width, currentY);
        ctx.stroke();
      }

      // Draw structural vertical lines converging at the horizon midpoint (vanishing point)
      const totalPerspectiveLines = 26;
      const vanishingX = width / 2;
      const vanishingY = horizonY;

      for (let j = 0; j <= totalPerspectiveLines; j++) {
        const xFactor = j / totalPerspectiveLines;
        // Calculate coordinate position along the bottom viewport edge
        const bottomBorderX = xFactor * width;

        // Draw perspective line converging on vanishing midpoint
        ctx.strokeStyle = `rgba(0, 242, 254, ${Math.abs(xFactor - 0.5) * 0.15 + 0.15})`; // cyan spectrum borders
        ctx.lineWidth = 0.8;

        ctx.beginPath();
        ctx.moveTo(vanishingX, vanishingY);
        ctx.lineTo(bottomBorderX, height);
        ctx.stroke();
      }

      ctx.restore();

      // 5. Draw Cyber Grid Matrix Border Accent (Subtle retro sci-fi framing bounds)
      ctx.fillStyle = "rgba(255, 77, 0, 0.02)";
      ctx.fillRect(0, 0, width, height);

      // Trigger frame request
      animationFrameId = requestAnimationFrame(draw);
    };

    // Begin render chain
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full block transition-opacity duration-700"
      ref={canvasRef}
      style={{ opacity: 0.88 }}
      id="retro-wireframe-grid-canvas"
    />
  );
}
