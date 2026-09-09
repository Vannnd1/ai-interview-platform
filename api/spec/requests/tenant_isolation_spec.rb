# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Multi-Tenant Isolation Security', type: :request do
  let(:org_a) do
    Organization.create!(
      name: 'Tenant Alpha',
      scheme: 'tenant-a',
      identifier: 'tenant-a',
      host: 'alpha.example.com'
    )
  end

  let(:org_b) do
    Organization.create!(
      name: 'Tenant Beta',
      scheme: 'tenant-b',
      identifier: 'tenant-b',
      host: 'beta.example.com'
    )
  end

  let(:user_a) { User.create!(email: 'assessor@alpha.com', password: 'Password123!', role: 'admin') }
  let(:user_b) { User.create!(email: 'assessor@beta.com', password: 'Password123!', role: 'admin') }

  let(:token_a) { JsonWebToken.encode({ user_id: user_a.id, role: user_a.role, scheme: org_a.scheme }) }
  let(:token_b) { JsonWebToken.encode({ user_id: user_b.id, role: user_b.role, scheme: org_b.scheme }) }

  let(:assessment_b) do
    Assessment.create!(
      tenant_id: org_b.id,
      created_by: user_b.id,
      name: 'Backend Dev Beta',
      time_limit_min: 30
    )
  end

  let(:session_b) do
    Session.create!(
      tenant_id: org_b.id,
      assessment: assessment_b,
      status: 'ended'
    )
  end

  let(:portfolio_b) do
    Portfolio.create!(
      session: session_b,
      generation_status: 'complete'
    )
  end

  let(:skill_b) do
    PortfolioSkill.create!(
      portfolio: portfolio_b,
      skill_label: 'Node.js Core',
      ai_level: 3,
      ai_confidence: 'high',
      competency_summary: 'Solid backend skills'
    )
  end

  describe 'Cross-Tenant Access Prevention' do
    it 'blocks assessor from Tenant A from overriding a skill from Tenant B' do
      post "/api/v1/portfolio_skills/#{skill_b.id}/override",
           params: { override: { override_level: 4, assessor_notes: 'Unauthorized override attempt' } }.to_json,
           headers: {
             'Authorization' => "Bearer #{token_a}",
             'Content-Type' => 'application/json'
           }

      # Must return 404 Not Found (tenant-scoped lookup failed)
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)['error']).to eq('Portfolio skill not found')
    end

    it 'blocks assessor from Tenant A from accessing or triggering fitgap on Tenant B portfolio' do
      post "/api/v1/portfolios/#{portfolio_b.id}/fitgap",
           params: { vacancy_id: 999 }.to_json,
           headers: {
             'Authorization' => "Bearer #{token_a}",
             'Content-Type' => 'application/json'
           }

      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)['error']).to eq('Portfolio not found')
    end
  end
end
