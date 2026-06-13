import { z } from "zod";
import { ClauseType } from "@/domain/schemas/clause";
import { PartyPerspective } from "@/domain/schemas/contract";

/**
 * Configurable market-standard baseline (PRD F3.1). `orgId: null` is a global default;
 * an org may override per clause type. Seeded from a static config, editable via the admin API.
 */
export const MarketStandardSchema = z.object({
  id: z.string(),
  orgId: z.string().nullable(),
  clauseType: ClauseType,
  perspective: PartyPerspective,
  title: z.string(),
  standardPosition: z.string(), // the norm, described for the model + the reader
  acceptableRange: z.string().nullable(), // e.g. "liability cap 1–2x fees"
  referenceLanguage: z.string().nullable(),
  sourceNote: z.string().nullable(),
  active: z.boolean(),
});
export type MarketStandard = z.infer<typeof MarketStandardSchema>;

/** Admin upsert payload (PRD F3.4). */
export const MarketStandardInput = z.object({
  clauseType: ClauseType,
  perspective: PartyPerspective.default("us"),
  title: z.string().min(1),
  standardPosition: z.string().min(1),
  acceptableRange: z.string().nullable().default(null),
  referenceLanguage: z.string().nullable().default(null),
  sourceNote: z.string().nullable().default(null),
  active: z.boolean().default(true),
});
export type MarketStandardInput = z.infer<typeof MarketStandardInput>;
