import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { competitorSchema, type Competitor } from "../schemas";

const ITUNES_SEARCH = "https://itunes.apple.com/search";

export async function fetchCompetitors(args: {
  searchTerm: string;
  country: string;
  excludeAppId: string;
  limit?: number;
}): Promise<Competitor[]> {
  const { searchTerm, country, excludeAppId, limit = 3 } = args;
  const url =
    `${ITUNES_SEARCH}?term=${encodeURIComponent(searchTerm)}` +
    `&country=${encodeURIComponent(country)}` +
    `&entity=software&limit=${limit + 4}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`iTunes search failed (${res.status} ${res.statusText})`);
  }
  const data = (await res.json()) as {
    resultCount: number;
    results: Array<Record<string, unknown>>;
  };

  const excludeId = Number(excludeAppId);
  const competitors: Competitor[] = [];
  for (const r of data.results) {
    if (r.trackId === excludeId) continue;
    competitors.push(
      competitorSchema.parse({
        trackId: r.trackId,
        trackName: r.trackName,
        artistName: r.artistName,
        averageUserRating: r.averageUserRating,
        userRatingCount: r.userRatingCount,
        primaryGenreName: r.primaryGenreName,
        trackViewUrl: r.trackViewUrl,
        artworkUrl: r.artworkUrl100 ?? r.artworkUrl60 ?? undefined,
      }),
    );
    if (competitors.length >= limit) break;
  }
  return competitors;
}

export const fetchCompetitorsTool = createTool({
  id: "fetch-competitors",
  description:
    "Find top competitor apps for an App Store category by searching iTunes " +
    "with a relevant search term. Used for comparative ASO scoring.",
  inputSchema: z.object({
    searchTerm: z
      .string()
      .describe(
        "Search term identifying the competitive set (typically the genre or a primary keyword from the app's title).",
      ),
    country: z.string().length(2),
    excludeAppId: z
      .string()
      .regex(/^\d+$/)
      .describe("App id to exclude from results (the audited app)."),
    limit: z.number().int().min(1).max(10).default(3),
  }),
  outputSchema: z.array(competitorSchema),
  execute: async (input) => fetchCompetitors(input),
});
