"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    // Path changed — complete the bar then hold briefly before fading
    setWidth(100);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 600);
  }, [pathname]);

  useEffect(() => {
    function handleStart() {
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(true);
      setWidth(20);
      const t1 = setTimeout(() => setWidth(55), 100);
      const t2 = setTimeout(() => setWidth(72), 500);
      const t3 = setTimeout(() => setWidth(82), 1200);
      timerRef.current = t3;
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    window.addEventListener("navigation-start", handleStart);
    return () => window.removeEventListener("navigation-start", handleStart);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[2px]"
      style={{
        width: `${width}%`,
        background: "rgba(255,255,255,0.9)",
        boxShadow: "0 0 6px rgba(255, 255, 255, 0.5)",
        transition: width === 100
          ? "width 0.2s ease-out, opacity 0.3s ease 0.4s"
          : "width 0.5s ease-out",
        opacity: width === 100 ? 0 : 1,
      }}
    />
  );
}

// No SSR — avoids hydration mismatch since this is purely client state
export const NavigationProgressClient = dynamic(
  () => Promise.resolve(NavigationProgress),
  { ssr: false }
);

export function fireNavigationStart() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("navigation-start"));
  }
}
