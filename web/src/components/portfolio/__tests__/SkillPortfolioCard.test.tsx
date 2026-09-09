import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SkillPortfolioCard from "../SkillPortfolioCard";
import type { PortfolioSkill } from "@/types";

describe("SkillPortfolioCard Component", () => {
  const onOverrideSaved = vi.fn();

  it("renders assessed skill with level, confidence, quotes, and summary", () => {
    const skill: PortfolioSkill = {
      id: 1,
      skill_id: "SK-ENG-001",
      skill_label: "React / Frontend Development",
      is_discovered: false,
      ai_level: 3,
      ai_confidence: "high",
      evidence: ["Split context into read and write providers to reduce re-renders."],
      competency_summary: "Ahmad shows consistent L3 competency in React architecture.",
    };

    render(
      <SkillPortfolioCard
        skill={skill}
        onOverrideSaved={onOverrideSaved}
      />
    );

    expect(screen.getByText("React / Frontend Development")).toBeInTheDocument();
    expect(screen.getByText("L3")).toBeInTheDocument();
    expect(screen.getByText(/Split context into read and write providers/i)).toBeInTheDocument();
    expect(screen.getByText(/Ahmad shows consistent L3 competency/i)).toBeInTheDocument();
  });

  it("handles unassessed skills without forcing L1 failure rating", () => {
    const skill: PortfolioSkill = {
      id: 2,
      skill_id: "SK-ENG-004",
      skill_label: "Database Design & SQL",
      is_discovered: false,
      ai_level: null, // unassessed
      ai_confidence: "low",
      evidence: [],
      competency_summary: "Skill was not assessed during this session due to time limit.",
    };

    render(
      <SkillPortfolioCard
        skill={skill}
        onOverrideSaved={onOverrideSaved}
      />
    );

    expect(screen.getByText("Database Design & SQL")).toBeInTheDocument();
    expect(screen.getAllByText("Unassessed").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/This skill was not sufficiently probed during the interview/i)
    ).toBeInTheDocument();
  });

  it("supports expanding and collapsing long candidate quotes", () => {
    const longQuote = "A".repeat(200);
    const skill: PortfolioSkill = {
      id: 3,
      skill_id: "SK-ENG-003",
      skill_label: "System Design",
      is_discovered: false,
      ai_level: 3,
      ai_confidence: "high",
      evidence: [longQuote, "Second quote", "Third quote"],
      competency_summary: "L3 system design",
    };

    render(
      <SkillPortfolioCard
        skill={skill}
        onOverrideSaved={onOverrideSaved}
      />
    );

    const toggleButton = screen.getByRole("button", { name: /view all/i });
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getByRole("button", { name: /collapse/i })).toBeInTheDocument();
    expect(screen.getByText(/"Third quote"/i)).toBeInTheDocument();
  });
});
