"use client";

import Image from "next/image";
import type { AppMetadata } from "@/mastra/schemas";

type Props = {
  candidate: AppMetadata;
  onConfirm: () => void;
  onReject: () => void;
  disabled?: boolean;
  resolved?: "yes" | "no";
};

export function AppConfirmCard({
  candidate,
  onConfirm,
  onReject,
  disabled,
  resolved,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-4">
        {candidate.artworkUrl ? (
          <Image
            src={candidate.artworkUrl}
            alt={`${candidate.trackName} icon`}
            width={64}
            height={64}
            className="size-16 rounded-xl object-cover"
            unoptimized
          />
        ) : (
          <div className="size-16 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        )}
        <div className="flex-1 min-w-0">
          <div className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
            {candidate.trackName}
          </div>
          <div className="truncate text-sm text-zinc-600 dark:text-zinc-400">
            {candidate.artistName}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500">
            {candidate.primaryGenreName && (
              <span>{candidate.primaryGenreName}</span>
            )}
            <span>{candidate.country.toUpperCase()} store</span>
            {typeof candidate.averageUserRating === "number" && (
              <span>
                ★ {candidate.averageUserRating.toFixed(1)}
                {candidate.userRatingCount != null
                  ? ` (${formatCount(candidate.userRatingCount)})`
                  : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {resolved ? (
        <div className="mt-4 text-sm text-zinc-500">
          {resolved === "yes" ? "Confirmed — running audit." : "Cancelled."}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onReject}
            disabled={disabled}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            No, that&apos;s not it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Yes, audit this app
          </button>
        </div>
      )}
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
