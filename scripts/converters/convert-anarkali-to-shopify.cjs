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
  if (!value || value === 'NA' || value === 'Not Available') return '';
  return value.trim();
}

// Extract tags from product data with prefixes for structured filtering
function generateTags(row) {
  const tags = [];
  
  // Category - prefixed for filtering
  const category = cleanField(row[4]); // "Anarkali Suit"
  if (category) tags.push('category:Anarkali');
  
  // Color - prefixed for filtering
  const color = cleanField(row[10]);
  if (color) tags.push(`color:${color}`);
  
  // Work Type - prefixed for filtering
  const workType = cleanField(row[19]);
  if (workType) tags.push(`work:${workType}`);
  
  // Top Fabric - prefixed for filtering
  const topFabric = cleanField(row[6]);
  if (topFabric) tags.push(`fabric:${topFabric}`);
  
  // Stitching - prefixed for filtering
  const stitching = cleanField(row[22]);
  if (stitching) tags.push(`stitching:${stitching}`);
  
  // Sleeve - prefixed for filtering
  const sleeve = cleanField(row[15]);
  if (sleeve) tags.push(`sleeve:${sleeve}`);
  
  // Neck Type - prefixed for filtering
  const neckType = cleanField(row[17]);
  if (neckType) tags.push(`neck:${neckType}`);
  
  // Set Type - prefixed for filtering
  const content = cleanField(row[23]);
  if (content && content.includes('Duptta')) {
    tags.push('set:3-Piece');
  } else if (content && content.includes('Bottom')) {
    tags.push('set:2-Piece');
  }
  
  return tags.filter(Boolean).join(', ');
}

// Generate HTML description
function generateDescription(row) {
  const topFabric = cleanField(row[6]);
  const bottomFabric = cleanField(row[7]);
  const dupattaFabric = cleanField(row[8]);
  const innerFabric = cleanField(row[9]);
  const color = cleanField(row[10]);
  const topLength = cleanField(row[11]);
  const bottomLength = cleanField(row[12]);
  const dupattaLength = cleanField(row[13]);
  const sleeve = cleanField(row[15]);
  const sleeveLength = cleanField(row[16]);
  const neckType = cleanField(row[17]);
  const workPattern = cleanField(row[18]);
  const workType = cleanField(row[19]);
  const waist = cleanField(row[20]);
  const bust = cleanField(row[21]);
  const stitching = cleanField(row[22]);
  const description = cleanField(row[24]);
  
  let html = '<div class="product-description">\n';
  
  // Product Details Section
  html += '<h3>Product Details</h3>\n<ul>\n';
  if (topFabric) html += `<li><strong>Top Fabric:</strong> ${topFabric}</li>\n`;
  if (innerFabric) html += `<li><strong>Inner Fabric:</strong> ${innerFabric}</li>\n`;
  if (bottomFabric) html += `<li><strong>Bottom Fabric:</strong> ${bottomFabric}</li>\n`;
  if (dupattaFabric) html += `<li><strong>Dupatta Fabric:</strong> ${dupattaFabric}</li>\n`;
  if (color) html += `<li><strong>Color:</strong> ${color}</li>\n`;
  if (workType) html += `<li><strong>Work:</strong> ${workType}</li>\n`;
  if (workPattern) html += `<li><strong>Pattern:</strong> ${workPattern}</li>\n`;
  if (neckType) html += `<li><strong>Neck:</strong> ${neckType}</li>\n`;
  if (sleeve) html += `<li><strong>Sleeve:</strong> ${sleeve}</li>\n`;
  if (sleeveLength) html += `<li><strong>Sleeve Length:</strong> ${sleeveLength}</li>\n`;
  html += '</ul>\n\n';
  
  // Fabric & Sizing Section
  html += '<h3>Fabric & Sizing</h3>\n<ul>\n';
  if (topLength) html += `<li><strong>Top Length:</strong> ${topLength}</li>\n`;
  if (bottomLength) html += `<li><strong>Bottom Length:</strong> ${bottomLength}</li>\n`;
  if (dupattaLength) html += `<li><strong>Dupatta Length:</strong> ${dupattaLength}</li>\n`;
  if (bust) html += `<li><strong>Bust:</strong> ${bust}</li>\n`;
  if (waist) html += `<li><strong>Waist:</strong> ${waist}</li>\n`;
  if (stitching) html += `<li><strong>Stitching:</strong> ${stitching}</li>\n`;
  html += '</ul>\n\n';
  
  // Care & Delivery Section
  html += '<h3>Care & Delivery</h3>\n<ul>\n';
  html += '<li>Dry clean recommended</li>\n';
  html += '<li>Store in a cool, dry place</li>\n';
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
  // Images start at column 27 (Img 1)
  for (let i = 27; i < row.length; i++) {
    const img = cleanField(row[i]);
    if (img && !img.includes('drive.google.com') && !img.includes('dropbox.com')) {
      images.push(img);
    }
  }
  return images;
}

// Main conversion function
function convertAnarkaliToShopify(inputPath, outputPath) {
  console.log('Reading Anarkali CSV...');
  const csvContent = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(csvContent);
  
  // Skip header rows (first 2 rows based on sample)
  const dataRows = rows.slice(2);
  
  console.log(`Found ${dataRows.length} Anarkali products`);
  
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
  
  dataRows.forEach((row, index) => {
    const srNo = cleanField(row[0]);
    if (!srNo) return; // Skip empty rows
    
    const sku = cleanField(row[1]);
    const price = cleanField(row[2]);
    const category = cleanField(row[4]);
    const size = cleanField(row[5]); // "Semi-stitched(FREE SIZE)"
    const color = cleanField(row[10]);
    
    if (!sku || !price) {
      console.log(`Skipping row ${index + 3}: Missing SKU or price`);
      return;
    }
    
    const handle = generateHandle(sku);
    const title = `${sku.replace(/_/g, ' ')} - ${color || 'Anarkali'}`;
    const description = generateDescription(row);
    const tags = generateTags(row);
    const images = collectImages(row);
    
    // Parse price (remove any non-numeric characters except decimal)
    const priceValue = price.replace(/[^0-9.]/g, '');
    
    // Single variant (FREE SIZE)
    const variantSKU = sku;
    
    // First row with product details
    shopifyRows.push([
      handle,                           // Handle
      title,                            // Title
      description,                      // Body (HTML)
      'Avetsam',                        // Vendor
      'Apparel & Accessories > Clothing > Dresses', // Product Category
      'Anarkali',                       // Type
      tags,                             // Tags
      'TRUE',                           // Published
      'Size',                           // Option1 Name
      'Free Size',                      // Option1 Value
      variantSKU,                       // Variant SKU
      '500',                            // Variant Grams
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
      'Apparel & Accessories > Clothing > Dresses', // Google Shopping Category
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
  console.log(`📄 Output file: ${outputPath}`);
  console.log(`\nNote: All Google Drive/Dropbox image links were skipped.`);
  console.log(`Upload product images to Shopify manually or use Shopify Files.`);
}

// Run conversion
const inputFile = path.join(__dirname, 'data', 'Anarakli.csv');
const outputFile = path.join(__dirname, 'data', 'shopify-anarkali-import.csv');

try {
  convertAnarkaliToShopify(inputFile, outputFile);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
