# Shopify Setup Guide for Avestam

This guide tells you exactly what you need to do in Shopify to make your site work properly. No technical jargon, just simple steps.

---

## 🎯 Quick Overview

Your site needs 3 things from Shopify:
1. **Collections** (categories like "Lehengas", "Anarkalis")
2. **Products** (your actual items for sale)
3. **Images** (hero banners, category images, etc.)

---

## 📦 Part 1: Create Collections

Collections are like folders that organize your products. Your site expects these exact collections:

### Required Collections (Create these in Shopify):

1. **Lehengas** (handle: `lehenga`)
2. **Anarkalis** (handle: `anarkalis`)
3. **Kurtis** (handle: `kurtis`)
4. **Co-ords** (handle: `co-ords`)

### Optional Collections (Nice to have):

5. **Bestsellers** (handle: `bestsellers`)
6. **New Arrivals** (handle: `new-arrivals`)
7. **Bridal & Festive** (handle: `bridal-festive`)

### How to Create Collections in Shopify:

1. Go to **Products → Collections** in Shopify admin
2. Click **Create collection**
3. Enter the name (e.g., "Lehengas")
4. **Important**: Set the handle to match exactly (e.g., `lehenga`)
5. Add a description (optional but good for SEO)
6. Set collection type to "Automated" and add conditions:
   - Product tag contains "Lehenga" (or whatever category)
7. Save

**Why this matters**: Your navigation menu and homepage link to these exact collection handles. If they don't match, links will break.

---

## 🏷️ Part 2: Product Tags (Super Important!)

Your products need specific tags for filtering to work. When adding products, include these tags:

### Category Tags (Pick ONE per product):
- `Lehenga Choli`
- `Anarkali`
- `Kurti`
- `Co-ord`

### Color Tags (Pick colors that apply):
- `Red`, `Green`, `Blue`, `Pink`, `Purple`, `Black`, `White`, `Yellow`, `Orange`, `Lavender`, `Dusty Rose`, `Sky Blue`, `Maroon`, `Navy`, `Grey`, `Brown`, `Beige`, `Gold`, `Silver`, `Cream`, `Peach`, `Mint`, `Teal`, `Coral`

### Work Type Tags (Pick what applies):
- `Embroidery Work`
- `Zari Work`
- `Threadwork`
- `Sequin Work`
- `Block Print`
- `Plain`

### Badge Tags (Optional, for special products):
- `new` - Shows "New" badge
- `sale` - Shows "Sale" badge
- `bestseller` - Shows "Bestseller" badge

**Example Product Tags**:
```
Lehenga Choli, Red, Embroidery Work, bestseller
```

**Why this matters**: The filter sidebar on collection pages automatically builds filters from these tags. No tags = no filters!

---

## 🖼️ Part 3: Images You Need to Upload

Your site uses images in several places. Here's what you need:

### A. Product Images (Handled by Shopify Products)
- Upload 2+ images per product in Shopify
- First image = main product image
- Second image = hover image (shows when user hovers/taps)
- More images = product detail page gallery
- **Recommended size**: 800×1000px minimum

### B. Category Images (4 images needed)

These appear on the homepage in circular tiles. You need to upload these somewhere:

**Option 1: Shopify Files (Recommended)**
1. Go to **Settings → Files** in Shopify admin
2. Upload these 4 images:
   - `category-lehengas.jpg` (400×400px)
   - `category-anarkalis.jpg` (400×400px)
   - `category-kurtis.jpg` (400×400px)
   - `category-co-ords.jpg` (400×400px)
3. Copy the URLs Shopify gives you
4. Update `app/lib/mock.ts` file, replace the `img()` calls with your real URLs

**Option 2: Public Folder**
1. Put images in `avetsam/public/images/categories/`
2. Update `app/lib/mock.ts` to use `/images/categories/lehengas.jpg` etc.

### C. Hero Banner Image (1 image needed)

The big banner on homepage. Current code uses a placeholder.

**Where to upload**: 
- **Shopify Files** (Settings → Files) - upload `hero-banner.jpg` (1600×900px)
- OR put in `public/images/hero-banner.jpg`

**Where to update**: 
- File: `app/routes/_index.tsx`
- Line 109: Replace `https://picsum.photos/seed/avhero/1600/900` with your image URL

### D. Editorial/Banner Images (2 images needed)

The "Festive Edit" section images on homepage.

**Upload**:
- `editorial-1.jpg` (900×600px)
- `editorial-2.jpg` (900×600px)

**Where to update**:
- File: `app/routes/_index.tsx`
- Lines 145 & 157: Replace the `imageSeed` prop with actual image URLs

### E. Our Story Page Images (Optional, 3-4 images)

If you want to customize the "Our Story" page:
- Hero image (1600×900px)
- 2-3 section images (800×1000px)

**Where to update**: `app/routes/pages.our-story.tsx`

---

## 📊 Part 4: Product Information (Metafields)

For detailed product pages, you can add extra info using Shopify Metafields:

### Recommended Metafields to Create:

