# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Portfolios::Generator do
  let(:mock_gemini) { instance_double(Gemini::HttpClient) }
  let(:assessment_skill_react) do
    instance_double(
      AssessmentSkill,
      skill_id: 'SK-ENG-001',
      skill_label: 'React / Frontend Development',
      scope_include: 'Hooks, state, components',
      l1_anchor: 'Basics',
      l2_anchor: 'Intermediate',
      l3_anchor: 'Advanced',
      l4_anchor: 'Lead',
      l5_anchor: 'Principal'
    )
  end
  let(:assessment_skill_sql) do
    instance_double(
      AssessmentSkill,
      skill_id: 'SK-ENG-004',
      skill_label: 'Database Design & SQL',
      scope_include: 'Queries, schema, indexes',
      l1_anchor: 'Basics',
      l2_anchor: 'Intermediate',
      l3_anchor: 'Advanced',
      l4_anchor: 'Lead',
      l5_anchor: 'Principal'
    )
  end

  let(:assessment) do
    instance_double(
      Assessment,
      id: 5,
      name: 'Frontend Engineer',
      assessment_skills: [assessment_skill_react, assessment_skill_sql]
    )
  end

  let(:map_react) do
    instance_double(
      CoverageMap,
      id: 101,
      skill_id: 'SK-ENG-001',
      skill_label: 'React / Frontend Development',
      is_discovered: false,
      state: 'covered',
      probe_count: 4
    )
  end

  let(:map_sql) do
    instance_double(
      CoverageMap,
      id: 102,
      skill_id: 'SK-ENG-004',
      skill_label: 'Database Design & SQL',
      is_discovered: false,
      state: 'not_yet',
      probe_count: 0
    )
  end

  let(:session) do
    instance_double(
      Session,
      id: 77,
      candidate_id: 123,
      assessment: assessment,
      coverage_maps: [map_react, map_sql],
      transcript_turns: []
    )
  end

  let(:portfolio) { instance_double(Portfolio, id: 88, portfolio_skills: portfolio_skills_double) }
  let(:portfolio_skills_double) { class_double(PortfolioSkill) }

  before do
    allow(assessment.assessment_skills).to receive(:order).with(:display_order).and_return([assessment_skill_react, assessment_skill_sql])
    allow(session.coverage_maps).to receive(:order).with(:id).and_return([map_react, map_sql])
    allow(session.coverage_maps).to receive(:index_by).with(&:skill_id).and_return({
      'SK-ENG-001' => map_react,
      'SK-ENG-004' => map_sql
    })
    allow(session.transcript_turns).to receive(:ordered).and_return([])
    allow(session).to receive(:portfolio).and_return(portfolio)
    allow(portfolio).to receive(:update!)
    allow(portfolio_skills_double).to receive(:destroy_all)
  end

  describe '#call' do
    subject(:generator) { described_class.new(session: session, gemini_client: mock_gemini) }

    it 'does NOT clamp unassessed skills to L1 (sets ai_level to nil and low confidence)' do
      gemini_payload = {
        'configured_skills' => [
          {
            'skill_id' => 'SK-ENG-001',
            'skill_label' => 'React / Frontend Development',
            'level' => 3,
            'confidence' => 'high',
            'evidence' => ['Split context into read/write providers'],
            'competency_summary' => 'Ahmad shows L3 patterns.'
          },
          {
            'skill_id' => 'SK-ENG-004',
            'skill_label' => 'Database Design & SQL',
            'level' => 0, # model gave 0 or omitted
            'confidence' => 'low',
            'evidence' => [],
            'competency_summary' => 'Not assessed'
          }
        ],
        'discovered_skills' => []
      }

      allow(mock_gemini).to receive(:generate_content).and_return(gemini_payload)

      # Expect React to be saved as L3
      expect(portfolio_skills_double).to receive(:create!).with(
        hash_including(
          skill_id: 'SK-ENG-001',
          ai_level: 3,
          ai_confidence: 'high'
        )
      )

      # Expect SQL (not_yet, 0 probes) to be saved as nil, NOT clamped to 1!
      expect(portfolio_skills_double).to receive(:create!).with(
        hash_including(
          skill_id: 'SK-ENG-004',
          ai_level: nil,
          ai_confidence: 'low'
        )
      )

      generator.call
    end

    it 'extracts JSON cleanly from markdown code blocks' do
      markdown_text = <<~JSON
        Here is the evaluation:
        ```json
        {
          "configured_skills": [
            {
              "skill_id": "SK-ENG-001",
              "skill_label": "React / Frontend Development",
              "level": 4,
              "confidence": "high",
              "evidence": ["Custom build tooling"],
              "competency_summary": "L4 standards"
            }
          ],
          "discovered_skills": []
        }
        ```
        Hope this is clear.
      JSON

      allow(mock_gemini).to receive(:generate_content).and_return(markdown_text)

      expect(portfolio_skills_double).to receive(:create!).with(
        hash_including(
          skill_id: 'SK-ENG-001',
          ai_level: 4,
          ai_confidence: 'high'
        )
      )

      generator.call
    end
  end
end
