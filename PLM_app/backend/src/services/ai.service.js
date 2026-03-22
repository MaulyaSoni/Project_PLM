const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Using a supported Groq model like llama-3.3-70b-versatile or llama3-70b-8192
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const FALLBACK_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

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

// ═══════════════════════════════════════════════════════
// FEATURE 1 — ECO DESCRIPTION GENERATOR
// ═══════════════════════════════════════════════════════
async function generateECODescription({
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

  try {
    return await callGroq(systemPrompt, userPrompt, 0.5);
  } catch {
    return fallbackDescription({ ecoTitle, ecoType, productName, changes, versionUpdate, effectiveDate });
  }
}

// ═══════════════════════════════════════════════════════
// FEATURE 2 — AI IMPACT ANALYSIS
// ═══════════════════════════════════════════════════════
async function generateImpactAnalysis({
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

  try {
    return await callGroq(systemPrompt, userPrompt, 0.3);
  } catch {
    return fallbackImpactAnalysis({ ecoType, changes, openECOsCount });
  }
}

// ═══════════════════════════════════════════════════════
// FEATURE 3 — CONFLICT DETECTION
// ═══════════════════════════════════════════════════════
async function detectECOConflicts({
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

  try {
    return await callGroq(systemPrompt, userPrompt, 0.2);
  } catch {
    return fallbackConflicts(openECOs);
  }
}

module.exports = {
  generateECODescription,
  generateImpactAnalysis,
  detectECOConflicts
};
