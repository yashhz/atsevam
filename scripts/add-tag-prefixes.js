/**
 * Helper script to add prefixes to existing Shopify product tags
 * 
 * USAGE:
 * 1. Export products from Shopify Admin (Products > Export)
 * 2. Save the CSV file to avetsam/data/shopify-products-export.csv
 * 3. Run: node scripts/add-tag-prefixes.js
 * 4. Import the generated file back to Shopify (Products > Import)
 * 
 * This will update existing products with prefixed tags without duplicating them.
 */

const fs = require('fs');
const path = require('path');

// Tag prefix mapping - defines which tags get which prefixes
const TAG_RULES = {
  // Category tags
  category: ['Anarkali', 'Kurti', 'Co-ord Set', 'Lehenga', 'Choli', 'Saree', 'Gown'],
  
  // Color tags - common colors in your products
  color: [
    'Red', 'Green', 'Blue', 'Pink', 'Purple', 'Black', 'White', 'Yellow', 
    'Orange', 'Lavender', 'Dusty', 'Sky', 'Maroon', 'Navy', 'Grey', 'Gray',
    'Brown', 'Beige', 'Gold', 'Silver', 'Cream', 'Peach', 'Mint', 'Teal', 
    'Coral', 'Mustard', 'Olive', 'Burgundy', 'Ivory', 'Champagne'
  ],
  
  // Work type tags
  work: [
    'Embroidery Work', 'Thread Work', 'Sequin Work', 'Zari Work', 
    'Hand Work', 'Beads Work', 'Printed', 'Plain', 'Block Print'
  ],
  
  // Fabric tags
  fabric: [
    'Net', 'Silk', 'Georgette', 'Chanderi', 'Cotton', 'Chiffon',
    'Velvet', 'Satin', 'Crepe', 'Rayon', 'Linen', 'Tissue'
  ],
  
  // Stitching tags
  stitching: [
    'Semi-Stitched', 'Ready to Wear', 'Unstitched', 'Full Stitched',
    'Stitched', 'Semi Stitched'
  ],
  
  // Sleeve tags
  sleeve: [
    'Full Sleeve', '3/4 Sleeve', 'Half Sleeve', 'Sleeveless',
    'Three-Quarter Sleeves', 'Regular Sleeve', 'Short Sleeve'
  ],
  
  // Neck type tags
  neck: [
    'Round Neck', 'V-Neck', 'Boat Neck', 'Square Neck', 'Collar Neck',
    'High Neck', 'Sweetheart Neck', 'V Neck'
  ],
  
  // Set type tags
  set: [
    '2-Piece Set', '3-Piece Set', '2-Piece', '3-Piece',
    'With Dupatta', 'With Bottom', 'Single Piece'
  ]
};

/**
 * Parse CSV (handles quoted fields with commas)
 */
function parseCSV(text) {
  const lines = text.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const row = [];
    let currentField = '';
    let inQuotes = false;
    
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
        row.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    row.push(currentField);
    result.push(row);
  }
  
  return result;
}

/**
 * Convert CSV array back to text
 */
function arrayToCSV(data) {
  return data.map(row => {
    return row.map(field => {
      // Quote fields that contain commas, quotes, or newlines
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    }).join(',');
  }).join('\n');
}

/**
 * Add prefixes to tags based on rules
 */
function addPrefixesToTags(tagsString) {
  if (!tagsString || tagsString.trim() === '') return '';
  
  const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);
  const prefixedTags = [];
  
  tags.forEach(tag => {
    // Skip if already prefixed
    if (tag.includes(':')) {
      prefixedTags.push(tag);
      return;
    }
    
    // Find matching prefix
    let matched = false;
    for (const [prefix, keywords] of Object.entries(TAG_RULES)) {
      for (const keyword of keywords) {
        if (tag.toLowerCase() === keyword.toLowerCase()) {
          prefixedTags.push(`${prefix}:${tag}`);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    
    // If no match found, keep original tag
    if (!matched) {
      prefixedTags.push(tag);
    }
  });
  
  return prefixedTags.join(', ');
}

/**
 * Main function
 */
function main() {
  const inputFile = path.join(__dirname, '../data/shopify-products-export.csv');
  const outputFile = path.join(__dirname, '../data/shopify-products-with-prefixes.csv');
  
  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error('❌ Error: Input file not found!');
    console.log('\nPlease:');
    console.log('1. Go to Shopify Admin > Products');
    console.log('2. Click "Export" and download all products as CSV');
    console.log('3. Save the file as: avetsam/data/shopify-products-export.csv');
    console.log('4. Run this script again');
    process.exit(1);
  }
  
  console.log('📖 Reading Shopify export...');
  const csvText = fs.readFileSync(inputFile, 'utf-8');
  const rows = parseCSV(csvText);
  
  if (rows.length === 0) {
    console.error('❌ Error: CSV file is empty');
    process.exit(1);
  }
  
  // Find Tags column
  const headers = rows[0];
  const tagsIndex = headers.findIndex(h => h.toLowerCase() === 'tags');
  
  if (tagsIndex === -1) {
    console.error('❌ Error: Could not find "Tags" column in CSV');
    process.exit(1);
  }
  
  console.log(`✅ Found Tags column at index ${tagsIndex}`);
  console.log(`📝 Processing ${rows.length - 1} rows...`);
  
  let updatedCount = 0;
  
  // Process each row (skip header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length <= tagsIndex) continue;
    
    const originalTags = row[tagsIndex];
    const newTags = addPrefixesToTags(originalTags);
    
    if (originalTags !== newTags) {
      row[tagsIndex] = newTags;
      updatedCount++;
    }
  }
  
  console.log(`✅ Updated ${updatedCount} products with prefixed tags`);
  
  // Write output
  const outputCSV = arrayToCSV(rows);
  fs.writeFileSync(outputFile, outputCSV, 'utf-8');
  
  console.log(`\n✅ Success! Output saved to:`);
  console.log(`   ${outputFile}`);
  console.log('\nNext steps:');
  console.log('1. Go to Shopify Admin > Products');
  console.log('2. Click "Import"');
  console.log('3. Upload: data/shopify-products-with-prefixes.csv');
  console.log('4. Select "Overwrite existing products" option');
  console.log('5. Click "Import products"');
  console.log('\n✨ Your products will be updated with structured tags!');
}

// Run
try {
  main();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
