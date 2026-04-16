# Avestam Tag System Documentation

## Overview

Avestam uses a **prefixed tag system** for structured product filtering. Tags follow the format `prefix:value` which allows automatic filter generation and accurate filtering without code changes.

## Tag Structure

### Format
```
prefix:value
```

### Example
```
category:Anarkali, color:Brown, work:Embroidery Work, fabric:Net, stitching:Semi-Stitched
```

## Tag Prefixes

| Prefix | Description | Examples |
|--------|-------------|----------|
| `category` | Product category | `category:Anarkali`, `category:Kurti`, `category:Co-ord Set` |
| `color` | Product color | `color:Brown`, `color:Red`, `color:Lavender` |
| `work` | Work/embellishment type | `work:Embroidery Work`, `work:Printed`, `work:Sequin Work` |
| `fabric` | Fabric material | `fabric:Net`, `fabric:Silk`, `fabric:Georgette` |
| `stitching` | Stitching type | `stitching:Semi-Stitched`, `stitching:Ready to Wear` |
| `sleeve` | Sleeve style | `sleeve:Full Sleeve`, `sleeve:3/4 Sleeve` |
| `neck` | Neckline type | `neck:Round Neck`, `neck:V-Neck` |
| `set` | Set composition | `set:3-Piece`, `set:2-Piece`, `set:With Dupatta` |

## How It Works

### 1. Automatic Filter Generation
The system automatically:
- Parses all product tags in a collection
- Groups tags by prefix
- Generates filter options dynamically
- Shows only filters relevant to the current collection

### 2. Collection-Scoped Filtering
- Filters only show options available in the current collection
- If you're viewing "Anarkali" collection, you only see colors/fabrics used in Anarkalis
- No hardcoded filter lists needed

### 3. Accurate Filtering
- When you select "Brown" color, it checks for `color:Brown` tag
- No ambiguity - "Brown" in product name won't match
- Multiple filters work together (AND logic)

## For Developers

### Adding New Products

When creating new products, use prefixed tags in your CSV converters:

```javascript
function generateTags(row) {
  const tags = [];
  
  // Always use prefixes
  tags.push('category:Anarkali');
  tags.push(`color:${row.color}`);
  tags.push(`work:${row.workType}`);
  tags.push(`fabric:${row.fabric}`);
  
  return tags.join(', ');
}
```

### Adding New Filter Types

To add a new filter type (e.g., "occasion"):

1. **Update converters** to add the new prefix:
   ```javascript
   tags.push(`occasion:${row.occasion}`); // e.g., "occasion:Wedding"
   ```

2. **Update filter config** in `collections.$handle.tsx`:
   ```typescript
   const filterConfig: Record<string, string> = {
     'color': 'Color',
     'fabric': 'Fabric',
     'occasion': 'Occasion', // Add this line
     // ... other filters
   };
   ```

3. **That's it!** The system will automatically:
   - Parse the new tags
   - Generate filter options
   - Handle filtering logic

### No Code Changes Needed For:
- ✅ Adding new colors
- ✅ Adding new fabrics
- ✅ Adding new work types
- ✅ Adding new categories
- ✅ Any new values within existing prefixes

## For Store Managers

### Updating Existing Products

Use the bulk tag update script:

```bash
# 1. Export products from Shopify
# 2. Save as: avetsam/data/shopify-products-export.csv
# 3. Run the script
node scripts/add-tag-prefixes.js

# 4. Import the generated file back to Shopify
```

### Manual Tag Editing

When editing tags in Shopify Admin:

**✅ Correct:**
```
category:Anarkali, color:Brown, work:Embroidery Work
```

**❌ Incorrect:**
```
Anarkali, Brown, Embroidery Work
```

### Bulk Editing Tags

In Shopify Admin:
1. Select products
2. Click "Bulk edit"
3. Choose "Add tags" or "Replace tags"
4. Use prefixed format: `color:Red, fabric:Silk`

## Benefits

### Scalability
- Add new products without code changes
- New colors/fabrics appear automatically in filters
- No maintenance of hardcoded lists

### Accuracy
- No false matches (e.g., "Brown" in product name)
- Clear separation of tag types
- Reliable filtering logic

### Performance
- Tags loaded with products (no extra queries)
- Client-side filtering is fast
- Collection-scoped reduces filter options

### Maintainability
- Single source of truth (product tags)
- Easy to understand and debug
- Self-documenting (prefix shows purpose)

## Migration Guide

### From Old Tags to Prefixed Tags

**Old tags:**
```
Anarkali, Brown, Embroidery Work, Net, Semi-Stitched
```

**New tags:**
```
category:Anarkali, color:Brown, work:Embroidery Work, fabric:Net, stitching:Semi-Stitched
```

### Migration Steps

1. **Export products** from Shopify
2. **Run conversion script**: `node scripts/add-tag-prefixes.js`
3. **Review output** in `data/shopify-products-with-prefixes.csv`
4. **Import back** to Shopify (select "Overwrite existing products")
5. **Verify** filters work on your store

### Backward Compatibility

The system handles both old and new tags:
- Prefixed tags: Used for filtering
- Non-prefixed tags: Kept as-is (for other purposes)

## Troubleshooting

### Filters Not Showing
- Check if products have prefixed tags
- Verify tag format: `prefix:value` (colon, no spaces around it)
- Check browser console for errors

### Filter Not Working
- Ensure tag prefix matches filter config
- Check tag capitalization matches
- Verify products actually have the tag

### New Color Not Appearing
- Check if tag is prefixed: `color:NewColor`
- Refresh the collection page
- Check if any products in collection have that color

## Examples

### Complete Product Tags

**Anarkali Product:**
```
category:Anarkali, color:Lavender, work:Thread Work, fabric:Net, 
stitching:Semi-Stitched, sleeve:Full Sleeve, neck:Round Neck, set:3-Piece
```

**Kurti Product:**
```
category:Kurti, color:Mustard, work:Block Print, fabric:Cotton,
stitching:Ready to Wear, sleeve:3/4 Sleeve, neck:V-Neck, set:With Dupatta
```

**Co-ord Product:**
```
category:Co-ord Set, color:Navy, work:Printed, fabric:Linen,
stitching:Ready to Wear, sleeve:Sleeveless, neck:Round Neck, set:2-Piece
```
