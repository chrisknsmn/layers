import { z } from "zod";

export const appStoreLocationSchema = z.object({
  country: z.string().length(2).describe("ISO country code, e.g. 'us'"),
  appId: z.string().regex(/^\d+$/).describe("Numeric track id"),
  url: z.string().url(),
});

export const appMetadataSchema = z.object({
  trackId: z.number(),
  trackName: z.string(),
  artistName: z.string(),
  bundleId: z.string().optional(),
  primaryGenreName: z.string().optional(),
  primaryGenreId: z.number().optional(),
  genres: z.array(z.string()).default([]),
  artworkUrl: z.string().url().optional(),
  averageUserRating: z.number().optional(),
  userRatingCount: z.number().optional(),
  trackViewUrl: z.string().url().optional(),
  country: z.string(),
  description: z.string().optional(),
  releaseNotes: z.string().optional(),
  sellerName: z.string().optional(),
  price: z.number().optional(),
  formattedPrice: z.string().optional(),
  version: z.string().optional(),
  contentAdvisoryRating: z.string().optional(),
  screenshotUrls: z.array(z.string()).default([]),
  ipadScreenshotUrls: z.array(z.string()).default([]),
  languageCodesISO2A: z.array(z.string()).default([]),
});
export type AppMetadata = z.infer<typeof appMetadataSchema>;

export const listingScrapeSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  promotionalText: z.string().optional(),
  description: z.string().optional(),
  whatsNew: z.string().optional(),
  screenshots: z.array(z.string()).default([]),
  hasAppPreviewVideo: z.boolean().default(false),
  averageRating: z.number().optional(),
  ratingCount: z.number().optional(),
  markdown: z.string().optional(),
});
export type ListingScrape = z.infer<typeof listingScrapeSchema>;

export const competitorSchema = z.object({
  trackId: z.number(),
  trackName: z.string(),
  artistName: z.string(),
  averageUserRating: z.number().optional(),
  userRatingCount: z.number().optional(),
  primaryGenreName: z.string().optional(),
  trackViewUrl: z.string().url().optional(),
  artworkUrl: z.string().url().optional(),
});
export type Competitor = z.infer<typeof competitorSchema>;

export const scoreDimensionSchema = z.object({
  name: z.string(),
  weight: z.number(),
  score: z.number().min(0).max(10),
  reasoning: z.string(),
  evidence: z.string(),
});

export const recommendationSchema = z.object({
  title: z.string(),
  rationale: z.string(),
  evidence: z.string(),
  before: z.string().optional(),
  after: z.string().optional(),
});

export const competitorRowSchema = z.object({
  name: z.string(),
  rating: z.string(),
  notes: z.string(),
});

export const auditSchema = z.object({
  overallScore: z.number().min(0).max(100),
  summary: z.string(),
  dimensions: z.array(scoreDimensionSchema),
  quickWins: z.array(recommendationSchema),
  highImpactChanges: z.array(recommendationSchema),
  strategicRecommendations: z.array(recommendationSchema),
  competitorComparison: z.array(competitorRowSchema),
});
export type Audit = z.infer<typeof auditSchema>;
