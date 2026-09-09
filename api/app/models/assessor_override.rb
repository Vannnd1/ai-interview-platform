# frozen_string_literal: true

class AssessorOverride < ApplicationRecord
  belongs_to :portfolio_skill

  # ai_level may be nil when the portfolio skill was unassessed (GAP-02 fix).
  # Assessors can still override such skills by providing a valid override_level.
  validates :ai_level,       numericality: { only_integer: true, in: 1..5 }, allow_nil: true
  validates :override_level, numericality: { only_integer: true, in: 1..5 }
  validates :overridden_by,  presence: true
end
