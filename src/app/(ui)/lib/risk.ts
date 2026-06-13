import type { Deviation, Severity } from "@/domain/schemas/assessment";

/** Map severity/deviation to the semantic risk colors (FRONTEND_DESIGN §3). Color carries meaning only. */
export function severityColor(severity: Severity | null): string {
  switch (severity) {
    case "critical":
      return "var(--risk-critical)";
    case "high":
      return "var(--risk-high)";
    case "medium":
      return "var(--risk-medium)";
    case "low":
      return "var(--risk-standard)";
    default:
      return "var(--ink-3)";
  }
}

export function deviationColor(deviation: Deviation): string {
  switch (deviation) {
    case "unfavourable":
      return "var(--risk-high)";
    case "unusual":
      return "var(--risk-medium)";
    case "favourable":
      return "var(--risk-standard)";
    default:
      return "var(--ink-3)";
  }
}

export function scoreBand(score: number): Severity {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}
