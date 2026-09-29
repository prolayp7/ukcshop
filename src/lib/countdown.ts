"use client";

import { useEffect, useState } from "react";

export interface CountdownParts {
  d: string;
  h: string;
  m: string;
  s: string;
}

const ZERO: CountdownParts = { d: "00", h: "00", m: "00", s: "00" };

/** Ticking countdown to a real target date. Returns null when there is no target, or once it has
 * passed, so callers hide the timer instead of showing an invented deadline.
 * Starts at ZERO on both the server and the client's first render (so hydration always matches), then a
 * client-only effect starts the real clock - never compute Date.now() during render, or the server and
 * client snapshots would differ. */
export function useCountdown(target?: string | Date | null): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(ZERO);
  const targetTime = target ? new Date(target).getTime() : NaN;

  useEffect(() => {
    if (Number.isNaN(targetTime)) return;
    const pad = (n: number) => String(n).padStart(2, "0");
    function tick() {
      let s = Math.floor((targetTime - Date.now()) / 1000);
      if (s <= 0) { setParts(null); return false; }
      const d = Math.floor(s / 86400);
      s -= d * 86400;
      const h = Math.floor(s / 3600);
      s -= h * 3600;
      const m = Math.floor(s / 60);
      s -= m * 60;
      setParts({ d: pad(d), h: pad(h), m: pad(m), s: pad(s) });
      return true;
    }
    if (!tick()) return;
    const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  return Number.isNaN(targetTime) ? null : parts;
}
