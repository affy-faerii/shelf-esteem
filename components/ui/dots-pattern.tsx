"use client";

import { useEffect, useRef, useCallback } from "react";

interface InteractiveDotsProps {
  theme?: "dark" | "light";
  gridSpacing?: number;
  animationSpeed?: number;
}

const InteractiveDots = ({
  theme = "dark",
  gridSpacing = 32,
  animationSpeed = 0.004,
}: InteractiveDotsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const ripplesRef = useRef<Array<{ x: number; y: number; time: number; intensity: number }>>([]);
  const dotsRef = useRef<Array<{ ox: number; oy: number; phase: number }>>([]);
  const tRef = useRef(0);

const isDark = theme === "dark";

// Backgrounds
const BG = isDark
  ? "#0C0C0E"   // Deep charcoal
  : "#E8E2D2";  // Warm paper

// Dot colors
const DOT_RGB = isDark
  ? "122,116,104" // #7A7468
  : "142,137,124"; // #8E897C

// Softer visibility
const BASE_OPACITY = isDark ? 0.18 : 0.20;
const MIN_OPACITY = isDark ? 0.08 : 0.10;

  const initDots = useCallback(
    (W: number, H: number) => {
      const dots: Array<{ ox: number; oy: number; phase: number }> = [];
      for (let x = gridSpacing / 2; x < W; x += gridSpacing)
        for (let y = gridSpacing / 2; y < H; y += gridSpacing)
          dots.push({ ox: x, oy: y, phase: Math.random() * Math.PI * 2 });
      dotsRef.current = dots;
    },
    [gridSpacing]
  );

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
    initDots(W, H);
  }, [initDots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resize();

    // Listen on WINDOW so mouse events fire even over other elements
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouseRef.current = { x: -999, y: -999 };
    };
    const onClick = (e: MouseEvent) => {
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
        intensity: 2,
      });
    };
    const onResize = () => resize();

    // Attach to window — not canvas
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      tRef.current += animationSpeed;
      const t = tRef.current;
      const now = Date.now();
      const W = window.innerWidth;
      const H = window.innerHeight;

      ripplesRef.current = ripplesRef.current.filter((r) => now - r.time < 3000);

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      dotsRef.current.forEach((dot) => {
        const mdx = dot.ox - mouseRef.current.x;
        const mdy = dot.oy - mouseRef.current.y;
        const mInfl = Math.max(0, 1 - Math.sqrt(mdx * mdx + mdy * mdy) / 140);

        let rInfl = 0;
        ripplesRef.current.forEach((rp) => {
          const age = now - rp.time;
          const dx = dot.ox - rp.x;
          const dy = dot.oy - rp.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = (age / 3000) * 280;
          const width = 55;
          if (Math.abs(dist - radius) < width)
            rInfl +=
              (1 - age / 3000) *
              rp.intensity *
              (1 - Math.abs(dist - radius) / width);
        });

        const infl = Math.min(mInfl + rInfl, 2.2);
        const size =
          1.8 + infl * 5.5 + Math.sin(t + dot.phase) * 0.4;
        const opacity = Math.max(
          MIN_OPACITY,
          BASE_OPACITY +
            infl * 0.5 +
            Math.abs(Math.sin(t * 0.5 + dot.phase)) * 0.06
        );

        ctx.beginPath();
        ctx.arc(dot.ox, dot.oy, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${DOT_RGB},${opacity})`;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [theme, resize, animationSpeed, BG, DOT_RGB, BASE_OPACITY, MIN_OPACITY]);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ background: BG, transition: "background 0.4s" }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ pointerEvents: "none" }} // canvas doesn't block clicks
      />
    </div>
  );
};

export default InteractiveDots;