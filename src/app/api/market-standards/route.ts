import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { currentActor } from "@/infrastructure/auth";
import { getContainer } from "@/composition/container";
import { MarketStandardInput } from "@/domain/schemas/marketStandard";

/** List the org's market-standard baseline (org overrides + global defaults). */
export async function GET() {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await getContainer().marketStandards.list(actor.orgId));
}

/** Upsert one clause type's standard for the org (PRD F3.4 — configurable baseline). */
export async function PUT(req: Request) {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const input = MarketStandardInput.parse(await req.json());
    const saved = await getContainer().marketStandards.upsert(actor.orgId, input);
    return NextResponse.json(saved);
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: "validation", issues: e.issues }, { status: 400 });
    }
    throw e;
  }
}
