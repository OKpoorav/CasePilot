import { z } from "zod";

/** Risk categories a clause can fall under (PRD F4.2). Multi-label. */
export const RiskCategory = z.enum(["financial", "operational", "legal", "reputational"]);
export type RiskCategory = z.infer<typeof RiskCategory>;

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  financial: "Financial",
  operational: "Operational",
  legal: "Legal",
  reputational: "Reputational",
};

export const RISK_CATEGORIES = RiskCategory.options;
