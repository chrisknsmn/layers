import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { appMetadataSchema, type AppMetadata } from "../schemas";

const ITUNES_LOOKUP = "https://itunes.apple.com/lookup";

export async function fetchAppMetadata(
  appId: string,
  country: string,
): Promise<AppMetadata> {
  const url = `${ITUNES_LOOKUP}?id=${encodeURIComponent(
    appId,
  )}&country=${encodeURIComponent(country)}&entity=software`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`iTunes lookup failed (${res.status} ${res.statusText})`);
  }
  const data = (await res.json()) as {
    resultCount: number;
    results: Array<Record<string, unknown>>;
  };
  if (!data.resultCount || data.results.length === 0) {
    throw new Error(
      `No app found for id ${appId} in country ${country}. ` +
        "Double-check the URL or try a different storefront.",
    );
  }
  const r = data.results[0];
  return appMetadataSchema.parse({
    trackId: r.trackId,
    trackName: r.trackName,
    artistName: r.artistName,
    bundleId: r.bundleId,
    primaryGenreName: r.primaryGenreName,
    primaryGenreId: r.primaryGenreId,
    genres: r.genres ?? [],
    artworkUrl:
      r.artworkUrl512 ?? r.artworkUrl100 ?? r.artworkUrl60 ?? undefined,
    averageUserRating: r.averageUserRating,
    userRatingCount: r.userRatingCount,
    trackViewUrl: r.trackViewUrl,
    country,
    description: r.description,
    releaseNotes: r.releaseNotes,
    sellerName: r.sellerName,
    price: r.price,
    formattedPrice: r.formattedPrice,
    version: r.version,
    contentAdvisoryRating: r.contentAdvisoryRating,
    screenshotUrls: r.screenshotUrls ?? [],
    ipadScreenshotUrls: r.ipadScreenshotUrls ?? [],
    languageCodesISO2A: r.languageCodesISO2A ?? [],
  });
}

export const fetchAppMetadataTool = createTool({
  id: "fetch-app-metadata",
  description:
    "Fetch surface-level metadata (name, developer, icon, category, rating) " +
    "for an App Store listing via the iTunes Search API. Fast and free.",
  inputSchema: z.object({
    appId: z.string().regex(/^\d+$/),
    country: z.string().length(2),
  }),
  outputSchema: appMetadataSchema,
  execute: async (input) => fetchAppMetadata(input.appId, input.country),
});
