const crypto = require('crypto');
const { prisma } = require('../lib/prisma');

const HF_MODEL_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';
const VECTOR_DIM = 384;

function normalizeText(eco) {
  const title = String(eco.title || '');
  const description = String(eco.description || '');
  const changes = Array.isArray(eco.changes)
    ? eco.changes
        .map((c) => `${c.changeType || 'CHANGED'} ${c.fieldName || c.componentName || c.field || 'field'} ${c.oldValue ?? c.oldQty ?? ''} ${c.newValue ?? c.newQty ?? ''}`)
        .join(' | ')
    : '';
  return `${title}\n${description}\n${changes}`.trim();
}

function deterministicFallbackEmbedding(text) {
  const buf = crypto.createHash('sha512').update(text).digest();
  const vector = new Array(VECTOR_DIM).fill(0).map((_, idx) => {
    const b = buf[idx % buf.length];
    return (b / 255) * 2 - 1;
  });
  return vector;
}

async function embedText(text) {
  const token = process.env.HF_API_TOKEN;
  if (!token) return deterministicFallbackEmbedding(text);

  try {
    const response = await fetch(HF_MODEL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    });

    if (!response.ok) throw new Error(`HF ${response.status}`);

    const data = await response.json();
    const vector = Array.isArray(data?.[0]) ? data[0] : data;
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error('Invalid embedding payload');
    }

    const normalized = vector.slice(0, VECTOR_DIM).map((v) => Number(v) || 0);
    while (normalized.length < VECTOR_DIM) normalized.push(0);
    return normalized;
  } catch (error) {
    console.warn('[NIYANTRAK AI Semantic] HF embedding failed, using fallback:', error.message);
    return deterministicFallbackEmbedding(text);
  }
}

function vectorLiteral(vector) {
  return `[${vector.map((v) => Number(v).toFixed(8)).join(',')}]`;
}

async function upsertEcoEmbedding({ ecoId, productId, text, source = 'system' }) {
  const embedding = await embedText(text);
  const literal = vectorLiteral(embedding);

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO eco_embeddings (eco_id, product_id, embedding, source, created_at, updated_at)
      VALUES ($1, $2, $3::vector, $4, NOW(), NOW())
      ON CONFLICT (eco_id)
      DO UPDATE SET
        product_id = EXCLUDED.product_id,
        embedding = EXCLUDED.embedding,
        source = EXCLUDED.source,
        updated_at = NOW()
    `,
    ecoId,
    productId,
    literal,
    source
  );
}

async function similarEcosByMeaning({ ecoId, productId, text, limit = 5 }) {
  const embedding = await embedText(text);
  const literal = vectorLiteral(embedding);

  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT
        e.id,
        e.title,
        e.status,
        e.type,
        e.description,
        (1 - (emb.embedding <=> $1::vector)) AS similarity
      FROM eco_embeddings emb
      JOIN "ECO" e ON e.id = emb.eco_id
      WHERE e.status = 'DONE'
        AND e.product_id = $2
        AND ($3::text IS NULL OR e.id <> $3)
      ORDER BY emb.embedding <=> $1::vector ASC
      LIMIT $4
    `,
    literal,
    productId,
    ecoId || null,
    limit
  );

  return rows;
}

async function syncEmbeddingsForProduct(productId) {
  const doneEcos = await prisma.eCO.findMany({
    where: { productId, status: 'DONE' },
    select: {
      id: true,
      productId: true,
      title: true,
      description: true,
      productChanges: true,
      bomComponentChanges: true,
    },
    take: 120,
  });

  for (const eco of doneEcos) {
    const text = normalizeText({
      title: eco.title,
      description: eco.description || '',
      changes: eco.productChanges || eco.bomComponentChanges || [],
    });
    await upsertEcoEmbedding({
      ecoId: eco.id,
      productId: eco.productId,
      text,
      source: 'backfill',
    });
  }

  return doneEcos.length;
}

module.exports = {
  normalizeText,
  upsertEcoEmbedding,
  similarEcosByMeaning,
  syncEmbeddingsForProduct,
};
