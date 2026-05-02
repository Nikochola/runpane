"use client";

import { useEffect, useRef } from "react";

const CHARS = " .:coPO?@■";

export function AsciiShader({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;
    let time = 0;

    const fontSize = 11;
    const lineHeight = fontSize * 1.25;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, monospace`;
      ctx.textBaseline = "alphabetic";

      const charWidth = ctx.measureText("W").width;
      const cols = Math.floor(rect.width / charWidth);
      const rows = Math.floor(rect.height / lineHeight);

      time += 0.03;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const nx = (x / cols) * 2 - 1;
          const ny = (y / rows) * 2 - 1;

          const dist = Math.sqrt(nx * nx + ny * ny);
          const angle = Math.atan2(ny, nx);

          const v1 = Math.sin(dist * 8 - time * 2);
          const v2 = Math.cos(angle * 4 + time);
          const v3 = Math.sin(nx * 5 + time) * Math.cos(ny * 5 - time);

          const v = (v1 + v2 + v3) / 3;
          const normalized = Math.max(0, Math.min(1, (v + 1) / 2));

          const index = Math.floor(Math.pow(normalized, 1.5) * (CHARS.length - 1));
          const char = CHARS[index] || " ";

          const normalIndex = index / (CHARS.length - 1);

          const r = Math.round(161 + (118 - 161) * normalIndex * 0.35);
          const g = Math.round(161 + (158 - 161) * normalIndex * 0.35);
          const b = Math.round(170 + (219 - 170) * normalIndex * 0.35);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillText(char, x * charWidth, (y + 1) * lineHeight - 2);
        }
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none select-none w-full h-full ${className || ""}`}
    />
  );
}
