ALTER TABLE "agent_actions"
  ADD COLUMN IF NOT EXISTS "target_user_id" TEXT,
  ADD COLUMN IF NOT EXISTS "reasoning" TEXT,
  ADD COLUMN IF NOT EXISTS "context" TEXT,
  ADD COLUMN IF NOT EXISTS "outcome" TEXT;

ALTER TABLE "agent_actions"
  ALTER COLUMN "eco_id" DROP NOT NULL;
