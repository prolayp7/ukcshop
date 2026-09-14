"use client";

import { useEffect, useState } from "react";

export interface CountdownParts {
  d: string;
  h: string;
  m: string;
  s: string;
}

const ZERO: CountdownParts = { d: "00", h: "00", m: "00", s: "00" };

/** Ticking countdown to a given target date, or to next Sunday midnight when
 * no target is given — the same "ends this week" deadline used elsewhere on
 * the site (e.g. deal copy already says "reduced until Sunday midnight").
 * Starts at ZERO on both the server and the client's first render (so
 * hydration always matches), then a client-only effect starts the real
 * clock — never compute Date.now() during render, or the server and client
 * snapshots would differ. Once the target passes, the clock freezes at
 * 00:00:00:00 rather than going negative. */
export function useCountdown(target?: string | Date | null): CountdownParts {
  const [parts, setParts] = useState<CountdownParts>(ZERO);
  const targetTime = target ? new Date(target).getTime() : NaN;

  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    function tick() {
      const now = new Date();
      let end: Date;
      if (!Number.isNaN(targetTime)) {
        end = new Date(targetTime);
      } else {
        end = new Date(now);
        end.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
        end.setHours(0, 0, 0, 0);
      }
      let s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      const d = Math.floor(s / 86400);
      s -= d * 86400;
      const h = Math.floor(s / 3600);
      s -= h * 3600;
      const m = Math.floor(s / 60);
      s -= m * 60;
      setParts({ d: pad(d), h: pad(h), m: pad(m), s: pad(s) });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  return parts;
}
