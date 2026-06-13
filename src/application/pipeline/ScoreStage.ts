import { AppError, err, ok, type Result } from "@/domain/result";
import type { Stage, StageContext, StageOutput } from "@/domain/ports/Stage";
import type { LlmPort } from "@/domain/ports/llm";
import type { AssessmentRepo, ClauseRepo } from "@/domain/ports/repositories";
import { ScoreSchema } from "@/domain/schemas/assessment";
import { PROMPT_VERSIONS, SCORE_SYSTEM, buildScorePrompt } from "@/application/pipeline/prompts";

const clampScore = (n: number) =>
  Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));

/**
 * Stage 3 — Risk Scoring (TECH_SPEC §4, PRD F4). Per-clause risk/severity/categories from the LLM;
 * the OVERALL score is computed deterministically by the RiskAggregator (in the summarise stage),
 * not the model. Idempotent: updates existing assessments by clause ID.
 */
export class ScoreStage implements Stage {
  readonly name = "score" as const;

  constructor(
    private readonly llm: LlmPort,
    private readonly clauses: ClauseRepo,
    private readonly assessments: AssessmentRepo,
  ) {}

  async run(ctx: StageContext): Promise<Result<StageOutput>> {
    const { contract } = ctx;
    try {
      const clauses = await this.clauses.listByContract(contract.id);
      if (clauses.length === 0) return ok({ produced: 0 });

      const existing = await this.assessments.listByContract(contract.id);
      const { prompt, refToClauseId } = buildScorePrompt(contract, clauses, existing);

      const { object } = await this.llm.generate({
        task: "score",
        schema: ScoreSchema,
        system: SCORE_SYSTEM,
        prompt,
        context: { contractId: contract.id, stage: "score", promptVersion: PROMPT_VERSIONS.score },
      });

      const items = object.scores
        .map((s) => {
          const clauseId = refToClauseId.get(s.clauseRef);
          if (!clauseId) return null;
          return {
            clauseId,
            riskScore: clampScore(s.riskScore),
            severity: s.severity,
            riskCategories: s.riskCategories,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      await this.assessments.setScores(items);
      return ok({ produced: items.length });
    } catch (cause) {
      return err(new AppError("pipeline_failed", `score failed for ${contract.id}`, cause));
    }
  }
}
