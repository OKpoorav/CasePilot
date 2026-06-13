import { AppError, err, ok, type Result } from "@/domain/result";
import type { Stage, StageContext, StageOutput } from "@/domain/ports/Stage";
import type { LlmPort } from "@/domain/ports/llm";
import type { AssessmentRepo, ClauseRepo, MarketStandardRepo } from "@/domain/ports/repositories";
import { BenchmarkSchema } from "@/domain/schemas/assessment";
import { BENCHMARK_SYSTEM, PROMPT_VERSIONS, buildBenchmarkPrompt } from "@/application/pipeline/prompts";

/**
 * Stage 2 — Market-Standard Comparison (TECH_SPEC §4, PRD F3). Each clause is compared to its
 * baseline; the model returns a deviation label + cited rationale. Idempotent: replaces the
 * contract's assessments (clearing any prior risk — the score stage re-runs after).
 */
export class BenchmarkStage implements Stage {
  readonly name = "benchmark" as const;

  constructor(
    private readonly llm: LlmPort,
    private readonly clauses: ClauseRepo,
    private readonly assessments: AssessmentRepo,
    private readonly standards: MarketStandardRepo,
  ) {}

  async run(ctx: StageContext): Promise<Result<StageOutput>> {
    const { contract } = ctx;
    try {
      const clauses = await this.clauses.listByContract(contract.id);
      if (clauses.length === 0) return ok({ produced: 0 });

      const standards = await this.standards.forContract(contract.orgId, contract.partyPerspective);
      const stdByType = new Map(standards.map((s) => [s.clauseType, s] as const));
      const clauseById = new Map(clauses.map((c) => [c.id, c] as const));

      const { prompt, refToClauseId } = buildBenchmarkPrompt(contract, clauses, standards);
      const { object } = await this.llm.generate({
        task: "benchmark",
        schema: BenchmarkSchema,
        system: BENCHMARK_SYSTEM,
        prompt,
        context: { contractId: contract.id, stage: "benchmark", promptVersion: PROMPT_VERSIONS.benchmark },
      });

      const items = object.assessments
        .map((a) => {
          const clauseId = refToClauseId.get(a.clauseRef);
          if (!clauseId) return null;
          const std = stdByType.get(clauseById.get(clauseId)!.clauseType);
          // Synthetic defaults use a "default:" id (not a real row) → store null.
          const marketStandardId = std && !std.id.startsWith("default:") ? std.id : null;
          return { clauseId, marketStandardId, deviation: a.deviation, rationale: a.rationale };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      await this.assessments.replaceBenchmark(contract.id, items);
      return ok({ produced: items.length });
    } catch (cause) {
      return err(new AppError("pipeline_failed", `benchmark failed for ${contract.id}`, cause));
    }
  }
}
