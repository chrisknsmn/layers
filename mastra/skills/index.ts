import { readFileSync } from "node:fs";
import { join } from "node:path";

function load(filename: string): string {
  return readFileSync(join(process.cwd(), "mastra", "skills", filename), "utf8");
}

export const asoAuditSkill = load("aso-audit.md");
