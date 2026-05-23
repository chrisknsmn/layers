"use client";

import Image from "next/image";
import type {
  AppMetadata,
  Audit,
  Competitor,
  ListingScrape,
} from "@/mastra/schemas";
import { ScoreCard } from "./score-card";

type Props = {
  app: AppMetadata;
  audit: Audit;
  listing: ListingScrape;
  competitors: Competitor[];
};

export function AuditResult({ app, audit, listing, competitors }: Props) {
  return (
    <div className="space-y-5">
      <AppHeader app={app} listing={listing} />
      <ScoreCard audit={audit} />

      <RecommendationsSection
        title="Quick wins"
        subtitle="Implementable today"
        accent="emerald"
        items={audit.quickWins}
      />
      <RecommendationsSection
        title="High-impact changes"
        subtitle="Worth the effort"
        accent="amber"
        items={audit.highImpactChanges}
      />
      <RecommendationsSection
        title="Strategic recommendations"
        subtitle="Longer term"
        accent="sky"
        items={audit.strategicRecommendations}
      />

      {audit.competitorComparison.length > 0 && (
        <CompetitorTable
          rows={audit.competitorComparison}
          competitors={competitors}
        />
      )}
    </div>
  );
}

function AppHeader({
  app,
  listing,
}: {
  app: AppMetadata;
  listing: ListingScrape;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {app.artworkUrl ? (
        <Image
          src={app.artworkUrl}
          alt=""
          width={56}
          height={56}
          className="size-14 rounded-xl"
          unoptimized
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{app.trackName}</div>
        {listing.subtitle && (
          <div className="truncate text-sm text-zinc-600 dark:text-zinc-400">
            {listing.subtitle}
          </div>
        )}
        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-zinc-500">
          <span>{app.artistName}</span>
          {app.primaryGenreName && <span>{app.primaryGenreName}</span>}
          <span>{app.country.toUpperCase()}</span>
          {typeof app.averageUserRating === "number" && (
            <span>
              ★ {app.averageUserRating.toFixed(1)}
              {app.userRatingCount != null
                ? ` (${formatCount(app.userRatingCount)})`
                : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RecommendationsSection({
  title,
  subtitle,
  items,
  accent,
}: {
  title: string;
  subtitle: string;
  items: Audit["quickWins"];
  accent: "emerald" | "amber" | "sky";
}) {
  if (items.length === 0) return null;
  const dot = accentDot(accent);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-background">
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <span className={`size-2 rounded-full ${dot}`} aria-hidden />
          {title}
        </h3>
        <span className="text-xs text-zinc-500">{subtitle}</span>
      </header>
      <ol className="space-y-3">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
          >
            <div className="font-medium text-zinc-900 dark:text-zinc-50">
              {item.title}
            </div>
            <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {item.rationale}
            </p>
            {item.evidence && (
              <p className="mt-1 text-xs italic text-zinc-500">
                Evidence: {item.evidence}
              </p>
            )}
            {(item.before || item.after) && (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {item.before && (
                  <div className="rounded-md border border-rose-200/60 bg-rose-50 p-2 text-xs dark:border-rose-900/40 dark:bg-rose-950/20">
                    <div className="font-mono text-[10px] uppercase text-rose-700 dark:text-rose-400">
                      Before
                    </div>
                    <div className="mt-0.5 text-zinc-800 dark:text-zinc-200">
                      {item.before}
                    </div>
                  </div>
                )}
                {item.after && (
                  <div className="rounded-md border border-emerald-200/60 bg-emerald-50 p-2 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="font-mono text-[10px] uppercase text-emerald-700 dark:text-emerald-400">
                      After
                    </div>
                    <div className="mt-0.5 text-zinc-800 dark:text-zinc-200">
                      {item.after}
                    </div>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function CompetitorTable({
  rows,
  competitors,
}: {
  rows: Audit["competitorComparison"];
  competitors: Competitor[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-background">
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="text-base font-semibold">Competitor comparison</h3>
        <span className="text-xs text-zinc-500">Top {competitors.length}</span>
      </header>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {rows.map((row, idx) => {
          const comp = competitors[idx];
          return (
            <li key={idx} className="flex items-start gap-3 py-3">
              {comp?.artworkUrl ? (
                <Image
                  src={comp.artworkUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 rounded-lg"
                  unoptimized
                />
              ) : (
                <div className="size-9 rounded-lg bg-zinc-100 dark:bg-zinc-900" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{row.name}</div>
                <div className="text-xs text-zinc-500">{row.rating}</div>
                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {row.notes}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function accentDot(accent: "emerald" | "amber" | "sky"): string {
  switch (accent) {
    case "emerald":
      return "bg-emerald-500";
    case "amber":
      return "bg-amber-500";
    case "sky":
      return "bg-sky-500";
  }
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
