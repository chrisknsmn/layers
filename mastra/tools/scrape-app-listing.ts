import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import Firecrawl from "@mendable/firecrawl-js";
import { listingScrapeSchema, type ListingScrape } from "../schemas";

let _client: Firecrawl | null = null;
function client(): Firecrawl {
  if (_client) return _client;
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "FIRECRAWL_API_KEY is not set. Add it to .env.local — required to scrape App Store listings.",
    );
  }
  _client = new Firecrawl({ apiKey });
  return _client;
}

const listingExtractionSchema = z.object({
  subtitle: z
    .string()
    .optional()
    .describe(
      "The subtitle shown directly under the app name on the App Store listing (max 30 chars on Apple).",
    ),
  promotionalText: z
    .string()
    .optional()
    .describe(
      "The promotional text shown at the top of the description (170 char limit).",
    ),
  whatsNew: z
    .string()
    .optional()
    .describe("The 'What's New' / release notes content on this version."),
  hasAppPreviewVideo: z
    .boolean()
    .optional()
    .describe("True if the listing has an App Preview video (Apple's video poster)."),
  averageRating: z
    .number()
    .optional()
    .describe("Average star rating shown on the page."),
  ratingCount: z
    .number()
    .optional()
    .describe("Total number of ratings shown on the page."),
});

export async function scrapeAppListing(url: string): Promise<ListingScrape> {
  const fc = client();

  const result = await fc.scrape(url, {
    formats: [
      "markdown",
      {
        type: "json",
        schema: listingExtractionSchema,
        prompt:
          "Extract the App Store listing's subtitle (under the app name), " +
          "promotional text (top of the description), what's new section, " +
          "whether an App Preview video exists, and visible rating data.",
      },
    ],
    onlyMainContent: true,
  });

  const extracted = (result.json ?? {}) as z.infer<
    typeof listingExtractionSchema
  >;

  const screenshots = extractScreenshotsFromMarkdown(result.markdown ?? "");

  return listingScrapeSchema.parse({
    url,
    subtitle: extracted.subtitle,
    promotionalText: extracted.promotionalText,
    whatsNew: extracted.whatsNew,
    hasAppPreviewVideo: extracted.hasAppPreviewVideo ?? false,
    averageRating: extracted.averageRating,
    ratingCount: extracted.ratingCount,
    screenshots,
    markdown: result.markdown,
  });
}

function extractScreenshotsFromMarkdown(md: string): string[] {
  const urls = new Set<string>();
  const re = /!\[[^\]]*\]\((https:\/\/[^)\s]+\.(?:png|jpg|jpeg|webp)[^)\s]*)\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    if (m[1].includes("mzstatic.com")) urls.add(m[1]);
  }
  return [...urls];
}

export const scrapeAppListingTool = createTool({
  id: "scrape-app-listing",
  description:
    "Scrape an App Store listing page via Firecrawl to extract fields that " +
    "the iTunes API does not expose: subtitle, promotional text, what's new, " +
    "screenshots, and whether an app preview video exists.",
  inputSchema: z.object({
    url: z.string().url(),
  }),
  outputSchema: listingScrapeSchema,
  execute: async (input) => scrapeAppListing(input.url),
});
