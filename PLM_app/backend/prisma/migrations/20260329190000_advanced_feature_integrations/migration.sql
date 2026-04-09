-- NIYANTRAK AI advanced feature integrations

CREATE TABLE IF NOT EXISTS "template_learning_records" (
  "id" TEXT NOT NULL,
  "eco_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "eco_type" "ECOType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "normalized_pattern" TEXT NOT NULL,
  "outcome_quality_score" DOUBLE PRECISION,
  "cycle_time_days" DOUBLE PRECISION,
  "approved_first_pass" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_learning_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "template_learning_records_eco_id_key" ON "template_learning_records"("eco_id");
CREATE INDEX IF NOT EXISTS "template_learning_records_product_id_eco_type_created_at_idx" ON "template_learning_records"("product_id", "eco_type", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'template_learning_records_eco_id_fkey'
  ) THEN
    ALTER TABLE "template_learning_records"
      ADD CONSTRAINT "template_learning_records_eco_id_fkey"
      FOREIGN KEY ("eco_id") REFERENCES "ECO"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "eco_id" TEXT,
  "channel" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notifications_user_id_fkey'
  ) THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notifications_eco_id_fkey'
  ) THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_eco_id_fkey"
      FOREIGN KEY ("eco_id") REFERENCES "ECO"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "eco_embeddings" (
  "eco_id" TEXT PRIMARY KEY,
  "product_id" TEXT NOT NULL,
  "embedding" vector(384) NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'system',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "eco_embeddings_eco_id_fkey"
    FOREIGN KEY ("eco_id") REFERENCES "ECO"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "eco_embeddings_product_id_idx" ON "eco_embeddings"("product_id");
CREATE INDEX IF NOT EXISTS "eco_embeddings_embedding_ivfflat_idx" ON "eco_embeddings" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
