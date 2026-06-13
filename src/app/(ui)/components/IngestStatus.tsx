"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STEPS = [
  { key: "uploaded", label: "Filed" },
  { key: "parsing", label: "Structuring" },
  { key: "analyzing", label: "Analyzing" },
  { key: "ready", label: "Ready" },
] as const;

const CAPTION: Record<string, string> = {
  uploaded: "Filing your document…",
  parsing: "Structuring the contract — sections, numbering, cross-references…",
  analyzing: "Extracting clauses, benchmarking against market standard, and scoring risk…",
};

/** Live ingestion status via SSE + an animated skeleton so the analysis wait feels alive (PRD F1.5). */
export function IngestStatus({ contractId, initial }: { contractId: string; initial: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    if (status === "ready" || status === "failed") return;
    const es = new EventSource(`/api/contracts/${contractId}/stream`);
    es.onmessage = (e) => {
      const next = JSON.parse(e.data).status as string;
      setStatus(next);
      if (next === "ready" || next === "failed") {
        es.close();
        router.refresh();
      }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [contractId, status, router]);

  const activeIdx = STEPS.findIndex((s) => s.key === status);
  const working = status !== "ready" && status !== "failed";

  if (status === "failed") {
    return <p className="text-sm text-[var(--risk-critical)]">Ingestion failed. Please re-upload.</p>;
  }

  return (
    <div>
      <ol className="flex items-center gap-3 text-sm">
        {STEPS.map((step, i) => {
          const done = activeIdx > i;
          const active = activeIdx === i;
          return (
            <li key={step.key} className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2" style={{ color: done || active ? "var(--ink)" : "var(--ink-3)" }}>
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${active && working ? "animate-pulse" : ""}`}
                  style={{ background: done ? "var(--risk-standard)" : active ? "var(--claret)" : "var(--paper-edge)" }}
                />
                {step.label}
              </span>
              {i < STEPS.length - 1 && <span className="text-[var(--paper-edge)]">/</span>}
            </li>
          );
        })}
      </ol>

      {working && (
        <div className="mt-8">
          <p className="text-sm text-[var(--ink-2)]">
            {CAPTION[status] ?? "Working…"}
            <span className="ml-0.5 inline-flex">
              <span className="animate-pulse">.</span>
              <span className="animate-pulse [animation-delay:200ms]">.</span>
              <span className="animate-pulse [animation-delay:400ms]">.</span>
            </span>
          </p>

          {/* Skeleton mimicking the ready layout (summary + risk rail + clause cards). */}
          <div className="mt-8 grid grid-cols-[1fr_280px] gap-8 max-md:grid-cols-1">
            <div className="space-y-3">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-5 w-full" />
              <div className="skeleton h-5 w-5/6" />
              <div className="skeleton h-5 w-2/3" />
              <div className="mt-6 h-px bg-[var(--paper-edge)]" />
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-11/12" />
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="skeleton h-[120px] w-[120px] rounded-full" />
              <div className="skeleton h-3 w-28" />
              <div className="mt-2 w-full space-y-2">
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-3/4" />
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-[var(--radius)] border border-[var(--paper-edge)] bg-[var(--paper-2)] p-5">
                <div className="skeleton h-3 w-32" />
                <div className="mt-3 skeleton h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
