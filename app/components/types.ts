import type { AppMetadata, Audit, Competitor, ListingScrape } from "@/mastra/schemas";

export type UserMessage = { id: string; role: "user"; text: string };

export type AssistantStatus = {
  id: string;
  role: "assistant";
  kind: "status";
  text: string;
};

export type AssistantText = {
  id: string;
  role: "assistant";
  kind: "text";
  text: string;
};

export type AssistantConfirm = {
  id: string;
  role: "assistant";
  kind: "confirm";
  candidate: AppMetadata;
  runId: string;
  resolved?: "yes" | "no";
};

export type AssistantAudit = {
  id: string;
  role: "assistant";
  kind: "audit";
  audit: Audit;
  app: AppMetadata;
  listing: ListingScrape;
  competitors: Competitor[];
};

export type AssistantError = {
  id: string;
  role: "assistant";
  kind: "error";
  text: string;
};

export type Message =
  | UserMessage
  | AssistantStatus
  | AssistantText
  | AssistantConfirm
  | AssistantAudit
  | AssistantError;
