// Converts your Excel data to Shopify CSV format
// Usage: node convert-to-shopify.js input.csv output.csv

const fs = require('fs');
const path = require('path');

// Helper: Convert text to URL-friendly handle
function createHandle(sku) {
  return sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Helper: Build HTML description from your data
function buildDescription(row) {
  return `<h3>Product Details</h3>
<ul>
<li><strong>Lehenga Fabric:</strong> ${row['Lehenga Fabric']}</li>
<li><strong>Choli Fabric:</strong> ${row['Choli Fabric']}</li>
<li><strong>Dupatta Fabric:</strong> ${row['Dupatta Fabric']}</li>
<li><strong>Inner Fabric:</strong> ${row['Inner Fabric']}</li>
<li><strong>Color:</strong> ${row['Color']}</li>
<li><strong>Work:</strong> ${row['Work Type']}</li>
<li><strong>Pattern:</strong> ${row['Work/Pattern']}</li>
</ul>
<h3>Measurements</h3>
<ul>
<li><strong>Lehenga Length:</strong> ${row['Lehenga Length']}</li>
<li><strong>Lehenga Flair:</strong> ${row['Lehenga Flair']}</li>
<li><strong>Lehenga Closer:</strong> ${row['Lehenga Closer']}</li>
<li><strong>Blouse Length:</strong> ${row['Blouse Length']}</li>
<li><strong>Blouse Size:</strong> ${row['Blouse in Mtr']}</li>
<li><strong>Dupatta Width:</strong> ${row['Dupatta Width']}</li>
<li><strong>Dupatta Length:</strong> ${row['Dupatta Length']}</li>
<li><strong>Sleeve:</strong> ${row['Sleeve']}</li>
<li><strong>Sleeve Length:</strong> ${row['Sleeve Length']}</li>
<li><strong>Neck Type:</strong> ${row['Neck Type']}</li>
</ul>
<h3>Features</h3>
<ul>
<li>${row['Lehenga Stitching']}</li>
<li>${row['Stitching']}</li>
</ul>
<h3>Package Contents</h3>
<p>${row['Content']}</p>`;
}

// Helper: Build tags from multiple fields
function buildTags(row) {
  const tags = [
    row['Color'],
    row['Category'],
    row['Work Type'],
    row['Work/Pattern'],
  ].filter(Boolean);
  return tags.join(',');
}

// Helper: Convert Google Drive link to direct download URL
function convertGoogleDriveUrl(url) {
  if (!url || url.trim() === '') return '';
  const match = url.match(/id=([^&]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

// Parse CSV (simple parser - assumes no commas in fields)
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split('\t'); // Tab-separated from Excel
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split('\t');
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });
    rows.push(row);
  }
  
  return rows;
}

// Convert your data to Shopify format
function convertToShopify(inputData) {
  const shopifyRows = [];
  
  inputData.forEach(row => {
    const handle = createHandle(row['SKU']);
    const title = row['Lehenga Title'];
    const description = buildDescription(row);
    const tags = buildTags(row);
    const price = row['B2B Online'];
    const sku = row['SKU'];
    
    // Get all image URLs (Img 1 through Img 9)
    const images = [];
    for (let i = 1; i <= 9; i++) {
      const imgUrl = row[`Img ${i}`];
      if (imgUrl && imgUrl.trim() !== '') {
        images.push(convertGoogleDriveUrl(imgUrl));
      }
    }
    
    // First row with product details + first image
    shopifyRows.push({
      'Handle': handle,
      'Title': title,
      'Body (HTML)': description,
      'Vendor': 'Avestam',
      'Product Category': 'Apparel & Accessories > Clothing > Dresses',
      'Type': row['Category'],
      'Tags': tags,
      'Published': 'TRUE',
      'Option1 Name': 'Size',
      'Option1 Value': row['Size'],
      'Option2 Name': 'Color',
      'Option2 Value': row['Color'],
      'Variant SKU': sku,
      'Variant Price': price,
      'Variant Compare At Price': '',
      'Variant Inventory Tracker': 'shopify',
      'Variant Inventory Policy': 'deny',
      'Variant Fulfillment Service': 'manual',
      'Variant Requires Shipping': 'TRUE',
      'Variant Taxable': 'TRUE',
      'Image Src': images[0] || '',
      'Image Position': images[0] ? '1' : '',
      'Image Alt Text': `${title} - View 1`,
      'Status': 'active'
    });
    
    // Additional rows for remaining images
    for (let i = 1; i < images.length; i++) {
      shopifyRows.push({
        'Handle': handle,
        'Title': '',
        'Body (HTML)': '',
        'Vendor': '',
        'Product Category': '',
        'Type': '',
        'Tags': '',
        'Published': '',
        'Option1 Name': '',
        'Option1 Value': '',
        'Option2 Name': '',
        'Option2 Value': '',
        'Variant SKU': '',
        'Variant Price': '',
        'Variant Compare At Price': '',
        'Variant Inventory Tracker': '',
        'Variant Inventory Policy': '',
        'Variant Fulfillment Service': '',
        'Variant Requires Shipping': '',
        'Variant Taxable': '',
        'Image Src': images[i],
        'Image Position': (i + 1).toString(),
        'Image Alt Text': `${title} - View ${i + 1}`,
        'Status': ''
      });
    }
  });
  
  return shopifyRows;
}

// Write CSV
function writeCSV(data, outputPath) {
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  fs.writeFileSync(outputPath, csv, 'utf8');
}

// Main execution
if (process.argv.length < 4) {
  console.log('Usage: node convert-to-shopify.js input.csv output.csv');
  console.log('Example: node convert-to-shopify.js products.csv shopify-import.csv');
  process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

try {
  console.log(`Reading ${inputFile}...`);
  const content = fs.readFileSync(inputFile, 'utf8');
  
  console.log('Parsing data...');
  const inputData = parseCSV(content);
  console.log(`Found ${inputData.length} products`);
  
  console.log('Converting to Shopify format...');
  const shopifyData = convertToShopify(inputData);
  console.log(`Generated ${shopifyData.length} rows (including images)`);
  
  console.log(`Writing to ${outputFile}...`);
  writeCSV(shopifyData, outputFile);
  
  console.log('✅ Conversion complete!');
  console.log(`\nNext steps:`);
  console.log(`1. Review ${outputFile}`);
  console.log(`2. Upload images to Shopify or CDN and update Image Src URLs`);
  console.log(`3. Import CSV to Shopify: Products → Import`);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
