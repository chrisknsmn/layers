import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { appStoreLocationSchema } from "../schemas";

const APP_STORE_URL_RE =
  /^https?:\/\/apps\.apple\.com\/([a-z]{2})\/app\/(?:[^/]+\/)?id(\d+)/i;

export const parseAppStoreUrlTool = createTool({
  id: "parse-app-store-url",
  description:
    "Parse an Apple App Store URL into a country code and numeric app id. " +
    "Accepts URLs like https://apps.apple.com/us/app/spotify/id324684580.",
  inputSchema: z.object({
    url: z.string().url(),
  }),
  outputSchema: appStoreLocationSchema,
  execute: async (input) => {
    const url = input.url.trim();
    const match = url.match(APP_STORE_URL_RE);
    if (!match) {
      throw new Error(
        `Not a valid Apple App Store URL: ${url}. ` +
          "Expected https://apps.apple.com/<country>/app/<slug>/id<numericId>",
      );
    }
    const [, country, appId] = match;
    return {
      country: country.toLowerCase(),
      appId,
      url,
    };
  },
});

export function parseAppStoreUrl(url: string): {
  country: string;
  appId: string;
  url: string;
} {
  const match = url.trim().match(APP_STORE_URL_RE);
  if (!match) {
    throw new Error(
      `Not a valid Apple App Store URL: ${url}. ` +
        "Expected https://apps.apple.com/<country>/app/<slug>/id<numericId>",
    );
  }
  return {
    country: match[1].toLowerCase(),
    appId: match[2],
    url: url.trim(),
  };
}
