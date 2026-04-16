// Quick test to verify Shopify connection
const STOREFRONT_API_TOKEN = '2ab210c5ffeec737fa970fa99c1453bc';
const STORE_DOMAIN = 'atsevam.myshopify.com';

const query = `
  {
    shop {
      name
      description
    }
    products(first: 5) {
      edges {
        node {
          id
          title
          handle
        }
      }
    }
  }
`;

async function testConnection() {
  try {
    const response = await fetch(
      `https://${STORE_DOMAIN}/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_API_TOKEN,
        },
        body: JSON.stringify({ query }),
      }
    );

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ Connection failed with errors:');
      console.error(JSON.stringify(result.errors, null, 2));
    } else {
      console.log('✅ Successfully connected to Shopify!');
      console.log('\nStore Info:');
      console.log('Name:', result.data.shop.name);
      console.log('Description:', result.data.shop.description);
      console.log('\nProducts found:', result.data.products.edges.length);
      console.log('\nFirst few products:');
      result.data.products.edges.forEach(({node}) => {
        console.log(`  - ${node.title} (${node.handle})`);
      });
    }
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error(error.message);
  }
}

testConnection();
