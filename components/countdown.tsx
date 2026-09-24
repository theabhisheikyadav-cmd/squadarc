"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  };
}

/** Counts down to local midnight on `date` (YYYY-MM-DD) in the viewer's own timezone. */
export function Countdown({ date }: { date: string }) {
  const [y, m, d] = date.split("-").map(Number);
  const end = new Date(y, m - 1, d).getTime();
  // null until mounted so server and client render the same markup.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (now !== null && now >= end) {
    return (
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-ice">
        The arc has started
      </p>
    );
  }

  const p = now === null ? null : parts(end - now);
  const cells: [string, number | undefined][] = [
    ["days", p?.days],
    ["hrs", p?.hours],
    ["min", p?.mins],
    ["sec", p?.secs],
  ];

  return (
    <div className="flex gap-2" aria-label="Time until the arc starts" role="timer">
      {cells.map(([label, value]) => (
        <div
          key={label}
          className="flex w-16 flex-col items-center rounded-xl border border-line bg-surface py-2"
        >
          <span className="font-mono text-2xl font-semibold tabular-nums text-fg">
            {value === undefined ? "--" : String(value).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