Go to **Settings → Custom Data → Products** and add these:

1. **Work Pattern** (Single line text)
   - Namespace: `custom`
   - Key: `work_pattern`
   - Example: "Heavy Thread Chain Stitch Embroidery"

2. **Stitching Type** (Single line text)
   - Namespace: `custom`
   - Key: `stitching_type`
   - Example: "Semi-Stitched"

3. **Fabric Details** (Multi-line text)
   - Namespace: `custom`
   - Key: `fabric_details`
   - Example: "Top: Net, Bottom: Silk, Dupatta: Chiffon"

4. **Care Instructions** (Multi-line text)
   - Namespace: `custom`
   - Key: `care_instructions`
   - Example: "Dry clean only. Iron on reverse."

**Why this matters**: These show up in the accordion sections on product detail pages. Without them, those sections will be empty.

---

## 🎨 Part 5: Testimonials & Press (Optional)

Currently using mock data. Two options:

### Option 1: Keep Mock Data (Easiest)
- Just update the text in `app/lib/mock.ts`
- Change names, locations, and testimonial text
- No Shopify setup needed

### Option 2: Use Shopify Metaobjects (Advanced)
1. Create a Metaobject type called "Testimonial"
2. Add fields: name, location, rating, text, product
3. Create entries in Shopify
4. Update homepage loader to fetch them

**Recommendation**: Keep mock data for now. It's simpler and works fine.

---

## ✅ Checklist: What to Do Right Now

### Immediate (Before Launch):

- [ ] Create 4 main collections (Lehengas, Anarkalis, Kurtis, Co-ords)
- [ ] Add products with proper tags (category, color, work type)
- [ ] Upload 2+ images per product
- [ ] Upload hero banner image
- [ ] Upload 4 category circle images
- [ ] Update `app/lib/mock.ts` with real image URLs

### Soon After:

- [ ] Create Bestsellers & New Arrivals collections
- [ ] Add metafields for product details
- [ ] Upload editorial banner images
- [ ] Customize testimonials text

### Optional (Can Do Later):

- [ ] Customize Our Story page images
- [ ] Add more product tags for better filtering
- [ ] Set up automated collections with rules

---

## 🚀 Image Management Strategy (Scalable Solution)

### Best Practice: Use Shopify Files for Everything

**Why?**
- ✅ No code changes needed to update images
- ✅ Shopify CDN = fast loading worldwide
- ✅ Easy to manage from admin panel
- ✅ No git commits for image changes

**How to Organize**:

1. **Create folders in Shopify Files**:
   - `homepage/` - hero, editorial banners
   - `categories/` - category circle images
   - `story/` - our story page images

2. **Naming convention**:
   - `hero-main.jpg`
   - `category-lehengas.jpg`
   - `editorial-festive-1.jpg`
   - `story-hero.jpg`

3. **Update code once** with Shopify URLs
4. **Future updates**: Just replace files in Shopify, keep same names

### Alternative: Public Folder (Quick & Dirty)

Put images in `avetsam/public/images/` and reference as `/images/filename.jpg`

**Pros**: No Shopify setup needed
**Cons**: Need to redeploy site to change images

---

## 🔧 Where to Update Image URLs in Code

Once you have real images, update these files:

1. **Homepage categories**: `app/lib/mock.ts` → `MOCK_CATEGORIES` array
2. **Hero banner**: `app/routes/_index.tsx` → line 109
3. **Editorial banners**: `app/routes/_index.tsx` → lines 145, 157
4. **Our Story**: `app/routes/pages.our-story.tsx` → search for `picsum.photos`

**Find & Replace Tip**: Search for `picsum.photos` in your code editor to find all placeholder images.

---

## 💡 Pro Tips

1. **Product Images**: Always upload at least 2 images per product (main + hover)
2. **Image Size**: Keep images under 500KB for fast loading
3. **Alt Text**: Add descriptive alt text in Shopify for SEO
4. **Collection Handles**: Never change collection handles after launch (breaks links)
5. **Tags**: Be consistent with tag spelling and capitalization
6. **Test Filters**: After adding products, visit collection pages to verify filters work

---

## 🆘 Common Issues & Fixes

**Problem**: Collection page shows "No products found"
- **Fix**: Check collection handle matches exactly, add products to collection

**Problem**: Filters are empty on collection page
- **Fix**: Add tags to your products (color, work type, etc.)

**Problem**: Product images don't show hover effect
- **Fix**: Upload at least 2 images per product in Shopify

**Problem**: Hero banner not showing
- **Fix**: Check image URL is correct and image is publicly accessible

**Problem**: Navigation links broken
- **Fix**: Verify collection handles match exactly (case-sensitive)

---

## 📞 Need Help?

If you get stuck:
1. Check Shopify's collection/product is published (not draft)
2. Verify handles match exactly (no typos)
3. Clear browser cache and test again
4. Check browser console for errors (F12 → Console tab)

---

**That's it!** Follow this guide step by step and your site will work perfectly with real Shopify data.
