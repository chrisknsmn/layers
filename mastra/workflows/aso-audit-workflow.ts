import { createStep, createWorkflow } from "@mastra/core/workflows";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import {
  appMetadataSchema,
  auditSchema,
  listingScrapeSchema,
  competitorSchema,
} from "../schemas";
import { parseAppStoreUrl } from "../tools/parse-app-store-url";
import { fetchAppMetadata } from "../tools/fetch-app-metadata";
import { scrapeAppListing } from "../tools/scrape-app-listing";
import { fetchCompetitors } from "../tools/fetch-competitors";
import { nimModel } from "../llm";
import { asoAuditSkill } from "../skills";

const identifyStep = createStep({
  id: "identify-app",
  description:
    "Parse the App Store URL, fetch surface metadata, and suspend for the " +
    "user to confirm the candidate before running the expensive audit.",
  inputSchema: z.object({ url: z.string().url() }),
  outputSchema: z.object({
    app: appMetadataSchema,
    url: z.string().url(),
  }),
  suspendSchema: z.object({
    candidate: appMetadataSchema,
  }),
  resumeSchema: z.object({
    confirmed: z.boolean(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    const { appId, country, url } = parseAppStoreUrl(inputData.url);

    if (!resumeData) {
      const candidate = await fetchAppMetadata(appId, country);
      await suspend({ candidate });
      return { app: candidate, url };
    }

    if (!resumeData.confirmed) {
      throw new Error(
        "User did not confirm the candidate app. Restart with a new URL.",
      );
    }

    const app = await fetchAppMetadata(appId, country);
    return { app, url };
  },
});

const scoringAgent = new Agent({
  id: "aso-scoring-agent",
  name: "aso-scoring-agent",
  instructions: asoAuditSkill,
  model: nimModel,
});

const auditStep = createStep({
  id: "run-audit",
  description:
    "Scrape the full listing, find competitors, and produce a scored ASO audit.",
  inputSchema: z.object({
    app: appMetadataSchema,
    url: z.string().url(),
  }),
  outputSchema: z.object({
    audit: auditSchema,
    app: appMetadataSchema,
    listing: listingScrapeSchema,
    competitors: z.array(competitorSchema),
  }),
  execute: async ({ inputData }) => {
    const { app, url } = inputData;

    const searchTerm = buildCompetitorSearchTerm(app);
    const country = app.country;

    const [listing, competitors] = await Promise.all([
      scrapeAppListing(url).catch((err) => {
        console.warn("[aso-audit] listing scrape failed:", err);
        return listingScrapeSchema.parse({ url });
      }),
      fetchCompetitors({
        searchTerm,
        country,
        excludeAppId: String(app.trackId),
        limit: 3,
      }).catch((err) => {
        console.warn("[aso-audit] competitor lookup failed:", err);
        return [];
      }),
    ]);

    const prompt = buildAuditPrompt({ app, listing, competitors });
    const result = await scoringAgent.generate(prompt, {
      structuredOutput: {
        schema: auditSchema,
        jsonPromptInjection: true,
      },
    });

    const audit = (result as { object?: unknown }).object;
    if (!audit) {
      throw new Error("Scoring agent did not return structured audit output.");
    }

    return {
      audit: auditSchema.parse(audit),
      app,
      listing,
      competitors,
    };
  },
});

function buildCompetitorSearchTerm(app: {
  trackName: string;
  primaryGenreName?: string;
}): string {
  const firstWord = app.trackName.split(/[\s:—\-]/)[0]?.trim();
  if (app.primaryGenreName) {
    return `${firstWord ?? app.trackName} ${app.primaryGenreName}`.trim();
  }
  return app.trackName;
}

function buildAuditPrompt(args: {
  app: z.infer<typeof appMetadataSchema>;
  listing: z.infer<typeof listingScrapeSchema>;
  competitors: z.infer<typeof competitorSchema>[];
}): string {
  const { app, listing, competitors } = args;
  const sections = [
    `# App metadata (iTunes Search API)`,
    JSON.stringify(
      {
        trackName: app.trackName,
        artistName: app.artistName,
        primaryGenreName: app.primaryGenreName,
        averageUserRating: app.averageUserRating,
        userRatingCount: app.userRatingCount,
        description: app.description?.slice(0, 1500),
        releaseNotes: app.releaseNotes?.slice(0, 600),
        screenshotCount: app.screenshotUrls.length,
        languageCount: app.languageCodesISO2A.length,
        price: app.formattedPrice,
        version: app.version,
      },
      null,
      2,
    ),
    `# Listing scrape (Firecrawl)`,
    JSON.stringify(
      {
        subtitle: listing.subtitle,
        promotionalText: listing.promotionalText,
        whatsNew: listing.whatsNew,
        hasAppPreviewVideo: listing.hasAppPreviewVideo,
        screenshotCount: listing.screenshots.length,
      },
      null,
      2,
    ),
    `# Top competitors`,
    JSON.stringify(
      competitors.map((c) => ({
        trackName: c.trackName,
        artistName: c.artistName,
        averageUserRating: c.averageUserRating,
        userRatingCount: c.userRatingCount,
      })),
      null,
      2,
    ),
    "",
    "Produce the ASO audit in the required JSON format. Return only JSON.",
  ];
  return sections.join("\n\n");
}

export const asoAuditWorkflow = createWorkflow({
  id: "aso-audit-workflow",
  description:
    "Identify an App Store listing, confirm with the user, then produce a " +
    "scored ASO audit with prioritized recommendations.",
  inputSchema: z.object({ url: z.string().url() }),
  outputSchema: z.object({
    audit: auditSchema,
    app: appMetadataSchema,
    listing: listingScrapeSchema,
    competitors: z.array(competitorSchema),
  }),
})
  .then(identifyStep)
  .then(auditStep)
  .commit();
