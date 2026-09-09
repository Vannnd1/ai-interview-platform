# frozen_string_literal: true

class AllowNullAiLevelForUnassessedSkills < ActiveRecord::Migration[7.0]
  def up
    change_column_null :portfolio_skills, :ai_level, true

    execute <<~SQL
      ALTER TABLE portfolio_skills
        DROP CONSTRAINT IF EXISTS chk_portfolio_skills_ai_level;
      ALTER TABLE portfolio_skills
        ADD CONSTRAINT chk_portfolio_skills_ai_level
        CHECK (ai_level IS NULL OR (ai_level >= 1 AND ai_level <= 5));
    SQL
  end

  def down
    execute <<~SQL
      UPDATE portfolio_skills SET ai_level = 1 WHERE ai_level IS NULL;
      ALTER TABLE portfolio_skills
        DROP CONSTRAINT IF EXISTS chk_portfolio_skills_ai_level;
      ALTER TABLE portfolio_skills
        ADD CONSTRAINT chk_portfolio_skills_ai_level
        CHECK (ai_level BETWEEN 1 AND 5);
    SQL

    change_column_null :portfolio_skills, :ai_level, false
  end
end
