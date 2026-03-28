const Groq = require('groq-sdk');
const { prisma } = require('../lib/prisma');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Using a supported Groq model like llama-3.3-70b-versatile or llama3-70b-8192
const MODEL = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
const FALLBACK_MODELS = ['llama-3.1-70b-versatile', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

async function storeAiResult({ ecoId, userId, featureType, input, output, latencyMs, cached }) {
  try {
    await prisma.aiResult.create({
      data: {
        ecoId: ecoId || null,
        userId: userId || null,
        featureType,
        input: JSON.stringify(input || {}),
        output: JSON.stringify(output || {}),
        latencyMs: latencyMs || null,
        cached: !!cached,
        modelUsed: MODEL,
      },
    });
  } catch (e) {
    // Never let storage failure break the main flow
    console.error('AiResult storage failed:', e.message);
  }
}

// ─────────────────────────────────────────────
// SHARED HELPER — call Groq and parse JSON back
// ─────────────────────────────────────────────
async function callGroq(systemPrompt, userPrompt, temperature = 0.4) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const modelsToTry = Array.from(new Set([MODEL, ...FALLBACK_MODELS]));
  let lastError;
  let response;

  for (const modelName of modelsToTry) {
    try {
      response = await groq.chat.completions.create({
        model: modelName,
        temperature,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      break;
    } catch (error) {
      lastError = error;
      const errMessage = String(error?.message || '').toLowerCase();
      // Keep trying if model is unavailable/decommissioned, otherwise fail fast.
      if (!errMessage.includes('decommissioned') && !errMessage.includes('model')) {
        break;
      }
    }
  }

  if (!response) {
    throw lastError || new Error('Failed to call Groq');
  }

  const raw = response.choices[0]?.message?.content || '';

  // Strip markdown code fences if model wraps in ```json
  const cleaned = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // If model returns plain text instead of JSON, wrap it
    return { raw_text: cleaned };
  }
}

function fallbackDescription({ ecoTitle, ecoType, productName, changes, versionUpdate, effectiveDate }) {
  const changeCount = Array.isArray(changes) ? changes.length : 0;
  const first = Array.isArray(changes) && changes[0]
    ? (changes[0].fieldName || changes[0].field || changes[0].componentName || 'core specification')
    : 'core specification';
  const mode = versionUpdate ? 'new version release strategy' : 'in-place update strategy';
  const when = effectiveDate ? `effective ${new Date(effectiveDate).toISOString().split('T')[0]}` : 'effective date to be confirmed';

  return {
    description: `${ecoTitle} proposes a ${ecoType} update for ${productName}, focused on ${first} and ${changeCount} total engineering change items. The objective is to improve product consistency and operational performance while maintaining traceability and approval discipline. This ECO follows a ${mode} and is planned with ${when}. Cross-functional review is recommended to confirm downstream impact on production planning, quality checks, and release readiness before implementation.`.slice(0, 900),
    summary: `${ecoType} ECO for ${productName} with ${changeCount} changes pending review.`.slice(0, 120),
    tags: ['fallback', ecoType.toLowerCase(), 'engineering-change'],
    risk_level: changeCount > 5 ? 'MEDIUM' : 'LOW'
  };
}

function fallbackImpactAnalysis({ ecoType, changes, openECOsCount }) {
  const count = Array.isArray(changes) ? changes.length : 0;
  const riskLevel = openECOsCount > 0 || count > 6 ? 'MEDIUM' : 'LOW';
  const urgency = riskLevel === 'MEDIUM' ? 6 : 4;

  return {
    risk_level: riskLevel,
    urgency_score: urgency,
    risk_summary: `Automated fallback assessment: ${count} proposed ${ecoType} change items were detected.`,
    estimated_impact: ecoType === 'BOM' ? 'Component and routing alignment review required' : 'Product master and pricing review required',
    key_considerations: [
      'Validate all affected fields/components before approval',
      'Check for concurrent ECO overlap on the same product',
      'Confirm implementation timing with operations and QA'
    ],
    recommendation: 'Proceed with standard approver review and verify downstream dependencies.',
    approval_priority: riskLevel === 'MEDIUM' ? 'ELEVATED' : 'ROUTINE',
    downstream_effects: [
      'May affect manufacturing instructions or product master values',
      'May require alignment with supply and quality teams'
    ]
  };
}

function fallbackConflicts(openECOs) {
  const hasConflicts = Array.isArray(openECOs) && openECOs.length > 0;
  return {
    has_conflicts: hasConflicts,
    conflict_count: hasConflicts ? Math.min(openECOs.length, 3) : 0,
    conflicts: hasConflicts
      ? openECOs.slice(0, 3).map((eco) => ({
          severity: 'MEDIUM',
          conflicting_eco_title: eco.title,
          conflicting_eco_id: eco.id,
          field: 'overlapping scope',
          description: 'Another open ECO exists for the same product and may overlap with this proposal.',
          suggestion: 'Compare field/component deltas and sequence approval or merge where required.'
        }))
      : [],
    dependencies: [],
    recommendation: hasConflicts
      ? 'Review concurrent ECOs before submitting this change.'
      : 'No conflicts detected. Safe to proceed.'
  };
}

function normalizeQualityScore(result) {
  const fallback = {
    total_score: 6,
    max_score: 10,
    grade: 'FAIR',
    blocking: false,
    improvements: ['Refine description with business impact details'],
    ready_to_submit: true,
    summary: 'Fallback quality assessment used due to AI output format mismatch.',
  };

  if (!result || typeof result !== 'object') return fallback;

  const total = Number(result.total_score);
  const normalizedTotal = Number.isFinite(total) ? Math.max(0, Math.min(10, Math.round(total))) : fallback.total_score;
  const improvements = Array.isArray(result.improvements)
    ? result.improvements.map((v) => String(v)).filter(Boolean)
    : fallback.improvements;

  return {
    total_score: normalizedTotal,
    max_score: 10,
    grade: typeof result.grade === 'string' ? result.grade : (normalizedTotal >= 8 ? 'GOOD' : normalizedTotal >= 6 ? 'FAIR' : 'POOR'),
    blocking: typeof result.blocking === 'boolean' ? result.blocking : normalizedTotal <= 4,
    improvements,
    ready_to_submit: typeof result.ready_to_submit === 'boolean' ? result.ready_to_submit : normalizedTotal >= 6,
    summary: typeof result.summary === 'string' && result.summary.trim().length > 0
      ? result.summary
      : `Draft quality score is ${normalizedTotal}/10.`,
  };
}

// ═══════════════════════════════════════════════════════
// FEATURE 1 — ECO DESCRIPTION GENERATOR
// ═══════════════════════════════════════════════════════
async function generateECODescription({
  ecoId,
  userId,
  ecoTitle,
  ecoType,           // 'PRODUCT' | 'BOM'
  productName,
  changes,           // array of { fieldName, oldValue, newValue, changeType }
  versionUpdate,     // boolean
  effectiveDate      // string or null
}) {
  const systemPrompt = `
You are a technical writer embedded in an engineering team at a
manufacturing company. Your job is to write clear, professional
Engineering Change Order (ECO) descriptions that will be reviewed
by approvers who are not necessarily technical experts.

Your descriptions must:
- Be written in professional business English
- Explain WHAT is changing and WHY it matters in plain language
- Highlight any operational or quality implications
- Be between 80-140 words — concise but complete
- Never use bullet points — flowing paragraph prose only
- Sound like a senior engineer wrote it, not a robot

Always respond with ONLY valid JSON in this exact format:
{
  "description": "your generated description here",
  "summary": "one sentence max 120 chars for reports table",
  "tags": ["tag1", "tag2", "tag3"],
  "risk_level": "LOW | MEDIUM | HIGH"
}
`.trim();

  const changesText = changes.map(c => {
    if (c.changeType === 'ADDED')   return `- ADDED: ${c.fieldName} (new value: ${c.newValue})`;
    if (c.changeType === 'REMOVED') return `- REMOVED: ${c.fieldName} (was: ${c.oldValue})`;
    if (c.changeType === 'CHANGED') return `- CHANGED: ${c.fieldName} from "${c.oldValue}" to "${c.newValue}"`;
    if (c.changeType === 'OP_ADDED')   return `- OPERATION ADDED: ${c.fieldName} (${c.newValue})`;
    if (c.changeType === 'OP_REMOVED') return `- OPERATION REMOVED: ${c.fieldName}`;
    if (c.changeType === 'OP_CHANGED') return `- OPERATION CHANGED: ${c.fieldName} — ${c.oldValue} → ${c.newValue}`;
    return `- ${c.fieldName}: ${c.oldValue} → ${c.newValue}`;
  }).join('\n');

  const userPrompt = `
Generate an ECO description for the following change request:

ECO TITLE: ${ecoTitle}
ECO TYPE: ${ecoType} (${ecoType === 'BOM' ? 'Bill of Materials change' : 'Product master data change'})
PRODUCT: ${productName}
VERSION STRATEGY: ${versionUpdate ? 'New version will be created' : 'Changes applied to existing version (in-place)'}
EFFECTIVE DATE: ${effectiveDate || 'Not specified'}

PROPOSED CHANGES:
${changesText}

Write a professional ECO description explaining these changes and their business/operational significance.
`.trim();

  const start = Date.now();
  let result;

  try {
    result = await callGroq(systemPrompt, userPrompt, 0.5);
  } catch {
    result = fallbackDescription({ ecoTitle, ecoType, productName, changes, versionUpdate, effectiveDate });
  }

  await storeAiResult({
    ecoId,
    userId,
    featureType: 'DESCRIPTION',
    input: { ecoTitle, ecoType, productName, changeCount: changes?.length || 0 },
    output: result,
    latencyMs: Date.now() - start,
    cached: false,
  });

  return result;
}

// ═══════════════════════════════════════════════════════
// FEATURE 2 — AI IMPACT ANALYSIS
// ═══════════════════════════════════════════════════════
async function generateImpactAnalysis({
  ecoId,
  userId,
  ecoTitle,
  ecoType,
  productName,
  productStatus,
  currentVersion,
  changes,
  versionUpdate,
  effectiveDate,
  recentAuditEvents,   // last 10 audit log entries for this product
  openECOsCount,       // how many other open ECOs exist for same product
  assignedApprover     // approver name
}) {
  const systemPrompt = `
You are an AI risk analyst integrated into a PLM (Product Lifecycle
Management) system at a manufacturing company. Your job is to analyze
Engineering Change Orders and produce a structured risk and impact
assessment to help approvers make faster, better-informed decisions.

Be direct, specific, and practical. Do not be vague.
Focus on real manufacturing and business implications of the changes.

Always respond with ONLY valid JSON in this exact format:
{
  "risk_level": "LOW | MEDIUM | HIGH | CRITICAL",
  "urgency_score": 7,
  "risk_summary": "One sentence describing the overall risk",
  "estimated_impact": "Manufacturing process change required | Price update only | Component substitution | etc",
  "key_considerations": [
    "specific consideration 1",
    "specific consideration 2",
    "specific consideration 3"
  ],
  "recommendation": "Short action recommendation for the approver",
  "approval_priority": "ROUTINE | ELEVATED | URGENT | CRITICAL",
  "downstream_effects": [
    "effect on manufacturing",
    "effect on supply chain or pricing"
  ]
}

Risk level guide:
LOW = quantity tweaks, minor price adjustments, adding operations
MEDIUM = component substitution, significant price changes, removing components
HIGH = removing critical components, major structural changes, new unvalidated materials
CRITICAL = changes that could affect product safety or regulatory compliance
`.trim();

  const changesText = changes.map(c => {
    if (c.changeType === 'ADDED')   return `  + ADDED ${c.fieldName}: ${c.newValue}`;
    if (c.changeType === 'REMOVED') return `  - REMOVED ${c.fieldName} (was: ${c.oldValue})`;
    if (c.changeType === 'CHANGED') return `  ~ CHANGED ${c.fieldName}: ${c.oldValue} → ${c.newValue}`;
    if (c.changeType === 'OP_ADDED')   return `  + OPERATION ADDED: ${c.fieldName} (${c.newValue})`;
    if (c.changeType === 'OP_REMOVED') return `  - OPERATION REMOVED: ${c.fieldName}`;
    if (c.changeType === 'OP_CHANGED') return `  ~ OPERATION CHANGED: ${c.fieldName}: ${c.oldValue} → ${c.newValue}`;
    return `  ~ ${c.fieldName}: ${c.oldValue} → ${c.newValue}`;
  }).join('\n');

  const auditContext = recentAuditEvents.length > 0
    ? recentAuditEvents.slice(0, 6).map(e => `  [${new Date(e.createdAt).toLocaleDateString()}] ${e.action}`).join('\n')
    : '  No recent changes on this product';

  const userPrompt = `
Analyze the following ECO and produce a risk and impact assessment:

ECO: ${ecoTitle}
TYPE: ${ecoType}
PRODUCT: ${productName} (currently at version ${currentVersion}, status: ${productStatus})
VERSION STRATEGY: ${versionUpdate ? 'New version will be created' : 'In-place update (no new version)'}
EFFECTIVE DATE: ${effectiveDate || 'Not specified'}
ASSIGNED APPROVER: ${assignedApprover || 'Unassigned'}
OTHER OPEN ECOS ON THIS PRODUCT: ${openECOsCount}

PROPOSED CHANGES:
${changesText}

RECENT PRODUCT HISTORY (last 6 events):
${auditContext}

Assess the risk, urgency, and impact of approving this ECO.
`.trim();

  const start = Date.now();
  let result;

  try {
    result = await callGroq(systemPrompt, userPrompt, 0.3);
  } catch {
    result = fallbackImpactAnalysis({ ecoType, changes, openECOsCount });
  }

  await storeAiResult({
    ecoId,
    userId,
    featureType: 'IMPACT_ANALYSIS',
    input: { ecoTitle, ecoType, productName, changeCount: changes?.length || 0, openECOsCount },
    output: result,
    latencyMs: Date.now() - start,
    cached: false,
  });

  return result;
}

// ═══════════════════════════════════════════════════════
// FEATURE 3 — CONFLICT DETECTION
// ═══════════════════════════════════════════════════════
async function detectECOConflicts({
  ecoId,
  userId,
  currentECO,          // { title, type, productId, productName, changes }
  openECOs             // array of other open ECOs for same product
}) {
  // If no other open ECOs, return clean immediately (no API call needed)
  if (!openECOs || openECOs.length === 0) {
    return {
      has_conflicts: false,
      conflict_count: 0,
      conflicts: [],
      recommendation: 'No conflicts detected. Safe to proceed.'
    };
  }

  const systemPrompt = `
You are a conflict detection system for a PLM (Product Lifecycle Management)
application. Your job is to analyze multiple Engineering Change Orders (ECOs)
that are open simultaneously for the same product and identify conflicts,
overlaps, or dependencies between them.

A CONFLICT exists when:
- Two ECOs modify the same component or field
- One ECO removes something another ECO modifies
- Two ECOs propose contradictory changes to the same data

A DEPENDENCY exists when:
- One ECO should logically be applied before another
- One ECO's changes assume the current state that another ECO is about to change

Always respond ONLY with valid JSON in this exact format:
{
  "has_conflicts": true,
  "conflict_count": 2,
  "conflicts": [
    {
      "severity": "HIGH | MEDIUM | LOW",
      "conflicting_eco_title": "ECO title here",
      "conflicting_eco_id": "eco-id-here",
      "field": "field or component name",
      "description": "plain English description of the conflict",
      "suggestion": "what to do about it"
    }
  ],
  "dependencies": [
    {
      "eco_title": "title",
      "description": "dependency description"
    }
  ],
  "recommendation": "overall recommendation for the user"
}
`.trim();

  const currentChangesText = currentECO.changes.map(c =>
    `  ${c.changeType}: ${c.fieldName} (${c.oldValue} → ${c.newValue})`
  ).join('\n');

  const openECOsText = openECOs.map(eco => {
    const changesText = (eco.changes || []).map(c =>
      `    ${c.changeType}: ${c.fieldName} (${c.oldValue} → ${c.newValue})`
    ).join('\n');
    return `
  ECO: "${eco.title}" [Status: ${eco.status}]
  Type: ${eco.type}
  Changes:
${changesText || '    (no changes recorded)'}`;
  }).join('\n');

  const userPrompt = `
Detect conflicts between the following ECOs, all targeting the same product: "${currentECO.productName}"

CURRENT ECO BEING CREATED/SUBMITTED:
Title: "${currentECO.title}"
Type: ${currentECO.type}
Changes:
${currentChangesText}

OTHER OPEN ECOs ON THIS PRODUCT (${openECOs.length} found):
${openECOsText}

Identify any conflicts, overlaps, or dependencies between the current ECO
and the existing open ECOs. Be specific about which fields or components conflict.
`.trim();

  const start = Date.now();
  let result;

  try {
    result = await callGroq(systemPrompt, userPrompt, 0.2);
  } catch {
    result = fallbackConflicts(openECOs);
  }

  await storeAiResult({
    ecoId,
    userId,
    featureType: 'CONFLICT_DETECTION',
    input: {
      currentTitle: currentECO?.title,
      currentType: currentECO?.type,
      changeCount: currentECO?.changes?.length || 0,
      openECOsCount: openECOs?.length || 0,
    },
    output: result,
    latencyMs: Date.now() - start,
    cached: false,
  });

  return result;
}

// FEATURE 4 — ECO DRAFT QUALITY SCORE
async function scoreECODraft({
  ecoId,
  userId,
  title,
  type,
  productName,
  changes,
  description,
  effectiveDate,
  versionUpdate,
}) {
  const systemPrompt = `
You are a quality reviewer for Engineering Change Orders in a
manufacturing PLM system. Your job is to score ECO drafts before
submission to ensure they meet professional standards.

Score the ECO on these 5 dimensions (0-2 points each, max 10):

1. TITLE_CLARITY (0-2): Is the title specific and descriptive?
2. CHANGE_COMPLETENESS (0-2): Are changes specific with old and new values?
3. DESCRIPTION_QUALITY (0-2): Is the business justification clear?
4. EFFECTIVE_DATE (0-2): Is a realistic effective date provided?
5. CHANGE_SCOPE (0-2): Are the changes appropriately scoped?

Respond ONLY with valid JSON.
`.trim();

  const changesText = (changes || []).map((c) =>
    `  ${c.changeType}: ${c.fieldName} (${c.oldValue || 'N/A'} -> ${c.newValue || 'N/A'})`
  ).join('\n');

  const userPrompt = `
Score this ECO draft:

TITLE: "${title || 'Not provided'}"
TYPE: ${type}
PRODUCT: ${productName}
EFFECTIVE DATE: ${effectiveDate || 'Not set'}
VERSION UPDATE: ${versionUpdate ? 'Creates new version' : 'In-place update'}

PROPOSED CHANGES (${changes?.length || 0} items):
${changesText || '  No changes proposed yet'}

DESCRIPTION:
${description || '(No description provided)'}
`.trim();

  const start = Date.now();
  let result;

  try {
    result = await callGroq(systemPrompt, userPrompt, 0.2);
  } catch {
    result = {
      total_score: 6,
      max_score: 10,
      grade: 'FAIR',
      blocking: false,
      improvements: ['Refine description with business impact details'],
      ready_to_submit: true,
      summary: 'Fallback quality assessment used due to AI unavailability.',
    };
  }

  result = normalizeQualityScore(result);

  const latency = Date.now() - start;

  await storeAiResult({
    ecoId,
    userId,
    featureType: 'QUALITY_SCORE',
    input: { title, type, productName, changesCount: changes?.length || 0 },
    output: result,
    latencyMs: latency,
  });

  if (ecoId) {
    await prisma.eCO.update({
      where: { id: ecoId },
      data: { aiQualityScore: JSON.stringify(result) },
    });
  }

  return result;
}

// FEATURE 5 — CHANGE COMPLEXITY ESTIMATOR
async function estimateComplexity({
  ecoId,
  userId,
  title,
  type,
  productName,
  currentVersion,
  changes,
  versionUpdate,
  totalECOsOnProduct,
  avgApprovalDaysHistorical,
  openECOsOnProduct,
}) {
  const systemPrompt = `
You are a complexity analysis engine for a manufacturing PLM system.
Estimate how complex and time-consuming the approval process will be.
Respond ONLY with valid JSON.
`.trim();

  const changesAnalysis = (changes || []).reduce((acc, c) => {
    acc[c.changeType] = (acc[c.changeType] || 0) + 1;
    return acc;
  }, {});

  const breakdown = Object.entries(changesAnalysis)
    .map(([t, c]) => `  ${t}: ${c} change(s)`)
    .join('\n');

  const userPrompt = `
Estimate approval complexity for this ECO:

ECO: "${title}"
TYPE: ${type} (${versionUpdate ? 'Creates new version' : 'In-place update'})
PRODUCT: ${productName} (currently v${currentVersion})

CHANGE BREAKDOWN:
${breakdown || '  No changes recorded'}
Total changes: ${changes?.length || 0}

HISTORICAL CONTEXT:
- Total ECOs ever raised on this product: ${totalECOsOnProduct}
- Historical average approval time: ${avgApprovalDaysHistorical ? avgApprovalDaysHistorical.toFixed(1) + ' days' : 'No history available'}
- Other open ECOs on this product right now: ${openECOsOnProduct}
`.trim();

  const start = Date.now();
  let result;

  try {
    result = await callGroq(systemPrompt, userPrompt, 0.25);
  } catch {
    result = {
      complexity_level: 'MODERATE',
      estimated_approval_days: 3,
      estimated_approval_days_range: '2-4',
      confidence: 'LOW',
      complexity_score: 5,
      complexity_max: 10,
      factors: [],
      risks: ['Fallback estimate used due to AI unavailability'],
      acceleration_tips: ['Add implementation details to speed review'],
      recommended_approver_type: 'Standard approver',
      summary: 'Moderate estimated complexity based on fallback rules.',
    };
  }

  const latency = Date.now() - start;

  await storeAiResult({
    ecoId,
    userId,
    featureType: 'COMPLEXITY_ESTIMATE',
    input: { title, type, changesCount: changes?.length || 0, openECOsOnProduct },
    output: result,
    latencyMs: latency,
  });

  if (ecoId) {
    await prisma.eCO.update({
      where: { id: ecoId },
      data: { aiComplexityData: JSON.stringify(result) },
    });
  }

  return result;
}

// FEATURE 6 — SMART ECO TEMPLATING
async function generateTemplateSuggestion({
  userId,
  productId,
  productName,
  ecoType,
  historicalECOs,
  currentBOMComponents,
  currentPrices,
}) {
  if (!historicalECOs || historicalECOs.length === 0) {
    const suggestion = ecoType === 'PRODUCT'
      ? {
          has_suggestion: true,
          confidence: 'MEDIUM',
          insight: `No historical ECOs found for ${productName}. A starter template is generated from current pricing baseline.`,
          pattern_detected: 'Bootstrap pricing optimization template',
          based_on_ecos: 0,
          suggested_title_prefix: `Optimize ${productName} pricing alignment`,
          suggested_changes: [
            {
              fieldName: 'Sale Price',
              oldValue: currentPrices?.salePrice ?? 0,
              newValue: Number(currentPrices?.salePrice ?? 0) + 5,
              changeType: 'CHANGED',
            },
            {
              fieldName: 'Cost Price',
              oldValue: currentPrices?.costPrice ?? 0,
              newValue: Number(currentPrices?.costPrice ?? 0) + 2,
              changeType: 'CHANGED',
            },
          ],
        }
      : {
          has_suggestion: true,
          confidence: 'MEDIUM',
          insight: `No historical ECOs found for ${productName}. A starter BOM template is generated from current component state.`,
          pattern_detected: 'Bootstrap BOM optimization template',
          based_on_ecos: 0,
          suggested_title_prefix: `Adjust ${productName} BOM efficiency`,
          suggested_changes: (currentBOMComponents || []).slice(0, 2).map((c) => ({
            fieldName: c.componentName,
            oldValue: c.quantity,
            newValue: Number(c.quantity || 0) + 1,
            changeType: 'CHANGED',
          })),
        };

    await storeAiResult({
      userId,
      featureType: 'TEMPLATE_SUGGESTION',
      input: { productId, productName, ecoType, historicalECOsCount: 0 },
      output: suggestion,
      latencyMs: 0,
      cached: true,
    });

    return suggestion;
  }

  const systemPrompt = `
You are a template suggestion engine for a PLM Engineering Change Order system.
Analyze historical ECOs and suggest a likely starting template.
Respond ONLY with valid JSON.
`.trim();

  const historyText = historicalECOs.slice(0, 5).map((eco) => {
    const ch = eco.bomComponentChanges || eco.productChanges || [];
    return `ECO: "${eco.title}" (${eco.type}, ${eco.status})\nChanges: ${ch.map((c) => `${c.changeType} ${c.fieldName || c.field || c.componentName}: ${c.oldValue ?? c.oldQty ?? 'N/A'}->${c.newValue ?? c.newQty ?? 'N/A'}`).join(', ')}`;
  }).join('\n\n');

  const currentState = ecoType === 'PRODUCT'
    ? `Sale Price: $${currentPrices?.salePrice}, Cost Price: $${currentPrices?.costPrice}`
    : `BOM Components: ${(currentBOMComponents || []).map((c) => `${c.componentName} (qty: ${c.quantity})`).join(', ')}`;

  const userPrompt = `
Generate a template suggestion for a new ${ecoType} ECO on product "${productName}".

RECENT ECO HISTORY FOR THIS PRODUCT:
${historyText}

CURRENT STATE:
${currentState}
`.trim();

  const start = Date.now();
  let result;

  try {
    result = await callGroq(systemPrompt, userPrompt, 0.3);
  } catch {
    result = { has_suggestion: false, reason: 'AI unavailable for template suggestion' };
  }

  const latency = Date.now() - start;

  await storeAiResult({
    userId,
    featureType: 'TEMPLATE_SUGGESTION',
    input: { productId, productName, ecoType, historicalECOsCount: historicalECOs.length },
    output: result,
    latencyMs: latency,
  });

  return result;
}

// FEATURE 7 — APPROVAL PRECEDENT FINDER
async function findApprovalPrecedents({
  ecoId,
  userId,
  title,
  type,
  productName,
  changes,
  allDoneECOs,
}) {
  if (!allDoneECOs || allDoneECOs.length === 0) {
    return { has_precedents: false, reason: 'No historical ECOs found' };
  }

  const systemPrompt = `
You are a precedent matching engine for a PLM approval system.
Find relevant historical approved ECO precedents.
Respond ONLY with valid JSON.
`.trim();

  const currentChangesText = (changes || []).map((c) =>
    `${c.changeType}: ${c.fieldName || c.field || c.componentName} (${c.oldValue ?? c.oldQty} -> ${c.newValue ?? c.newQty})`
  ).join(', ');

  const historicalText = allDoneECOs.slice(0, 15).map((eco) => {
    const ch = eco.bomComponentChanges || eco.productChanges || [];
    const approval = eco.approvals?.[0];
    return `Title: "${eco.title}"\nType: ${eco.type} | Product: ${eco.product?.name}\nChanges: ${ch.map((c) => `${c.changeType} ${c.fieldName || c.field || c.componentName}`).join(', ')}\nOutcome: APPROVED\nComment: "${approval?.comment || 'No comment'}"`;
  }).join('\n---\n');

  const userPrompt = `
Find precedents for this ECO:

CURRENT ECO: "${title}"
TYPE: ${type} | PRODUCT: ${productName}
CHANGES: ${currentChangesText}

HISTORICAL DONE ECOs (${allDoneECOs.length} total, showing top 15):
${historicalText}
`.trim();

  const start = Date.now();
  let result;

  try {
    result = await callGroq(systemPrompt, userPrompt, 0.2);
  } catch {
    result = { has_precedents: false, reason: 'AI unavailable for precedent matching' };
  }

  const latency = Date.now() - start;

  await storeAiResult({
    ecoId,
    userId,
    featureType: 'PRECEDENT_MATCH',
    input: { title, type, productName, changesCount: changes?.length || 0 },
    output: result,
    latencyMs: latency,
  });

  if (ecoId) {
    await prisma.eCO.update({
      where: { id: ecoId },
      data: { aiPrecedents: JSON.stringify(result) },
    });
  }

  return result;
}

module.exports = {
  generateECODescription,
  generateImpactAnalysis,
  detectECOConflicts,
  scoreECODraft,
  estimateComplexity,
  generateTemplateSuggestion,
  findApprovalPrecedents,
};
