/* eslint-disable no-console */
const API = 'http://localhost:5000/api';

async function req(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

(async () => {
  const bob = (await req('/auth/login', { method: 'POST', body: { email: 'bob@plm.com', password: 'Admin@123' } })).data;
  const products = (await req('/products', { token: bob.token })).data.filter((p) => p.status === 'ACTIVE');

  for (const product of products) {
    const productTemplate = await req(`/ai/template-suggestion?productId=${product.id}&ecoType=PRODUCT`, { token: bob.token });
    const bomTemplate = await req(`/ai/template-suggestion?productId=${product.id}&ecoType=BOM`, { token: bob.token });

    console.log(
      `${product.name} | PRODUCT:${productTemplate?.data?.has_suggestion ? 'YES' : 'NO'} | BOM:${bomTemplate?.data?.has_suggestion ? 'YES' : 'NO'}`
    );
  }
})();
