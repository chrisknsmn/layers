"use client";

import { useEffect, useRef } from "react";

export function DotGridHorizon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motionMq.matches;
    const onMotion = (e: MediaQueryListEvent) => {
      reduced = e.matches;
    };
    motionMq.addEventListener?.("change", onMotion);

    let raf = 0;
    let phase = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!reduced) phase += dt * 0.18;
      const frac = phase - Math.floor(phase);

      ctx.clearRect(0, 0, width, height);

      // Perspective parameters. The plane stretches from just below the
      // viewer (large dots, near the bottom of the screen) out to the
      // horizon (vanishing point), which sits at horizonY from the top.
      const horizonY = Math.round(height * 0.32);
      const focalY = horizonY * 1.35;
      const focalX = horizonY * 1.35;
      const camHeight = 1.4;
      const zMin = 0.55;
      const rowSpacing = 0.32;
      const colSpacing = 0.30;
      const rowCount = 220;

      const planeSpan = Math.max(1, height - horizonY);

      // Iterate from far → near so near-field dots paint on top.
      // `frac` is added (not subtracted) so as time advances each
      // row's distance grows — the grid appears to recede toward
      // the horizon.
      for (let i = rowCount - 1; i >= 0; i--) {
        const z = (i + frac) * rowSpacing + zMin;
        const screenY = horizonY + (focalY * camHeight) / z;
        if (screenY < horizonY + 0.3) continue;
        if (screenY > height + 4) continue;

        // Soft depth easing — alpha only ramps up toward the near
        // field. The destination-out eraser below also dissolves
        // the upper portion, so faint rows can be drawn all the way
        // up to the horizon without forming a visible edge.
        const t = Math.max(0, Math.min(1, (screenY - horizonY) / planeSpan));
        const depthFade = Math.pow(t, 2.4);
        if (depthFade < 0.0005) continue;

        // Dot radius shrinks with distance. Allow it down to ~0.18px
        // so the field truly dissolves rather than clamping into a
        // hard pixel band.
        const scale = 1 / z;
        const radius = 2.6 * scale;
        if (radius < 0.18) continue;

        const sizeFade = Math.min(1, (radius - 0.18) * 1.4);

        const colHalf = Math.ceil((width * z) / (2 * colSpacing * focalX)) + 1;
        const cappedColHalf = Math.min(colHalf, 220);

        const alpha = depthFade * sizeFade * 0.95;
        ctx.fillStyle = `rgba(229, 231, 235, ${alpha})`;

        const side = radius * 2;
        for (let j = -cappedColHalf; j <= cappedColHalf; j++) {
          const screenX = width / 2 + (j * colSpacing * focalX) / z;
          if (screenX < -4) continue;
          if (screenX > width + 4) break;
          ctx.fillRect(screenX - radius, screenY - radius, side, side);
        }
      }

      // Dissolve the top of the dot field into transparency. Using
      // destination-out actually erases the rendered dots according to
      // the gradient alpha, so no matter how dense the rows pile up
      // near the vanishing point there is no perceptible edge — the
      // pixels themselves smoothly disappear.
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const eraser = ctx.createLinearGradient(
        0,
        horizonY - planeSpan * 0.05,
        0,
        horizonY + planeSpan * 0.55,
      );
      eraser.addColorStop(0, "rgba(0, 0, 0, 1)");
      eraser.addColorStop(0.35, "rgba(0, 0, 0, 0.85)");
      eraser.addColorStop(0.7, "rgba(0, 0, 0, 0.3)");
      eraser.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = eraser;
      ctx.fillRect(0, 0, width, horizonY + planeSpan * 0.55 + 4);
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      motionMq.removeEventListener?.("change", onMotion);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ background: "var(--background)", zIndex: -1 }}
    />
  );
}
