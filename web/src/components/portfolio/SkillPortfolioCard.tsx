import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import LevelBadge from "./LevelBadge";
import ConfidenceIndicator from "./ConfidenceIndicator";
import OverridePanel from "./OverridePanel";
import { ChevronDown, ChevronUp, Quote, Zap } from "lucide-react";
import { parseLevel } from "@/utils/constants";
import type { PortfolioSkill, AssessorOverride } from "@/types";

interface SkillPortfolioCardProps {
  skill: PortfolioSkill;
  override?: AssessorOverride;
  onOverrideSaved: (override: AssessorOverride) => void;
}

export default function SkillPortfolioCard({
  skill,
  override,
  onOverrideSaved,
}: SkillPortfolioCardProps) {
  const [expandedQuotes, setExpandedQuotes] = useState(false);
  const effectiveLevel = override?.override_level ?? parseLevel(skill.ai_level);
  const isUnassessed = effectiveLevel == null;

  const hasLongQuotes = skill.evidence?.some((q) => q.length > 180) || (skill.evidence?.length ?? 0) > 2;
  const displayedEvidence =
    expandedQuotes || !hasLongQuotes
      ? skill.evidence || []
      : (skill.evidence || []).slice(0, 2);

  return (
    <Card className="transition-all hover:border-border/80 shadow-xs">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Skill header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <LevelBadge level={effectiveLevel} />
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-foreground text-sm sm:text-base">
                  {skill.skill_label}
                </span>
                {skill.is_discovered && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900 font-medium">
                    <Zap className="h-3 w-3 text-amber-500" /> Discovered
                  </span>
                )}
                {isUnassessed && (
                  <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-medium">
                    Unassessed
                  </span>
                )}
              </div>
              <ConfidenceIndicator confidence={skill.ai_confidence} />
            </div>
          </div>
          <div className="self-end sm:self-start">
            <OverridePanel skill={skill} existingOverride={override} onSaved={onOverrideSaved} />
          </div>
        </div>

        {/* Low confidence or unassessed note */}
        {isUnassessed ? (
          <div className="text-xs text-muted-foreground bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md px-3.5 py-2.5">
            This skill was not sufficiently probed during the interview. No rating was assigned to avoid unfair false negatives.
          </div>
        ) : skill.ai_confidence?.toLowerCase() === "low" ? (
          <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-md px-3.5 py-2.5">
            Briefly explored. Confidence is low — warrants dedicated inquiry if this skill is vital for the role.
          </div>
        ) : null}

        {/* Evidence section */}
        {skill.evidence && skill.evidence.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-muted/50">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1">
                <Quote className="h-3 w-3" /> Candidate Evidence
              </span>
              {hasLongQuotes && (
                <button
                  type="button"
                  onClick={() => setExpandedQuotes((prev) => !prev)}
                  className="text-primary hover:underline inline-flex items-center gap-0.5 text-xs font-normal lowercase tracking-normal"
                >
                  {expandedQuotes ? (
                    <>collapse <ChevronUp className="h-3 w-3" /></>
                  ) : (
                    <>view all ({skill.evidence.length}) <ChevronDown className="h-3 w-3" /></>
                  )}
                </button>
              )}
            </div>

            <ul className="space-y-2">
              {displayedEvidence.map((quote, i) => (
                <li
                  key={i}
                  className="text-xs sm:text-sm text-foreground/90 bg-muted/30 border-l-2 border-primary/40 pl-3 py-1 italic rounded-r"
                >
                  "{quote}"
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Competency summary */}
        {skill.competency_summary && (
          <div className="space-y-1 pt-1 border-t border-muted/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Competency Synthesis
            </span>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {skill.competency_summary}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
