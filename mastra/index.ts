import { Mastra } from "@mastra/core";
import { InMemoryStore } from "@mastra/core/storage";
import { asoAgent } from "./agents/aso-agent";
import { asoAuditWorkflow } from "./workflows/aso-audit-workflow";

export const mastra = new Mastra({
  agents: { asoAgent },
  workflows: { asoAuditWorkflow },
  storage: new InMemoryStore({ id: "aso-audit-store" }),
});

export { asoAuditWorkflow } from "./workflows/aso-audit-workflow";
export { asoAgent } from "./agents/aso-agent";
