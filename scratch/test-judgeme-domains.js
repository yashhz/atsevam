async function testDomain(domain) {
  const publicToken = 'JA1uQ-vNN6FTT5kLMRHJysHX-h8';
  const productId = '8892081537181'; // From console logs

  const url = new URL(`https://cache.judge.me/widgets/shopify/${domain}`);
  url.searchParams.set('public_token', publicToken);
  url.searchParams.set('review_widget_product_ids', productId);

  console.log(`TESTING DOMAIN: ${domain}`);
  console.log(`URL: ${url.toString()}`);

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });
    console.log(`STATUS: ${res.status}`);
    if (res.status === 200) {
      const data = await res.json();
      console.log('SUCCESS! Sample data size:', JSON.stringify(data).length, 'bytes');
      return true;
    } else {
      const text = await res.text();
      console.log(`ERROR RESPONSE:`, text.substring(0, 200));
      return false;
    }
  } catch (err) {
    console.error(`FETCH ERROR:`, err);
    return false;
  }
}

async function run() {
  const d1 = 'bgenfh-zn.myshopify.com';
  const d2 = 'atsevam.myshopify.com';

  console.log('--- TEST 1 ---');
  await testDomain(d1);

  console.log('\n--- TEST 2 ---');
  await testDomain(d2);
}

run();
