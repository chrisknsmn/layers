import { Agent } from "@mastra/core/agent";
import { nimModel } from "../llm";
import { asoAuditSkill } from "../skills";
import { parseAppStoreUrlTool } from "../tools/parse-app-store-url";
import { fetchAppMetadataTool } from "../tools/fetch-app-metadata";
import { scrapeAppListingTool } from "../tools/scrape-app-listing";
import { fetchCompetitorsTool } from "../tools/fetch-competitors";

const followUpInstructions = `
You are an ASO expert that helps users understand and act on the audit they
just received. Be concrete and reference the audit's actual findings when
asked to elaborate, justify, or expand on a recommendation.

When the user asks for additional analysis (e.g. "give me ten more keyword
ideas", "rewrite the description"), use the tools provided to fetch fresh
data if needed. Respect Apple's character limits when proposing copy:
title 30, subtitle 30, promotional text 170, keyword field 100.

When deeper scoring guidance is needed, fall back to this skill:

${asoAuditSkill}
`.trim();

export const asoAgent = new Agent({
  id: "aso-agent",
  name: "aso-agent",
  instructions: followUpInstructions,
  model: nimModel,
  tools: {
    parseAppStoreUrl: parseAppStoreUrlTool,
    fetchAppMetadata: fetchAppMetadataTool,
    scrapeAppListing: scrapeAppListingTool,
    fetchCompetitors: fetchCompetitorsTool,
  },
});
