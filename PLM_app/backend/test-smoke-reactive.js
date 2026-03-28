/* eslint-disable no-console */
const API_BASE = 'http://localhost:5000/api';

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${method} ${path}`);
    err.response = json;
    throw err;
  }

  return json;
}

async function login(email, password) {
  const json = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return json.data;
}

async function main() {
  const results = [];
  const push = (step, ok, detail) => results.push({ step, ok, detail });

  try {
    const bob = await login('bob@plm.com', 'Admin@123');
    push('Step 2 Login as bob@plm.com', true, `role=${bob.user.role}`);

    const productsRes = await request('/products', { token: bob.token });
    const products = productsRes.data || [];
    const product = products.find((p) => p.status === 'ACTIVE');
    if (!product) throw new Error('No active product found');

    const template = await request(`/ai/template-suggestion?productId=${product.id}&ecoType=PRODUCT`, {
      token: bob.token,
    });
    push(
      'Step 3 Template Suggestion available',
      template && typeof template.data !== 'undefined',
      template?.data?.has_suggestion ? 'has_suggestion=true' : 'no template history yet (endpoint works)'
    );

    const draftChanges = [
      {
        fieldName: 'Sale Price',
        oldValue: Number(product.salePrice || 0),
        newValue: Number(product.salePrice || 0) + 5,
        changeType: 'CHANGED',
      },
      {
        fieldName: 'Cost Price',
        oldValue: Number(product.costPrice || 0),
        newValue: Number(product.costPrice || 0) + 2,
        changeType: 'CHANGED',
      },
    ];

    const quality = await request('/ai/quality-score', {
      method: 'POST',
      token: bob.token,
      body: {
        title: `Smoke ECO Draft ${Date.now()}`,
        type: 'PRODUCT',
        productId: product.id,
        changes: draftChanges,
        description: 'Smoke test draft for AI quality validation',
        effectiveDate: null,
        versionUpdate: true,
      },
    });
    push(
      'Step 3 Quality Score available',
      quality?.data && typeof quality.data.total_score !== 'undefined',
      `score=${quality?.data?.total_score ?? 'N/A'}`
    );

    const ecoTitle = `Smoke Reactive ECO ${Date.now()}`;
    const created = await request('/ecos', {
      method: 'POST',
      token: bob.token,
      body: {
        title: ecoTitle,
        type: 'PRODUCT',
        productId: product.id,
        effectiveDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        versionUpdate: true,
        assignedTo: bob.user.id,
        productChanges: draftChanges.map((c) => ({
          field: c.fieldName,
          oldValue: c.oldValue,
          newValue: c.newValue,
        })),
        description: 'Smoke test ECO created by API automation',
      },
    });

    const ecoId = created.data.id;
    push('Step 3 ECO creation', !!ecoId, `ecoId=${ecoId}`);

    await request(`/ecos/${ecoId}/submit`, {
      method: 'POST',
      token: bob.token,
    });

    const ecoAfterSubmit = await request(`/ecos/${ecoId}`, { token: bob.token });
    const complexityPresent = !!ecoAfterSubmit?.data?.aiComplexityData;
    push('Step 4 Complexity Estimate after submit', complexityPresent, complexityPresent ? 'aiComplexityData present' : 'missing');

    const carol = await login('carol@plm.com', 'Admin@123');
    push('Step 5 Login as carol@plm.com', true, `role=${carol.user.role}`);

    const precedents = await request(`/ai/precedents/${ecoId}`, { token: carol.token });
    const precedentOk = !!precedents?.data;
    push('Step 5 Precedent Finder for approver', precedentOk, precedentOk ? (precedents?.data?.has_precedents ? 'precedents found' : (precedents?.data?.reason || 'no precedents but endpoint working')) : 'missing');

    const alice = await login('alice@plm.com', 'Admin@123');
    push('Step 6 Login as alice@plm.com', true, `role=${alice.user.role}`);

    const aiResults = await request('/ai/results', { token: alice.token });
    const rows = Array.isArray(aiResults) ? aiResults : [];
    const forEco = rows.filter((r) => r.eco_id === ecoId || r.eco?.title === ecoTitle || r.ecoId === ecoId || r?.eco?.title === ecoTitle);
    const hasLatency = rows.some((r) => typeof r.latencyMs === 'number' || typeof r.latency_ms === 'number');

    push('Step 6 AI Observatory feed available', rows.length > 0, `rows=${rows.length}`);
    push('Step 6 AI latency data present', hasLatency, hasLatency ? 'latency found' : 'latency missing');

    const passCount = results.filter((r) => r.ok).length;
    const failCount = results.length - passCount;

    console.log('\nReactive AI Smoke Test Results');
    console.log('================================');
    for (const r of results) {
      console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.step} | ${r.detail}`);
    }
    console.log('--------------------------------');
    console.log(`Total: ${results.length}, Passed: ${passCount}, Failed: ${failCount}`);

    if (failCount > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Smoke test failed with exception:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response));
    }
    process.exit(1);
  }
}

main();
