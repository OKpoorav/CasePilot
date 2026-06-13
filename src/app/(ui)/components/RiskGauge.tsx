import { scoreBand, severityColor } from "@/app/(ui)/lib/risk";

/** Overall contract risk as a restrained arc + band label (FRONTEND_DESIGN §6). */
export function RiskGauge({ score }: { score: number }) {
  const band = scoreBand(score);
  const color = severityColor(band);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`Overall risk ${score} of 100`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--paper-edge)" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="66" textAnchor="middle" className="num" fontSize="30" fill="var(--ink)">
          {score}
        </text>
        <text x="70" y="86" textAnchor="middle" fontSize="11" fill="var(--ink-3)">
          / 100
        </text>
      </svg>
      <span className="eyebrow mt-1" style={{ color }}>
        {band} risk
      </span>
    </div>
  );
}
