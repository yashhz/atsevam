const fs = require('fs');
const path = require('path');

// Borrowed CSV parser from convert-to-shopify.js
function parseCSV(text) {
  const lines = text.split('\n');
  const result = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }

    currentRow.push(currentField.trim());
    
    if (currentRow.some(field => field !== '')) {
      result.push(currentRow);
    }
    
    currentRow = [];
    currentField = '';
    inQuotes = false;
  }

  return result;
}

// Generate Shopify handle from SKU
function generateHandle(sku) {
  return sku
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Clean and validate field
function cleanField(value) {
  if (!value || value === 'NA' || value === 'Not Available' || value === 'No lining') return '';
  return value.trim();
}

// Parse size string into array
function parseSizes(sizeStr) {
  if (!sizeStr) return [];
  
  // Handle formats like "M(38),L(40),XL(42)" or "S (36),M(38),L(40),XL(42),XXl(44)"
  const sizes = [];
  const matches = sizeStr.match(/([A-Z]+)\s*\(\d+\)/gi);
  
  if (matches) {
    matches.forEach(match => {
      const size = match.match(/([A-Z]+)/i)[1].toUpperCase();
      // Normalize XXl to XXL
      sizes.push(size === 'XXL' || size === 'XXL' ? 'XXL' : size);
    });
  }
  
  return sizes;
}

// Extract tags from product data with prefixes for structured filtering
function generateTags(row) {
  const tags = [];
  
  // Category - prefixed
  tags.push('category:Co-ord Set');
  
  // Color - prefixed
  const color = cleanField(row[15]);
  if (color) tags.push(`color:${color}`);
  
  // Work Type - prefixed
  const work = cleanField(row[14]);
  if (work) tags.push(`work:${work}`);
  
  // Top Fabric - prefixed
  const topFabric = cleanField(row[5]);
  if (topFabric) tags.push(`fabric:${topFabric}`);
  
  // Stitching - prefixed
  const stitching = cleanField(row[16]);
  if (stitching) tags.push(`stitching:${stitching}`);
  
  // Sleeve Length - prefixed
  const sleeveLength = cleanField(row[12]);
  if (sleeveLength) tags.push(`sleeve:${sleeveLength}`);
  
  // Neck Type - prefixed
  const neckType = cleanField(row[13]);
  if (neckType) tags.push(`neck:${neckType}`);
  
  // Set Type - prefixed
  tags.push('set:2-Piece');
  
  return tags.filter(Boolean).join(', ');
}

// Generate HTML description
function generateDescription(row) {
  const topFabric = cleanField(row[5]);
  const pantFabric = cleanField(row[6]);
  const lining = cleanField(row[7]);
  const topwearType = cleanField(row[8]);
  const bottomwearType = cleanField(row[9]);
  const topLength = cleanField(row[10]);
  const pantLength = cleanField(row[11]);
  const sleeveLength = cleanField(row[12]);
  const neckType = cleanField(row[13]);
  const work = cleanField(row[14]);
  const color = cleanField(row[15]);
  const stitching = cleanField(row[16]);
  const waistType = cleanField(row[17]);
  const description = cleanField(row[19]);
  
  let html = '<div class="product-description">\n';
  
  // Product Details Section
  html += '<h3>Product Details</h3>\n<ul>\n';
  if (topFabric) html += `<li><strong>Top Fabric:</strong> ${topFabric}</li>\n`;
  if (pantFabric) html += `<li><strong>Pant Fabric:</strong> ${pantFabric}</li>\n`;
  if (lining) html += `<li><strong>Lining:</strong> ${lining}</li>\n`;
  if (color) html += `<li><strong>Color:</strong> ${color}</li>\n`;
  if (work) html += `<li><strong>Work:</strong> ${work}</li>\n`;
  if (neckType) html += `<li><strong>Neck:</strong> ${neckType}</li>\n`;
  if (sleeveLength) html += `<li><strong>Sleeve:</strong> ${sleeveLength}</li>\n`;
  if (topwearType) html += `<li><strong>Top Type:</strong> ${topwearType}</li>\n`;
  if (bottomwearType) html += `<li><strong>Bottom Type:</strong> ${bottomwearType}</li>\n`;
  html += '</ul>\n\n';
  
  // Fabric & Sizing Section
  html += '<h3>Fabric & Sizing</h3>\n<ul>\n';
  if (topLength) html += `<li><strong>Top Length:</strong> ${topLength}</li>\n`;
  if (pantLength) html += `<li><strong>Pant Length:</strong> ${pantLength}</li>\n`;
  if (waistType) html += `<li><strong>Waist:</strong> ${waistType}</li>\n`;
  if (stitching) html += `<li><strong>Stitching:</strong> ${stitching}</li>\n`;
  html += '<li><strong>Sizes:</strong> M, L, XL, XXL available</li>\n';
  html += '</ul>\n\n';
  
  // Care & Delivery Section
  html += '<h3>Care & Delivery</h3>\n<ul>\n';
  html += '<li>Machine wash cold or hand wash</li>\n';
  html += '<li>Do not bleach</li>\n';
  html += '<li>Delivery within 5-7 business days</li>\n';
  html += '</ul>\n';
  
  if (description) {
    html += `\n<p class="additional-info">${description}</p>\n`;
  }
  
  html += '</div>';
  
  return html;
}

// Collect image filenames (skip Google Drive links)
function collectImages(row) {
  const images = [];
  // Images start at column 21
  for (let i = 21; i < row.length; i++) {
    const img = cleanField(row[i]);
    if (img && !img.includes('drive.google.com') && !img.includes('dropbox.com')) {
      images.push(img);
    }
  }
  return images;
}

// Main conversion function
function convertCoordToShopify(inputPath, outputPath) {
  console.log('Reading Co-ord Set CSV...');
  const csvContent = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(csvContent);
  
  // Skip header row
  const dataRows = rows.slice(1);
  
  console.log(`Found ${dataRows.length} Co-ord Set products`);
  
  // Shopify CSV headers
  const shopifyHeaders = [
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
    'Status'
  ];
  
  const shopifyRows = [shopifyHeaders];
  let productCount = 0;
  let variantCount = 0;
  
  dataRows.forEach((row, index) => {
    const srNo = cleanField(row[0]);
    if (!srNo) return; // Skip empty rows
    
    const sku = cleanField(row[1]);
    const sizeStr = cleanField(row[2]);
    const price = cleanField(row[3]);
    const color = cleanField(row[15]);
    
    if (!sku || !price) {
      console.log(`Skipping row ${index + 2}: Missing SKU or price`);
      return;
    }
    
    const sizes = parseSizes(sizeStr);
    if (sizes.length === 0) {
      console.log(`Skipping row ${index + 2}: No valid sizes found`);
      return;
    }
    
    const handle = generateHandle(sku);
    const title = `${sku.replace(/_/g, ' ')} - ${color || 'Co-ord Set'}`;
    const description = generateDescription(row);
    const tags = generateTags(row);
    const images = collectImages(row);
    
    // Parse price (remove any non-numeric characters except decimal)
    const priceValue = price.replace(/[^0-9.]/g, '');
    
    // First variant with product details
    const firstSize = sizes[0];
    const firstVariantSKU = `${sku}-${firstSize}`;
    
    shopifyRows.push([
      handle,                           // Handle
      title,                            // Title
      description,                      // Body (HTML)
      'Avetsam',                        // Vendor
      'Apparel & Accessories > Clothing > Outfits', // Product Category
      'Co-ord Set',                     // Type
      tags,                             // Tags
      'TRUE',                           // Published
      'Size',                           // Option1 Name
      firstSize,                        // Option1 Value
      firstVariantSKU,                  // Variant SKU
      '400',                            // Variant Grams
      'shopify',                        // Variant Inventory Tracker
      'deny',                           // Variant Inventory Policy
      'manual',                         // Variant Fulfillment Service
      priceValue,                       // Variant Price
      '',                               // Variant Compare At Price
      'TRUE',                           // Variant Requires Shipping
      'TRUE',                           // Variant Taxable
      '',                               // Variant Barcode
      images[0] || '',                  // Image Src
      images[0] ? '1' : '',             // Image Position
      title,                            // Image Alt Text
      'FALSE',                          // Gift Card
      title,                            // SEO Title
      description.replace(/<[^>]*>/g, '').substring(0, 160), // SEO Description
      'Apparel & Accessories > Clothing > Outfits', // Google Shopping Category
      'Female',                         // Gender
      'Adult',                          // Age Group
      '',                               // MPN
      'new',                            // Condition
      'FALSE',                          // Custom Product
      '',                               // Custom Label 0
      '',                               // Custom Label 1
      '',                               // Custom Label 2
      '',                               // Custom Label 3
      '',                               // Custom Label 4
      '',                               // Variant Image
      'kg',                             // Variant Weight Unit
      '',                               // Variant Tax Code
      '',                               // Cost per item
      'TRUE',                           // Included / India
      'active'                          // Status
    ]);
    variantCount++;
    
    // Additional size variants
    for (let i = 1; i < sizes.length; i++) {
      const size = sizes[i];
      const variantSKU = `${sku}-${size}`;
      
      shopifyRows.push([
        handle,                         // Handle
        '',                             // Title (empty for variants)
        '',                             // Body
        '',                             // Vendor
        '',                             // Product Category
        '',                             // Type
        '',                             // Tags
        '',                             // Published
        'Size',                         // Option1 Name
        size,                           // Option1 Value
        variantSKU,                     // Variant SKU
        '400',                          // Variant Grams
        'shopify',                      // Variant Inventory Tracker
        'deny',                         // Variant Inventory Policy
        'manual',                       // Variant Fulfillment Service
        priceValue,                     // Variant Price
        '',                             // Variant Compare At Price
        'TRUE',                         // Variant Requires Shipping
        'TRUE',                         // Variant Taxable
        '',                             // Variant Barcode
        '',                             // Image Src
        '',                             // Image Position
        '',                             // Image Alt Text
        '',                             // Gift Card
        '',                             // SEO Title
        '',                             // SEO Description
        '',                             // Google Shopping Category
        '',                             // Gender
        '',                             // Age Group
        '',                             // MPN
        '',                             // Condition
        '',                             // Custom Product
        '',                             // Custom Label 0
        '',                             // Custom Label 1
        '',                             // Custom Label 2
        '',                             // Custom Label 3
        '',                             // Custom Label 4
        '',                             // Variant Image
        'kg',                           // Variant Weight Unit
        '',                             // Variant Tax Code
        '',                             // Cost per item
        '',                             // Included / India
        ''                              // Status
      ]);
      variantCount++;
    }
    
    // Additional image rows (if any)
    for (let i = 1; i < images.length; i++) {
      shopifyRows.push([
        handle,                         // Handle
        '',                             // Title (empty for additional images)
        '',                             // Body
        '',                             // Vendor
        '',                             // Product Category
        '',                             // Type
        '',                             // Tags
        '',                             // Published
        '',                             // Option1 Name
        '',                             // Option1 Value
        '',                             // Variant SKU
        '',                             // Variant Grams
        '',                             // Variant Inventory Tracker
        '',                             // Variant Inventory Policy
        '',                             // Variant Fulfillment Service
        '',                             // Variant Price
        '',                             // Variant Compare At Price
        '',                             // Variant Requires Shipping
        '',                             // Variant Taxable
        '',                             // Variant Barcode
        images[i],                      // Image Src
        (i + 1).toString(),             // Image Position
        title,                          // Image Alt Text
        ...Array(19).fill('')           // Rest empty
      ]);
    }
    
    productCount++;
  });
  
  // Convert to CSV string
  const csvOutput = shopifyRows.map(row => 
    row.map(field => {
      const str = String(field || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  ).join('\n');
  
  fs.writeFileSync(outputPath, csvOutput, 'utf-8');
  
  console.log(`\n✅ Conversion complete!`);
  console.log(`📦 Products processed: ${productCount}`);
  console.log(`📊 Total variants created: ${variantCount}`);
  console.log(`📄 Output file: ${outputPath}`);
  console.log(`\nNote: All Google Drive/Dropbox image links were skipped.`);
  console.log(`Upload product images to Shopify manually or use Shopify Files.`);
}

// Run conversion
const inputFile = path.join(__dirname, 'data', 'Co-Ord.csv');
const outputFile = path.join(__dirname, 'data', 'shopify-coord-import.csv');

try {
  convertCoordToShopify(inputFile, outputFile);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
