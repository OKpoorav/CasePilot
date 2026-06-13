import { AppError, err, ok, type Result } from "@/domain/result";
import type { Stage, StageContext, StageOutput } from "@/domain/ports/Stage";
import type { LlmPort } from "@/domain/ports/llm";
import type { AnalysisRepo, AssessmentRepo, ClauseRepo } from "@/domain/ports/repositories";
import { SummarySchema } from "@/domain/schemas/analysis";
import { aggregateRisk } from "@/domain/scoring/RiskAggregator";
import { PROMPT_VERSIONS, SUMMARY_SYSTEM, buildSummaryPrompt } from "@/application/pipeline/prompts";

/**
 * Final stage — Plain-English Summary (TECH_SPEC §4, PRD F5). Built from the structured analysis
 * (clauses + benchmark + risk), not the raw pages, so every claim is grounded. The overall risk
 * score is computed in code by the RiskAggregator. Idempotent: upserts the analysis.
 */
export class SummariseStage implements Stage {
  readonly name = "summarise" as const;

  constructor(
    private readonly llm: LlmPort,
    private readonly clauses: ClauseRepo,
    private readonly assessments: AssessmentRepo,
    private readonly analyses: AnalysisRepo,
  ) {}

  async run(ctx: StageContext): Promise<Result<StageOutput>> {
    const { contract } = ctx;
    try {
      const [clauses, assessments] = await Promise.all([
        this.clauses.listByContract(contract.id),
        this.assessments.listByContract(contract.id),
      ]);

      const { prompt, refToClauseId } = buildSummaryPrompt(contract, clauses, assessments);
      const { object, model } = await this.llm.generate({
        task: "summarise",
        schema: SummarySchema,
        system: SUMMARY_SYSTEM,
        prompt,
        context: { contractId: contract.id, stage: "summarise", promptVersion: PROMPT_VERSIONS.summarise },
      });

      const topIssues = object.topIssues.map((ti) => ({
        ...ti,
        clauseIds: ti.clauseRefs
          .map((r) => refToClauseId.get(r))
          .filter((id): id is string => Boolean(id)),
      }));

      // Deterministic overall score (PRD F4.3) — code, not the LLM.
      const clauseTypeById = new Map(clauses.map((c) => [c.id, c.clauseType] as const));
      const { overall, byCategory } = aggregateRisk(assessments, clauseTypeById);

      await this.analyses.save({
        contractId: contract.id,
        overview: object.overview,
        whoCarriesRisk: object.whoCarriesRisk,
        keyTerms: object.keyTerms,
        topIssues,
        overallRiskScore: overall,
        riskByCategory: byCategory,
        modelVersions: { summarise: model },
      });
      return ok({ produced: topIssues.length });
    } catch (cause) {
      return err(new AppError("pipeline_failed", `summarise failed for ${contract.id}`, cause));
    }
  }
}
