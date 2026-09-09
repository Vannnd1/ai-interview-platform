# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Session, type: :model do
  describe '#invite_url' do
    let(:session) { described_class.new(invite_token: 'test-token-123') }

    it 'defaults to frontend web url (localhost:5173) instead of API port' do
      ClimateControl.modify WEB_BASE_URL: nil, FRONTEND_URL: nil do
        expect(session.invite_url).to eq('http://localhost:5173/interview/test-token-123')
      end
    end

    it 'respects WEB_BASE_URL environment variable when set' do
      ClimateControl.modify WEB_BASE_URL: 'https://interview.example.com' do
        expect(session.invite_url).to eq('https://interview.example.com/interview/test-token-123')
      end
    end
  end
end
