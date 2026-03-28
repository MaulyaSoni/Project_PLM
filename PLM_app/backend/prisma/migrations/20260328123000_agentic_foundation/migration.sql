-- CreateTable
CREATE TABLE "agent_actions" (
    "id" TEXT NOT NULL,
    "eco_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EXECUTED',
    "reason" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "source" TEXT NOT NULL DEFAULT 'scheduler',
    "scheduled_for" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_actions_eco_id_action_type_created_at_idx" ON "agent_actions"("eco_id", "action_type", "created_at");

-- AddForeignKey
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_eco_id_fkey" FOREIGN KEY ("eco_id") REFERENCES "ECO"("id") ON DELETE CASCADE ON UPDATE CASCADE;