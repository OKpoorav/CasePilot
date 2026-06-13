import type { ClauseType } from "@/domain/schemas/clause";

/**
 * Default market-standard baseline (PRD F3.1), perspective = "us" (customer/buyer).
 * Team-authored from common commercial-contract norms — NOT licensed legal data. Orgs override
 * via the admin API; these apply when no override exists. Used by DbMarketStandardRepo as fallback.
 */
export interface DefaultStandard {
  title: string;
  standardPosition: string;
  acceptableRange: string | null;
  referenceLanguage: string | null;
  sourceNote: string;
}

export const DEFAULT_MARKET_STANDARDS: Record<Exclude<ClauseType, "other">, DefaultStandard> = {
  liability_limit: {
    title: "Limitation of Liability",
    standardPosition:
      "Liability is mutually capped at the fees paid in the prior 12 months, with carve-outs (uncapped) for confidentiality breach, IP infringement, indemnification obligations, and gross negligence/willful misconduct. Consequential damages are mutually waived.",
    acceptableRange: "Cap of 1–2x annual fees; never uncapped against the customer for ordinary breach.",
    referenceLanguage: null,
    sourceNote: "Common SaaS/services norm.",
  },
  indemnity: {
    title: "Indemnity",
    standardPosition:
      "The vendor indemnifies the customer against third-party IP-infringement and confidentiality/data-breach claims arising from the vendor's services. Indemnities are mutual where appropriate and subject to prompt notice and control-of-defense terms.",
    acceptableRange: "Vendor IP indemnity expected; customer indemnity limited to its own data/inputs.",
    referenceLanguage: null,
    sourceNote: "Common vendor-favourable risk allocation flipped to customer view.",
  },
  governing_law: {
    title: "Governing Law",
    standardPosition:
      "Governed by the customer's home jurisdiction (or a neutral one), with exclusive jurisdiction and venue there. Avoid an unfamiliar or vendor-only forum that raises the cost of enforcement.",
    acceptableRange: "Customer's state/country or a mutually neutral forum.",
    referenceLanguage: null,
    sourceNote: "Standard forum-selection norm.",
  },
  termination: {
    title: "Termination",
    standardPosition:
      "Either party may terminate for material breach after a 30-day cure period; the customer may terminate for convenience on 30–90 days' notice with a pro-rata refund of prepaid, unused fees.",
    acceptableRange: "Cure period 30 days; convenience notice 30–90 days.",
    referenceLanguage: null,
    sourceNote: "Common balanced termination norm.",
  },
  ip_ownership: {
    title: "IP Ownership",
    standardPosition:
      "The customer owns its data and any bespoke deliverables; the vendor retains its pre-existing IP and grants the customer a perpetual licence to use deliverables. No assignment of customer IP to the vendor.",
    acceptableRange: "Customer owns deliverables + data; vendor keeps background IP.",
    referenceLanguage: null,
    sourceNote: "Standard work-product allocation.",
  },
  payment_terms: {
    title: "Payment Terms",
    standardPosition:
      "Net-30 payment from receipt of a valid invoice; price increases capped (e.g. ≤5%/yr or CPI) with notice; the customer may withhold reasonably disputed amounts pending resolution.",
    acceptableRange: "Net-30 to Net-60; annual increase ≤5% or CPI.",
    referenceLanguage: null,
    sourceNote: "Common commercial payment norm.",
  },
  confidentiality: {
    title: "Confidentiality",
    standardPosition:
      "Mutual confidentiality with standard exclusions (public, independently developed, rightfully received); obligations survive 3–5 years (indefinitely for trade secrets). Permitted disclosure on legal compulsion with notice.",
    acceptableRange: "Mutual; survival 3–5 years.",
    referenceLanguage: null,
    sourceNote: "Standard mutual NDA norm.",
  },
};
