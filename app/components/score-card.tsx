"use client";

import type { Audit } from "@/mastra/schemas";

export function ScoreCard({ audit }: { audit: Audit }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-background">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            ASO Score
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold tabular-nums">
              {Math.round(audit.overallScore)}
            </span>
            <span className="text-sm text-zinc-500">/ 100</span>
          </div>
        </div>
        <ScoreRing value={audit.overallScore} />
      </div>

      <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        {audit.summary}
      </p>

      <div className="mt-5 space-y-3">
        {audit.dimensions.map((d) => (
          <DimensionBar key={d.name} dim={d} />
        ))}
      </div>
    </div>
  );
}

function DimensionBar({
  dim,
}: {
  dim: Audit["dimensions"][number];
}) {
  const pct = (dim.score / 10) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <div className="font-medium text-zinc-900 dark:text-zinc-50">
          {dim.name}
        </div>
        <div className="flex items-baseline gap-2 tabular-nums text-zinc-500">
          <span className="text-xs">{dim.weight}%</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {dim.score.toFixed(1)}
          </span>
        </div>
      </div>
      <div
        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
        {dim.reasoning}{" "}
        <span className="text-zinc-500 italic">— {dim.evidence}</span>
      </div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
      <circle
        cx="32"
        cy="32"
        r={r}
        strokeWidth="6"
        fill="none"
        className="stroke-zinc-200 dark:stroke-zinc-800"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        strokeWidth="6"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="stroke-emerald-500 transition-all duration-500"
      />
    </svg>
  );
}
