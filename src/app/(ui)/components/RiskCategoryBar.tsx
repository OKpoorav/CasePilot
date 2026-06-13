import { RISK_CATEGORIES, RISK_CATEGORY_LABELS, type RiskCategory } from "@/domain/schemas/risk";
import { scoreBand, severityColor } from "@/app/(ui)/lib/risk";

/** Risk broken down by category (PRD F4.2) — financial / operational / legal / reputational. */
export function RiskCategoryBar({
  byCategory,
}: {
  byCategory: Partial<Record<RiskCategory, number>>;
}) {
  return (
    <dl className="space-y-2">
      {RISK_CATEGORIES.map((cat) => {
        const score = byCategory[cat] ?? 0;
        return (
          <div key={cat} className="flex items-center gap-3">
            <dt className="w-28 text-xs text-[var(--ink-2)]">{RISK_CATEGORY_LABELS[cat]}</dt>
            <dd className="flex flex-1 items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-[var(--paper-edge)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${score}%`, background: severityColor(scoreBand(score)) }}
                />
              </div>
              <span className="num w-8 text-right text-xs text-[var(--ink-3)]">{score}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
