import { LEVEL_LABELS, FIT_GAP_RESULT_LABELS, FIT_GAP_RESULT_CLASSES } from "@/utils/constants";
import { cn } from "@/lib/utils";
import type { SkillComparison } from "@/types";

interface ComparisonTableProps {
  comparisons: SkillComparison[];
}

function ResultBadge({ comparison }: { comparison: SkillComparison }) {
  const resultKey = comparison.result || "not_assessed";
  const label = FIT_GAP_RESULT_LABELS[resultKey] || resultKey;
  const classes = FIT_GAP_RESULT_CLASSES[resultKey] || "text-neutral-500 bg-neutral-100";

  let icon = "—";
  let suffix = "";
  if (resultKey === "match") {
    icon = "✅";
  } else if (resultKey === "exceed") {
    icon = "⭐";
    suffix = comparison.delta ? ` +${comparison.delta}` : "";
  } else if (resultKey === "gap") {
    icon = "⚠️";
    suffix = comparison.delta ? ` -${Math.abs(comparison.delta)}` : "";
  } else if (resultKey === "not_assessed") {
    icon = "⚪";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors",
        classes
      )}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}{suffix}</span>
    </span>
  );
}

export default function ComparisonTable({ comparisons = [] }: ComparisonTableProps) {
  if (!comparisons || comparisons.length === 0) {
    return (
      <div className="border border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground">
        No skills configured for comparison in this vacancy.
      </div>
    );
  }

  // Summary counts
  const matchCount = comparisons.filter((c) => c.result === "match").length;
  const gapCount = comparisons.filter((c) => c.result === "gap").length;
  const exceedCount = comparisons.filter((c) => c.result === "exceed").length;
  const notAssessedCount = comparisons.filter((c) => c.result === "not_assessed").length;

  return (
    <div className="space-y-3.5">
      <div className="overflow-x-auto rounded-lg border bg-card shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-muted-foreground">
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Skill</th>
              <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider">Required</th>
              <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider">Candidate</th>
              <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {comparisons.map((c, i) => {
              const requiredVal = c.expected_level ?? c.required_level;
              const requiredLabel = requiredVal != null ? (LEVEL_LABELS[requiredVal] || `L${requiredVal}`) : "—";
              const candidateLabel =
                c.candidate_level != null ? (LEVEL_LABELS[c.candidate_level] || `L${c.candidate_level}`) : "—";

              return (
                <tr key={`${c.skill_label}-${i}`} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {c.skill_label}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground font-mono font-medium">
                    {requiredLabel}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-medium">
                    {c.candidate_level != null ? (
                      <span className="inline-flex items-center gap-1.5 justify-center">
                        <span className="text-foreground">{candidateLabel}</span>
                        {c.is_override && (
                          <span
                            title="Human override applied by assessor"
                            className="inline-flex items-center gap-0.5 text-[11px] font-sans font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-300/60"
                            aria-label="Human override applied"
                          >
                            ✏ override
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic font-sans text-xs">Unassessed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ResultBadge comparison={c} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
        {matchCount > 0 && (
          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-md font-medium">
            ✅ Match: {matchCount}
          </span>
        )}
        {exceedCount > 0 && (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
            ⭐ Exceeds: {exceedCount}
          </span>
        )}
        {gapCount > 0 && (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
            ⚠️ Gap: {gapCount}
          </span>
        )}
        {notAssessedCount > 0 && (
          <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-md font-medium">
            ⚪ Not Assessed: {notAssessedCount}
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground/80">
          ✏ = Assessor calibrated AI rating
        </span>
      </div>
    </div>
  );
}
