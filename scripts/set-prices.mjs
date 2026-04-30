/**
 * ATSEVAM — Set compareAtPrice for all products
 *
 * Sets compareAtPrice = price × 1.5 on every variant
 * → Products will display as "33% OFF" across the store
 *
 * Usage:
 *   node scripts/set-prices.mjs --dry-run      ← preview only, no changes
 *   node scripts/set-prices.mjs                ← apply changes
 *   node scripts/set-prices.mjs --force        ← overwrite existing compareAtPrice too
 *   node scripts/set-prices.mjs --revert       ← remove all compareAtPrice
 *
 * Requires: scripts/.token (run auth.mjs first)
 */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────
const SHOP         = 'atsevam.myshopify.com';
const API_VERSION  = '2025-01';
const MULTIPLIER   = 1.5;   // price × 1.5 → shows as 33.3% OFF
const TOKEN_FILE   = path.join(__dirname, '.token');
// ──────────────────────────────────────────────────────────────────

// ─── Parse flags ──────────────────────────────────────────────────
const args      = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const FORCE     = args.includes('--force');
const REVERT    = args.includes('--revert');
// ──────────────────────────────────────────────────────────────────

// ─── Load token ───────────────────────────────────────────────────
let ACCESS_TOKEN;
try {
  ACCESS_TOKEN = readFileSync(TOKEN_FILE, 'utf8').trim();
} catch {
  console.error('\n❌ No token found. Run: node scripts/auth.mjs first\n');
  process.exit(1);
}
// ──────────────────────────────────────────────────────────────────

const API_URL = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();

  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

// ─── GraphQL: fetch all products (paginated) ──────────────────────
const PRODUCTS_QUERY = `
  query GetProducts($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        variants(first: 100) {
          nodes {
            id
            title
            price
            compareAtPrice
          }
        }
      }
    }
  }
`;

async function fetchAllProducts() {
  const products = [];
  let cursor = null;
  let page = 1;

  while (true) {
    process.stdout.write(`  Fetching page ${page}...`);
    const data = await gql(PRODUCTS_QUERY, { cursor });
    const batch = data.products.nodes;
    products.push(...batch);
    process.stdout.write(` ${batch.length} products\n`);

    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
    page++;

    // Respect rate limit: small delay between pages
    await sleep(300);
  }

  return products;
}

// ─── GraphQL: bulk update variants for one product ────────────────
const BULK_UPDATE_MUTATION = `
  mutation BulkUpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        compareAtPrice
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function updateVariants(productId, variants) {
  const data = await gql(BULK_UPDATE_MUTATION, { productId, variants });
  const result = data.productVariantsBulkUpdate;

  if (result.userErrors.length > 0) {
    throw new Error(`User errors: ${JSON.stringify(result.userErrors)}`);
  }

  return result.productVariants;
}

// ─── Helpers ──────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calcCompareAtPrice(price) {
  return (Math.round(parseFloat(price) * MULTIPLIER * 100) / 100).toFixed(2);
}

function fmt(num) {
  return `₹${parseFloat(num).toLocaleString('en-IN')}`;
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' ATSEVAM — Price Update Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (DRY_RUN)  console.log(' MODE: DRY RUN (no changes will be made)');
  if (REVERT)   console.log(' MODE: REVERT (removing all compareAtPrice)');
  if (FORCE)    console.log(' MODE: FORCE (overwriting existing compareAtPrice)');
  if (!DRY_RUN && !REVERT) {
    console.log(` RULE: compareAtPrice = price × ${MULTIPLIER} (${Math.round((1 - 1/MULTIPLIER) * 100)}% OFF)`);
  }

  console.log('\n📦 Fetching all products...\n');
  const products = await fetchAllProducts();
  console.log(`\n✅ Found ${products.length} products total\n`);

  let totalVariants = 0;
  let updatedVariants = 0;
  let skippedVariants = 0;
  let errorCount = 0;

  for (const product of products) {
    const variants = product.variants.nodes;
    const toUpdate = [];

    for (const variant of variants) {
      totalVariants++;

      if (REVERT) {
        // Remove compareAtPrice
        toUpdate.push({ id: variant.id, compareAtPrice: null });
        continue;
      }

      const hasExisting = variant.compareAtPrice && parseFloat(variant.compareAtPrice) > 0;

      if (hasExisting && !FORCE) {
        // Already has a compareAtPrice — skip unless --force
        if (DRY_RUN) {
          console.log(`  ⏭  SKIP  "${product.title}" / ${variant.title} — already has MRP ${fmt(variant.compareAtPrice)}`);
        }
        skippedVariants++;
        continue;
      }

      const newCompareAt = calcCompareAtPrice(variant.price);

      if (DRY_RUN) {
        console.log(
          `  🔍 WOULD SET  "${product.title}" / ${variant.title}\n` +
          `              price=${fmt(variant.price)}  →  compareAtPrice=${fmt(newCompareAt)}` +
          (hasExisting ? `  (was: ${fmt(variant.compareAtPrice)})` : '')
        );
      }

      toUpdate.push({ id: variant.id, compareAtPrice: newCompareAt });
    }

    if (toUpdate.length === 0) continue;

    updatedVariants += toUpdate.length;

    if (!DRY_RUN) {
      try {
        await updateVariants(product.id, toUpdate);
        console.log(`  ✅  "${product.title}" — ${toUpdate.length} variant(s) updated`);
      } catch (err) {
        console.error(`  ❌  "${product.title}" — FAILED: ${err.message}`);
        errorCount++;
      }

      // Respect Shopify's rate limit (2 req/sec for GraphQL)
      await sleep(500);
    }
  }

  // ─── Summary ──────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` Products scanned:   ${products.length}`);
  console.log(` Total variants:     ${totalVariants}`);
  if (REVERT) {
    console.log(` compareAtPrice removed: ${DRY_RUN ? '(dry run)' : updatedVariants}`);
  } else {
    console.log(` Variants to update: ${updatedVariants}`);
    console.log(` Variants skipped:   ${skippedVariants} (already had compareAtPrice)`);
  }
  if (errorCount > 0) console.log(` Errors:             ${errorCount} ⚠️`);

  if (DRY_RUN) {
    console.log('\n💡 This was a DRY RUN — no changes were made.');
    console.log('   To apply, run: node scripts/set-prices.mjs\n');
  } else {
    console.log('\n✅ Done!\n');
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
