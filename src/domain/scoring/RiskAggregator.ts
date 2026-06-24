import type { ClauseType } from "@/domain/schemas/clause";
import type { ClauseAssessment, Severity } from "@/domain/schemas/assessment";
import { RISK_CATEGORIES, type RiskCategory } from "@/domain/schemas/risk";

/**
 * Deterministic overall risk score — computed in code, not by the LLM (TECH_SPEC §4 Stage 3, PRD F4.3).
 * Transparent and reproducible: a weighted average of per-clause scores by clause-type importance,
 * floored so a single critical clause can't be diluted away.
 */

/** Relative importance of each clause type to overall contract risk. */
const IMPORTANCE: Record<ClauseType, number> = {
  liability_limit: 1.0,
  indemnity: 1.0,
  ip_ownership: 0.9,
  termination: 0.8,
  payment_terms: 0.7,
  confidentiality: 0.6,
  governing_law: 0.4,
  other: 0.3,
};

const SEVERITY_FLOOR: Record<Severity, number> = { low: 0, medium: 0, high: 0, critical: 80 };

export interface RiskAggregate {
  overall: number; // 0–100
  byCategory: Record<RiskCategory, number>;
}

type ScoredAssessment = ClauseAssessment & { riskScore: number; severity: Severity };

const isScored = (a: ClauseAssessment): a is ScoredAssessment =>
  a.riskScore !== null && a.severity !== null;

export function aggregateRisk(
  assessments: ClauseAssessment[],
  clauseTypeById: Map<string, ClauseType>,
): RiskAggregate {
  const scored = assessments.filter(isScored);
  if (scored.length === 0) {
    return { overall: 0, byCategory: { financial: 0, operational: 0, legal: 0, reputational: 0 } };
  }

  let weightSum = 0;
  let weighted = 0;
  let floor = 0;
  for (const a of scored) {
    const w = IMPORTANCE[clauseTypeById.get(a.clauseId) ?? "other"];
    weightSum += w;
    weighted += a.riskScore * w;
    floor = Math.max(floor, SEVERITY_FLOOR[a.severity]);
  }
  const avg = weightSum > 0 ? weighted / weightSum : 0;
  const overall = Math.round(Math.max(avg, floor));

  const byCategory = RISK_CATEGORIES.reduce(
    (acc, cat) => {
      const inCat = scored.filter((a) => a.riskCategories.includes(cat));
      acc[cat] = inCat.length
        ? Math.min(
            100,
            Math.max(
              0,
              Math.round(inCat.reduce((s, a) => s + a.riskScore, 0) / inCat.length),
            ),
          )
        : 0;
      return acc;
    },
    {} as Record<RiskCategory, number>,
  );

  return { overall: Math.min(100, Math.max(0, overall)), byCategory };
}
