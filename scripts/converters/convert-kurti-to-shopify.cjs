/**
 * KURTI CSV TO SHOPIFY CONVERTER
 * Converts your Kurti data into Shopify product import format
 * Handles: Multiple sizes as variants, smart tags, detailed descriptions
 */

const fs = require('fs');
const path = require('path');

// ─── CONFIGURATION ────────────────────────────────────────────────

const INPUT_FILE = 'data/kurti.csv'; // Put your CSV here: avetsam/data/kurti.csv
const OUTPUT_FILE = 'data/shopify-kurti-import.csv';

// Image column names in your CSV (adjust if different)
const IMAGE_COLUMNS = [
  'image', 'image', 'image', 'image', 'image', 
  'image', 'image', 'image', 'image', 'image', 'image'
]; // Your CSV has 11 image columns

// Shopify CSV Headers
const SHOPIFY_HEADERS = [
  'Handle',
  'Title',
  'Body (HTML)',
  'Vendor',
  'Product Category',
  'Type',
  'Tags',
  'Published',
  'Option1 Name',
  'Option1 Value',
  'Variant SKU',
  'Variant Grams',
  'Variant Inventory Tracker',
  'Variant Inventory Policy',
  'Variant Fulfillment Service',
  'Variant Price',
  'Variant Compare At Price',
  'Variant Requires Shipping',
  'Variant Taxable',
  'Variant Barcode',
  'Image Src',
  'Image Position',
  'Image Alt Text',
  'Gift Card',
  'SEO Title',
  'SEO Description',
  'Google Shopping / Google Product Category',
  'Google Shopping / Gender',
  'Google Shopping / Age Group',
  'Google Shopping / MPN',
  'Google Shopping / Condition',
  'Google Shopping / Custom Product',
  'Google Shopping / Custom Label 0',
  'Google Shopping / Custom Label 1',
  'Google Shopping / Custom Label 2',
  'Google Shopping / Custom Label 3',
  'Google Shopping / Custom Label 4',
  'Variant Image',
  'Variant Weight Unit',
  'Variant Tax Code',
  'Cost per item',
  'Included / India',
  'Price / India',
  'Compare At Price / India',
  'Status'
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────

/**
 * Convert Google Drive link to direct download URL
 * Reused from convert-to-shopify.js
 */
function convertGoogleDriveUrl(url) {
  if (!url || url.trim() === '' || url === 'NA') return '';
  
  // Handle Google Drive share links
  const match = url.match(/id=([^&]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  
  // Handle direct file links
  const fileMatch = url.match(/\/file\/d\/([^\/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
  }
  
  return url;
}

/**
 * Extract image URLs from row
 * Skips empty columns and Google Drive links (like convert-to-shopify.js)
 */
function extractImages(row, headers) {
  const images = [];
  
  // Find all columns that contain "image" in the header
  headers.forEach((header, idx) => {
    if (header.toLowerCase().includes('image')) {
      const value = row[header];
      if (value && value.trim() !== '' && value !== 'NA') {
        // Skip Google Drive links (they need manual download)
        if (!value.includes('drive.google.com')) {
          images.push(value.trim());
        }
      }
    }
  });
  
  return images;
}

/**
 * Parse CSV line (handles commas in quotes) - IMPROVED from convert-to-shopify.js
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === '\t' && !inQuotes) {
      // Support both comma and tab separation
      result.push(current.trim());
      current = '';
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Create URL-friendly handle from SKU - REUSED from convert-to-shopify.js
 */
function createHandle(sku) {
  return sku
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse sizes from format: "S(36),M(38),L(40),XL(42)"
 */
function parseSizes(sizeString) {
  if (!sizeString || sizeString === 'NA') return [];
  return sizeString.split(',').map(s => s.trim());
}

/**
 * Generate smart tags from product data with prefixes for structured filtering
 */
function generateTags(row) {
  const tags = [];
  
  // Category tag - prefixed
  tags.push('category:Kurti');
  
  // Color tag - prefixed
  if (row.colour && row.colour !== 'NA') {
    tags.push(`color:${row.colour.trim()}`);
  }
  
  // Work type tags - prefixed
  if (row.work && row.work !== 'NA') {
    const workTypes = row.work.split(/[,&]+/).map(w => w.trim());
    workTypes.forEach(work => {
      if (work.toLowerCase().includes('embroidery')) tags.push('work:Embroidery Work');
      if (work.toLowerCase().includes('printed')) tags.push('work:Printed');
      if (work.toLowerCase().includes('sequance') || work.toLowerCase().includes('sequin')) tags.push('work:Sequin Work');
      if (work.toLowerCase().includes('hand work')) tags.push('work:Hand Work');
      if (work.toLowerCase().includes('beads')) tags.push('work:Beads Work');
    });
  }
  
  // Fabric tags - prefixed
  if (row.kurtiFabric && row.kurtiFabric !== 'NA') {
    tags.push(`fabric:${row.kurtiFabric.trim()}`);
  }
  
  // Stitching type - prefixed
  if (row.stitchingType && row.stitchingType !== 'NA') {
    tags.push(`stitching:${row.stitchingType.trim()}`);
  }
  
  // Sleeve type - prefixed
  if (row.sleeve && row.sleeve !== 'NA') {
    tags.push(`sleeve:${row.sleeve.trim()}`);
  }
  
  // Neck type - prefixed
  if (row.neckType && row.neckType !== 'NA') {
    tags.push(`neck:${row.neckType.trim()}`);
  }
  
  // Set type - prefixed
  if (row.content && row.content.toLowerCase().includes('duptta')) {
    tags.push('set:With Dupatta');
  }
  if (row.content && row.content.toLowerCase().includes('bottom')) {
    tags.push('set:With Bottom');
  }
  
  // Remove duplicates and return
  return [...new Set(tags)];
}

/**
 * Generate detailed HTML description (SIMPLIFIED for frontend)
 * Frontend shows this in accordions, so keep it clean and structured
 */
function generateDescription(row) {
  let html = '';
  
  // Main description paragraph
  if (row.description) {
    html += `<p>${row.description}</p>\n\n`;
  }
  
  // Product Details - matches frontend accordion "Product Details"
  html += '<h3>Product Details</h3>\n<ul>\n';
  
  if (row.work && row.work !== 'NA') {
    html += `<li><strong>Work Pattern:</strong> ${row.work}</li>\n`;
  }
  if (row.stitchingType && row.stitchingType !== 'NA') {
    html += `<li><strong>Stitching Type:</strong> ${row.stitchingType}</li>\n`;
  }
  if (row.neckType && row.neckType !== 'NA') {
    html += `<li><strong>Neckline:</strong> ${row.neckType}</li>\n`;
  }
  if (row.sleeve && row.sleeve !== 'NA') {
    html += `<li><strong>Sleeves:</strong> ${row.sleeve}</li>\n`;
  }
  if (row.sleeveLength && row.sleeveLength !== 'NA') {
    html += `<li><strong>Sleeve Length:</strong> ${row.sleeveLength}</li>\n`;
  }
  if (row.content && row.content !== 'NA') {
    html += `<li><strong>Set Contents:</strong> ${row.content}</li>\n`;
  }
  
  html += '</ul>\n\n';
  
  // Fabric & Sizing - matches frontend accordion "Fabric & Sizing"
  html += '<h3>Fabric & Sizing</h3>\n<ul>\n';
  
  if (row.kurtiFabric && row.kurtiFabric !== 'NA') {
    html += `<li><strong>Kurti Fabric:</strong> ${row.kurtiFabric}</li>\n`;
  }
  if (row.bottomFabric && row.bottomFabric !== 'NA') {
    html += `<li><strong>Bottom Fabric:</strong> ${row.bottomFabric}</li>\n`;
  }
  if (row.dupattaFabric && row.dupattaFabric !== 'NA') {
    html += `<li><strong>Dupatta Fabric:</strong> ${row.dupattaFabric}</li>\n`;
  }
  if (row.innerFabric && row.innerFabric !== 'NA') {
    html += `<li><strong>Inner Lining:</strong> ${row.innerFabric}</li>\n`;
  }
  if (row.kurtiLength && row.kurtiLength !== 'NA') {
    html += `<li><strong>Kurti Length:</strong> ${row.kurtiLength}</li>\n`;
  }
  if (row.bottomLength && row.bottomLength !== 'NA' && row.bottomLength !== 'Not Available') {
    html += `<li><strong>Bottom Length:</strong> ${row.bottomLength}</li>\n`;
  }
  if (row.dupattaLength && row.dupattaLength !== 'NA' && row.dupattaLength !== 'Not Available') {
    html += `<li><strong>Dupatta Dimensions:</strong> ${row.dupattaLength}</li>\n`;
  }
  
  html += '</ul>\n\n';
  
  // Care & Delivery - matches frontend accordion "Care & Delivery"
  html += '<h3>Care & Delivery</h3>\n<ul>\n';
  html += '<li><strong>Washing:</strong> Dry clean only recommended</li>\n';
  html += '<li><strong>Drying:</strong> Dry in shade, avoid direct sunlight</li>\n';
  html += '<li><strong>Ironing:</strong> Iron on reverse side at low heat</li>\n';
  html += '<li><strong>Delivery:</strong> 5-7 business days within India</li>\n';
  html += '</ul>\n';
  
  return html;
}

/**
 * Calculate price (NO MARKUP - use B2B rate directly)
 */
function calculatePrice(b2bRate) {
  const basePrice = parseFloat(b2bRate);
  if (isNaN(basePrice)) return '';
  return Math.round(basePrice);
}

/**
 * Generate SEO-friendly title
 */
function generateTitle(row) {
  const parts = [];
  
  if (row.colour && row.colour !== 'NA') parts.push(row.colour);
  if (row.work && row.work !== 'NA') {
    const workShort = row.work.split(/[,&]/)[0].trim();
    parts.push(workShort);
  }
  if (row.kurtiFabric && row.kurtiFabric !== 'NA') parts.push(row.kurtiFabric);
  
  parts.push('Kurti');
  
  // Add set info
  if (row.content) {
    if (row.content.toLowerCase().includes('duptta') && row.content.toLowerCase().includes('bottom')) {
      parts.push('Set with Dupatta & Bottom');
    } else if (row.content.toLowerCase().includes('duptta')) {
      parts.push('with Dupatta');
    } else if (row.content.toLowerCase().includes('bottom')) {
      parts.push('with Bottom');
    }
  }
  
  return parts.join(' ');
}

// ─── MAIN CONVERSION LOGIC ────────────────────────────────────────

function convertKurtiToShopify() {
  console.log('🚀 Starting Kurti to Shopify conversion...\n');
  
  // Read input CSV
  const inputPath = path.join(__dirname, INPUT_FILE);
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: Input file not found: ${inputPath}`);
    console.log('Please create the file or update INPUT_FILE path');
    return;
  }
  
  const csvContent = fs.readFileSync(inputPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    console.error('❌ Error: CSV file is empty or has no data rows');
    return;
  }
  
  // Parse headers
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
  console.log(`📋 Found ${headers.length} columns in input CSV`);
  
  // Prepare output
  const outputRows = [SHOPIFY_HEADERS];
  let productCount = 0;
  let variantCount = 0;
  
  // Process each product
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    
    // Map to object
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    
    // Skip if no SKU
    if (!row.skuno || row.skuno === 'NA') continue;
    
    // Generate product data
    const title = generateTitle(row);
    const handle = createHandle(row.skuno);
    const description = generateDescription(row);
    const tags = generateTags(row).join(', ');
    const price = calculatePrice(row.b2brate);
    const sizes = parseSizes(row.size);
    const images = extractImages(row, headers);
    
    console.log(`\n📦 Processing: ${title}`);
    console.log(`   SKU: ${row.skuno}`);
    console.log(`   Sizes: ${sizes.join(', ')}`);
    console.log(`   Images: ${images.length} found`);
    console.log(`   Tags: ${tags}`);
    
    // Create variants for each size
    sizes.forEach((size, sizeIdx) => {
      const isFirstVariant = sizeIdx === 0;
      const variantSKU = sizes.length > 1 ? `${row.skuno}-${size.replace(/[^a-zA-Z0-9]/g, '')}` : row.skuno;
      
      const shopifyRow = [
        handle,                                    // Handle
        isFirstVariant ? title : '',              // Title (only first row)
        isFirstVariant ? description : '',        // Body (HTML)
        'Avestam',                                // Vendor
        'Apparel & Accessories > Clothing > Dresses', // Product Category
        'Kurti',                                  // Type
        isFirstVariant ? tags : '',               // Tags
        'TRUE',                                   // Published
        'Size',                                   // Option1 Name
        size,                                     // Option1 Value
        variantSKU,                               // Variant SKU
        '500',                                    // Variant Grams (estimate)
        'shopify',                                // Variant Inventory Tracker
        'deny',                                   // Variant Inventory Policy
        'manual',                                 // Variant Fulfillment Service
        price,                                    // Variant Price
        '',                                       // Variant Compare At Price
        'TRUE',                                   // Variant Requires Shipping
        'TRUE',                                   // Variant Taxable
        '',                                       // Variant Barcode
        isFirstVariant && images[0] ? images[0] : '', // Image Src (first image on first variant)
        isFirstVariant && images[0] ? '1' : '',   // Image Position
        isFirstVariant && images[0] ? `${title} - View 1` : '', // Image Alt Text
        'FALSE',                                  // Gift Card
        isFirstVariant ? title : '',              // SEO Title
        isFirstVariant ? row.description || title : '', // SEO Description
        '166',                                    // Google Shopping Category
        'Female',                                 // Gender
        'Adult',                                  // Age Group
        row.skuno,                                // MPN
        'New',                                    // Condition
        'FALSE',                                  // Custom Product
        row.colour || '',                         // Custom Label 0 (Color)
        row.work || '',                           // Custom Label 1 (Work)
        row.kurtifabric || '',                    // Custom Label 2 (Fabric)
        row.stitchingtype || '',                  // Custom Label 3 (Stitching)
        '',                                       // Custom Label 4
        '',                                       // Variant Image
        'kg',                                     // Variant Weight Unit
        '',                                       // Variant Tax Code
        row.b2brate || '',                        // Cost per item
        'TRUE',                                   // Included / India
        price,                                    // Price / India
        '',                                       // Compare At Price / India
        'active'                                  // Status
      ];
      
      outputRows.push(shopifyRow);
      variantCount++;
    });
    
    // Add additional rows for remaining images (like convert-to-shopify.js)
    for (let i = 1; i < images.length; i++) {
      const imageRow = new Array(SHOPIFY_HEADERS.length).fill('');
      imageRow[0] = handle;                      // Handle
      imageRow[20] = images[i];                  // Image Src
      imageRow[21] = (i + 1).toString();         // Image Position
      imageRow[22] = `${title} - View ${i + 1}`; // Image Alt Text
      
      outputRows.push(imageRow);
    }
    
    productCount++;
  }
  
  // Write output CSV
  const outputPath = path.join(__dirname, OUTPUT_FILE);
  const outputContent = outputRows.map(row => 
    row.map(cell => {
      const str = String(cell || '');
      // Escape quotes and wrap in quotes if contains comma or newline
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  ).join('\n');
  
  fs.writeFileSync(outputPath, outputContent, 'utf-8');
  
  console.log('\n\n✅ Conversion complete!');
  console.log(`📊 Stats:`);
  console.log(`   Products: ${productCount}`);
  console.log(`   Variants: ${variantCount}`);
  console.log(`   Output: ${outputPath}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Review the generated CSV file');
  console.log('   2. Images are included (non-Google Drive ones)');
  console.log('   3. For Google Drive images: Download them first, upload to Shopify Files, then update CSV');
  console.log('   4. Import to Shopify: Products → Import');
  console.log('\n💡 Tip: Images with filenames (like "40401_Purple (1).jpg") are included automatically');
  console.log('   Google Drive links are skipped - you need to download and upload those manually');
}

// ─── RUN ──────────────────────────────────────────────────────────

try {
  convertKurtiToShopify();
} catch (error) {
  console.error('❌ Error during conversion:', error.message);
  console.error(error.stack);
}
