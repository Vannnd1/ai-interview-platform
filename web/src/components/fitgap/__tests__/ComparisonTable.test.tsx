import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ComparisonTable from "../ComparisonTable";
import type { SkillComparison } from "@/types";

describe("ComparisonTable Component", () => {
  it("renders required levels and candidate levels correctly from backend payload", () => {
    const comparisons: SkillComparison[] = [
      {
        skill_label: "React / Frontend Development Core",
        expected_level: 3,
        candidate_level: 3,
        result: "match",
        delta: 0,
        is_override: false,
      },
      {
        skill_label: "System Design & Architecture",
        expected_level: 2,
        candidate_level: 3,
        result: "exceed",
        delta: 1,
        is_override: false,
      },
    ];

    render(<ComparisonTable comparisons={comparisons} />);

    // Check skills rendered
    expect(screen.getByText("React / Frontend Development Core")).toBeInTheDocument();
    expect(screen.getByText("System Design & Architecture")).toBeInTheDocument();

    // Check required levels rendered
    const l3Elements = screen.getAllByText("L3");
    expect(l3Elements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("L2")).toBeInTheDocument();

    // Check result badges
    expect(screen.getByText("Match")).toBeInTheDocument();
    expect(screen.getByText("Exceeds +1")).toBeInTheDocument();
  });

  it("renders human override indicator when is_override is true", () => {
    const comparisons: SkillComparison[] = [
      {
        skill_label: "Communication",
        expected_level: 3,
        candidate_level: 3,
        result: "match",
        delta: 0,
        is_override: true,
      },
    ];

    render(<ComparisonTable comparisons={comparisons} />);

    expect(screen.getByText(/override/i)).toBeInTheDocument();
  });

  it("renders unassessed state cleanly without false failing score", () => {
    const comparisons: SkillComparison[] = [
      {
        skill_label: "Database Design & SQL",
        expected_level: 3,
        candidate_level: null,
        result: "not_assessed",
        delta: null,
        is_override: false,
      },
    ];

    render(<ComparisonTable comparisons={comparisons} />);

    expect(screen.getByText("Database Design & SQL")).toBeInTheDocument();
    expect(screen.getByText("Unassessed")).toBeInTheDocument();
    expect(screen.getByText("Not assessed")).toBeInTheDocument();
  });

  it("renders friendly empty state when no comparisons exist", () => {
    render(<ComparisonTable comparisons={[]} />);

    expect(
      screen.getByText(/No skills configured for comparison in this vacancy/i)
    ).toBeInTheDocument();
  });
});
