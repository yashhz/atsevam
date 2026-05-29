const STORE_DOMAIN = 'atsevam.myshopify.com';
const STOREFRONT_TOKEN = '2ab210c5ffeec737fa970fa99c1453bc';

const JUDGEME_TOKEN = 'JA1uQ-vNN6FTT5kLMRHJysHX-h8';
const JUDGEME_DOMAIN = 'bgenfh-zn.myshopify.com';

async function run() {
  const graphqlQuery = {
    query: `{
      products(first: 10) {
        nodes {
          id
          title
          handle
        }
      }
    }`
  };

  const response = await fetch(`https://${STORE_DOMAIN}/api/2024-04/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify(graphqlQuery),
  });

  const { data } = await response.json();
  const products = data.products.nodes;
  console.log('PRODUCTS FOUND:');
  console.log(products);

  const productIds = products.map(p => p.id.split('/').pop());
  
  const url = new URL('https://judge.me/api/v1/judgements/bulk_query_rating');
  url.searchParams.set('api_token', JUDGEME_TOKEN);
  url.searchParams.set('shop_domain', JUDGEME_DOMAIN);
  for (const id of productIds) {
    url.searchParams.append('product_ids[]', id);
  }

  console.log('QUERYING JUDGEME URL:', url.toString());

  const jRes = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
  });
  
  console.log('JUDGEME API STATUS:', jRes.status);
  const jData = await jRes.json();
  console.log('JUDGEME API DATA:');
  console.log(JSON.stringify(jData, null, 2));
}

run().catch(console.error);
