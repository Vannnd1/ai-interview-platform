# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FitGap::Engine do
  let(:mock_gemini) { instance_double(Gemini::HttpClient) }
  let(:vacancy) do
    instance_double(
      Vacancy,
      id: 10,
      role_title: 'Senior Frontend Engineer',
      culture_dimensions: 'high ownership, direct feedback',
      competency_expectations: 'deep React and architecture'
    )
  end

  let(:v_skill_react) do
    instance_double(VacancySkill, skill_id: 'SK-ENG-001', skill_label: 'React / Frontend Development', expected_level: 3)
  end
  let(:v_skill_comm) do
    instance_double(VacancySkill, skill_id: 'SK-SOFT-001', skill_label: 'Communication', expected_level: 3)
  end
  let(:v_skill_design) do
    instance_double(VacancySkill, skill_id: 'SK-ENG-003', skill_label: 'System Design', expected_level: 2)
  end
  let(:v_skill_unassessed) do
    instance_double(VacancySkill, skill_id: 'SK-ENG-004', skill_label: 'Database Design & SQL', expected_level: 3)
  end

  let(:override_comm) do
    instance_double(AssessorOverride, override_level: 3, assessor_notes: 'Demonstrated proactive async updates')
  end

  let(:p_skill_react) do
    instance_double(
      PortfolioSkill,
      id: 1,
      skill_id: 'SK-ENG-001',
      skill_label: 'React / Frontend Development',
      ai_level: 3,
      ai_confidence: 'high',
      assessor_override: nil
    )
  end

  let(:p_skill_comm) do
    instance_double(
      PortfolioSkill,
      id: 2,
      skill_id: 'SK-SOFT-001',
      skill_label: 'Communication',
      ai_level: 2,
      ai_confidence: 'medium',
      assessor_override: override_comm
    )
  end

  let(:p_skill_design) do
    instance_double(
      PortfolioSkill,
      id: 3,
      skill_id: 'SK-ENG-003',
      skill_label: 'System Design',
      ai_level: 3,
      ai_confidence: 'high',
      assessor_override: nil
    )
  end

  let(:session) { instance_double(Session, id: 99, assessment: instance_double(Assessment, name: 'Frontend Dev')) }
  let(:portfolio_skills_relation) { [p_skill_react, p_skill_comm, p_skill_design] }
  let(:portfolio) do
    instance_double(Portfolio, id: 42, session: session, portfolio_skills: portfolio_skills_relation)
  end

  before do
    allow(vacancy).to receive_message_chain(:vacancy_skills, :index_by).and_return({
      'React / Frontend Development' => v_skill_react,
      'Communication' => v_skill_comm,
      'System Design' => v_skill_design,
      'Database Design & SQL' => v_skill_unassessed
    })
    allow(portfolio_skills_relation).to receive(:includes).with(:assessor_override).and_return(portfolio_skills_relation)

    allow(mock_gemini).to receive(:generate_content).and_return({
      'culture_narrative' => 'Strong culture match with high autonomy.',
      'overall_narrative' => 'Recommend proceeding to hiring manager conversation.'
    })
  end

  describe '#call' do
    subject(:engine) { described_class.new(portfolio: portfolio, vacancy: vacancy, gemini_client: mock_gemini) }

    it 'computes rule-based comparisons with required_level alias and override status' do
      report_double = instance_double(FitGapReport)
      expect(FitGapReport).to receive(:find_or_initialize_by).with(
        portfolio_id: 42,
        vacancy_id: 10
      ).and_return(report_double)

      expect(report_double).to receive(:update!).with(
        hash_including(
          culture_narrative: 'Strong culture match with high autonomy.',
          overall_narrative: 'Recommend proceeding to hiring manager conversation.'
        )
      ) do |args|
        comparisons = args[:skill_comparisons]

        # 1. React: candidate L3 vs expected L3 -> match
        react = comparisons.find { |c| c[:skill_id] == 'SK-ENG-001' }
        expect(react[:result]).to eq('match')
        expect(react[:delta]).to eq(0)
        expect(react[:expected_level]).to eq(3)
        expect(react[:required_level]).to eq(3)
        expect(react[:is_override]).to be false

        # 2. Communication: AI L2 overridden to L3 vs expected L3 -> match with is_override: true
        comm = comparisons.find { |c| c[:skill_id] == 'SK-SOFT-001' }
        expect(comm[:candidate_level]).to eq(3)
        expect(comm[:result]).to eq('match')
        expect(comm[:is_override]).to be true

        # 3. System Design: candidate L3 vs expected L2 -> exceed (+1)
        design = comparisons.find { |c| c[:skill_id] == 'SK-ENG-003' }
        expect(design[:result]).to eq('exceed')
        expect(design[:delta]).to eq(1)

        # 4. Database Design: unassessed -> not_assessed
        db = comparisons.find { |c| c[:skill_id] == 'SK-ENG-004' }
        expect(db[:candidate_level]).to be_nil
        expect(db[:result]).to eq('not_assessed')
        expect(db[:delta]).to be_nil
      end

      engine.call
    end

    it 'resiliently parses markdown-wrapped JSON responses from Gemini' do
      report_double = instance_double(FitGapReport)
      allow(FitGapReport).to receive(:find_or_initialize_by).and_return(report_double)

      allow(mock_gemini).to receive(:generate_content).and_return(
        "Here is the evaluation:\n```json\n{\"culture_narrative\":\"Good\",\"overall_narrative\":\"Solid hire\"}\n```\nBest regards."
      )

      expect(report_double).to receive(:update!).with(
        hash_including(
          culture_narrative: 'Good',
          overall_narrative: 'Solid hire'
        )
      )

      engine.call
    end

    it 'falls back to deterministic narrative if Gemini API call fails' do
      report_double = instance_double(FitGapReport)
      allow(FitGapReport).to receive(:find_or_initialize_by).and_return(report_double)

      allow(mock_gemini).to receive(:generate_content).and_raise(StandardError.new('Gemini timeout'))

      expect(report_double).to receive(:update!).with(
        hash_including(
          culture_narrative: nil,
          overall_narrative: a_string_including('Candidate shows')
        )
      )

      engine.call
    end
  end
end
