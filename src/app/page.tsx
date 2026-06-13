import Link from "next/link";
import { currentActor } from "@/infrastructure/auth";
import { getContainer } from "@/composition/container";
import { Dropzone } from "@/app/(ui)/components/Dropzone";

export default async function Home() {
  const actor = await currentActor();
  if (!actor) return null; // proxy.ts protects this route; render nothing if somehow unauthenticated
  const contracts = await getContainer().contracts.list(actor.orgId);

  return (
    <div>
      <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] max-lg:gap-8">
        <div>
          <p className="eyebrow">Contract analysis</p>
          <h1 className="mt-2 text-5xl leading-[1.05] text-[var(--ink)] max-md:text-4xl">
            Find the risk before your lawyer does.
          </h1>
          <p className="mt-4 max-w-md text-lg text-[var(--ink-2)]">
            Upload a contract. CasePilot structures it, extracts the clauses that matter, and surfaces
            the 10% that needs a human decision.
          </p>
        </div>
        <Dropzone />
      </section>

      <section className="mt-16">
        <div className="mb-3 flex items-baseline justify-between border-b border-[var(--paper-edge)] pb-2">
          <p className="eyebrow">Docket</p>
          {contracts.length > 0 && (
            <span className="text-xs text-[var(--ink-3)]">
              {contracts.length} contract{contracts.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {contracts.length === 0 ? (
          <p className="py-6 text-sm text-[var(--ink-3)]">No contracts yet — drop one above to begin.</p>
        ) : (
          <ul className="divide-y divide-[var(--paper-edge)]">
            {contracts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/contracts/${c.id}`}
                  className="group flex items-center justify-between gap-4 px-2 py-4 transition-colors hover:bg-[var(--paper-2)]"
                >
                  <span
                    className="truncate text-lg text-[var(--ink)] group-hover:text-[var(--claret)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {c.title}
                  </span>
                  <span className="mono shrink-0 text-xs text-[var(--ink-3)]">
                    {c.pageCount ? `${c.pageCount}p · ` : ""}
                    {c.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
