// CSV Splitter - Splits product data into two files:
// 1. Product details (Shopify format, no images)
// 2. Product images (SKU + image URLs)
// Usage: node csv-splitter.js input.csv

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CSV with proper quote handling
function parseCSV(content) {
  const lines = content.split('\n');
  if (lines.length === 0) return [];
  
  // Parse a single CSV line respecting quotes
  function parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
  
  const headers = parseLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = parseLine(lines[i]);
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    // Skip empty rows (no SKU means empty row)
    if (!row['SKU'] || row['SKU'] === '') {
      break; // Stop at first empty row
    }
    
    rows.push(row);
  }
  
  return rows;
}

// Write CSV with proper escaping
function writeCSV(data, outputPath) {
  if (data.length === 0) {
    console.log('⚠️  No data to write');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = (row[header] || '').toString();
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  fs.writeFileSync(outputPath, csv, 'utf8');
}

// Build HTML description for Shopify
function buildShopifyDescription(row) {
  return `<h3>Product Details</h3>
<ul>
<li><strong>Lehenga Fabric:</strong> ${row['Lehenga Fabric'] || 'N/A'}</li>
<li><strong>Choli Fabric:</strong> ${row['Choli Fabric'] || 'N/A'}</li>
<li><strong>Dupatta Fabric:</strong> ${row['Dupatta Fabric'] || 'N/A'}</li>
<li><strong>Inner Fabric:</strong> ${row['Inner Fabric'] || 'N/A'}</li>
<li><strong>Color:</strong> ${row['Color'] || 'N/A'}</li>
<li><strong>Work:</strong> ${row['Work Type'] || 'N/A'}</li>
<li><strong>Pattern:</strong> ${row['Work/Pattern'] || 'N/A'}</li>
</ul>
<h3>Measurements</h3>
<ul>
<li><strong>Lehenga Length:</strong> ${row['Lehenga Length'] || 'N/A'}</li>
<li><strong>Lehenga Flair:</strong> ${row['Lehenga Flair'] || 'N/A'}</li>
<li><strong>Lehenga Closer:</strong> ${row['Lehenga Closer'] || 'N/A'}</li>
<li><strong>Blouse Length:</strong> ${row['Blouse Length'] || 'N/A'}</li>
<li><strong>Blouse Size:</strong> ${row['Blouse in Mtr'] || 'N/A'}</li>
<li><strong>Dupatta Width:</strong> ${row['Dupatta Width'] || 'N/A'}</li>
<li><strong>Dupatta Length:</strong> ${row['Dupatta Length'] || 'N/A'}</li>
<li><strong>Sleeve:</strong> ${row['Sleeve'] || 'N/A'}</li>
<li><strong>Sleeve Length:</strong> ${row['Sleeve Length'] || 'N/A'}</li>
<li><strong>Neck Type:</strong> ${row['Neck Type'] || 'N/A'}</li>
</ul>
<h3>Features</h3>
<ul>
<li>${row['Lehenga Stitching'] || ''}</li>
<li>${row['Stitching'] || ''}</li>
</ul>
<h3>Package Contents</h3>
<p>${row['Content'] || 'N/A'}</p>`;
}

// Create product details CSV (Shopify format)
function createProductDetailsCSV(inputData) {
  return inputData.map(row => {
    const tags = [
      row['Color'],
      row['Category'],
      row['Work Type'],
      row['Work/Pattern']
    ].filter(Boolean).join(',');
    
    return {
      'Handle': row['SKU'].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      'Title': row['Lehenga Title'],
      'Body (HTML)': buildShopifyDescription(row),
      'Vendor': 'Avestam',
      'Product Category': 'Apparel & Accessories > Clothing > Dresses',
      'Type': row['Category'],
      'Tags': tags,
      'Published': 'TRUE',
      'Option1 Name': 'Size',
      'Option1 Value': row['Size'],
      'Option2 Name': 'Color',
      'Option2 Value': row['Color'],
      'Variant SKU': row['SKU'],
      'Variant Price': row['B2B Online'],
      'Variant Compare At Price': '',
      'Variant Inventory Tracker': 'shopify',
      'Variant Inventory Policy': 'deny',
      'Variant Fulfillment Service': 'manual',
      'Variant Requires Shipping': 'TRUE',
      'Variant Taxable': 'TRUE',
      'Status': 'active'
    };
  });
}

// Create product images CSV (SKU + all image URLs)
function createProductImagesCSV(inputData) {
  return inputData.map(row => {
    const sku = row['SKU'];
    const images = [];
    
    // Get all values from the row after HSN column
    const allValues = Object.entries(row);
    let foundHSN = false;
    
    for (const [key, value] of allValues) {
      // Start collecting after HSN column
      if (key === 'HSN') {
        foundHSN = true;
        continue;
      }
      
      // If we're past HSN and value exists and looks like a URL
      if (foundHSN && value && value.trim() !== '') {
        const url = value.trim();
        if (url.startsWith('http') || url.toLowerCase().includes('drive')) {
          images.push(url);
        }
      }
    }
    
    // Join all images with comma and space
    const imageUrls = images.join(', ');
    
    return {
      'SKU': sku,
      'Image URLs': imageUrls,
      'Image Count': images.length
    };
  });
}

// Main execution
if (process.argv.length < 3) {
  console.log('Usage: node csv-splitter.js input.csv');
  console.log('Example: node csv-splitter.js products.csv');
  console.log('\nOutputs:');
  console.log('  - public/product-files/product-details.csv');
  console.log('  - public/product-files/product-images.csv');
  process.exit(1);
}

const inputFile = process.argv[2];

try {
  console.log(`📖 Reading ${inputFile}...`);
  const content = fs.readFileSync(inputFile, 'utf8');
  
  console.log('🔍 Parsing data...');
  const inputData = parseCSV(content);
  console.log(`✅ Found ${inputData.length} products`);
  
  // Create output directory
  const outputDir = path.join('public', 'product-files');
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate product details CSV
  console.log('\n📝 Creating product details CSV...');
  const productDetails = createProductDetailsCSV(inputData);
  const detailsPath = path.join(outputDir, 'product-details.csv');
  writeCSV(productDetails, detailsPath);
  console.log(`✅ Saved: ${detailsPath}`);
  
  // Generate product images CSV
  console.log('\n🖼️  Creating product images CSV...');
  const productImages = createProductImagesCSV(inputData);
  const imagesPath = path.join(outputDir, 'product-images.csv');
  writeCSV(productImages, imagesPath);
  console.log(`✅ Saved: ${imagesPath}`);
  
  console.log('\n🎉 Done! Files created:');
  console.log(`   1. ${detailsPath}`);
  console.log(`   2. ${imagesPath}`);
  console.log('\n📋 Next steps:');
  console.log('   1. Review the generated CSV files');
  console.log('   2. Import product-details.csv to Shopify (Products → Import)');
  console.log('   3. Use product-images.csv to bulk upload images');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
