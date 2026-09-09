# frozen_string_literal: true

# GAP-03 / GAP-02 follow-up:
# Assessors must be able to override an unassessed skill (ai_level = NULL) by
# assigning an override_level. Without this migration, calling
# PortfolioSkillsController#override on a skill with ai_level = NULL would
# raise PG::NotNullViolation on the assessor_overrides.ai_level column.
#
# Reversible: rolling back sets ai_level = 1 for existing NULL rows then
# restores NOT NULL + old check.
class AllowNullAiLevelInAssessorOverrides < ActiveRecord::Migration[7.0]
  def up
    change_column_null :assessor_overrides, :ai_level, true

    execute <<~SQL
      ALTER TABLE assessor_overrides
        DROP CONSTRAINT IF EXISTS chk_overrides_ai_level;
      ALTER TABLE assessor_overrides
        ADD CONSTRAINT chk_overrides_ai_level
        CHECK (ai_level IS NULL OR (ai_level >= 1 AND ai_level <= 5));
    SQL
  end

  def down
    execute <<~SQL
      UPDATE assessor_overrides SET ai_level = 1 WHERE ai_level IS NULL;
      ALTER TABLE assessor_overrides
        DROP CONSTRAINT IF EXISTS chk_overrides_ai_level;
      ALTER TABLE assessor_overrides
        ADD CONSTRAINT chk_overrides_ai_level
        CHECK (ai_level >= 1 AND ai_level <= 5);
    SQL

    change_column_null :assessor_overrides, :ai_level, false
  end
end
