async function testDomain(domain) {
  const publicToken = 'JA1uQ-vNN6FTT5kLMRHJysHX-h8';
  const productId = '8892081537181';

  const url = new URL(`https://cache.judge.me/widgets/shopify/${domain}`);
  url.searchParams.set('public_token', publicToken);
  url.searchParams.set('review_widget_product_ids', productId);

  console.log(`TESTING DOMAIN: ${domain}`);

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });
    console.log(`STATUS: ${res.status}`);
    if (res.status === 200) {
      const data = await res.json();
      console.log('SUCCESS! data size:', JSON.stringify(data).length, 'bytes');
      return true;
    } else {
      const text = await res.text();
      console.log(`ERROR RESPONSE:`, text.substring(0, 150));
      return false;
    }
  } catch (err) {
    console.error(`FETCH ERROR:`, err);
    return false;
  }
}

async function run() {
  const domains = [
    'atsevam',
    'bgenfh-zn',
    'atsevam-myshopify',
    'bgenfh-zn-myshopify',
  ];

  for (const d of domains) {
    console.log('\n--------------------');
    const ok = await testDomain(d);
    if (ok) {
      console.log(`\n🎉 FOUND IT! The domain is: ${d}`);
      break;
    }
  }
}

run();
