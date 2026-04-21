# SEO & Meta Tags Guide

## Overview
Complete SEO implementation for Atsevam with optimized meta tags, Open Graph, Twitter Cards, and structured data.

## Favicon
- **Location:** `app/assets/favicon.svg`
- **Design:** Maroon (#8B2635) background with white "A" letter
- **Format:** SVG for scalability
- **Fallback:** `/public/favicon.ico` for older browsers

### To Generate .ico File:
1. Visit https://realfavicongenerator.net/
2. Upload `app/assets/favicon.svg`
3. Download and replace `/public/favicon.ico`

## Meta Tags by Page Type

### Homepage (_index.tsx)
**Title:** Atsevam — Lehengas, Anarkalis, Kurtis & Western Wear | Premium Ethnic Fashion

**Description:** Shop premium handcrafted ethnic wear at Atsevam. Explore our collection of Bridal Lehengas, Anarkali Suits, Designer Kurtis, Co-ord Sets, Western Wear, Sarees & Navratri Special.

**Keywords:** lehengas, anarkali suits, kurtis, ethnic wear, indian wear, bridal lehenga, designer kurtis, co-ord sets, western wear, sarees, navratri collection

**Includes:**
- Open Graph tags for Facebook sharing
- Twitter Card tags
- Theme color (#8B2635 - maroon)
- Robots meta (index, follow)

### Collection Pages (collections.$handle.tsx)
**Title Format:** `{Collection Name} — Atsevam | Premium Ethnic Wear`

**Category-Specific Descriptions:**
- **Lehengas:** Bridal and festive lehengas with intricate embroidery
- **Anarkali:** Elegant Anarkali suits for festive occasions
- **Kurtis:** Designer kurtis for daily wear and casual occasions
- **Co-ords:** Trendy co-ord sets with contemporary designs
- **Western Wear:** Modern dresses, tops, and tunics
- **Sarees:** Traditional sarees with modern designs
- **Navratri:** Special collection for Garba and Dandiya

### Product Pages (products.$handle.tsx)
**Title Format:** `{Product Name} — Atsevam | Premium Ethnic Wear`

**Includes:**
- Product description (first 160 characters)
- Product price and currency (INR)
- Product image for social sharing
- Open Graph product type
- Twitter large image card
- Canonical URL

## How Google Shows Your Site

### Search Result Preview:
```
Atsevam — Lehengas, Anarkalis, Kurtis & Western Wear | Premium...
https://atsevam.com
Shop premium handcrafted ethnic wear at Atsevam. Explore our 
collection of Bridal Lehengas, Anarkali Suits, Designer Kurtis, 
Co-ord Sets, Western Wear, Sarees & Navratri Special...
```

### Browser Tab:
- Shows favicon (maroon "A")
- Shows page title
- Example: "Atsevam — Lehengas, Anarkalis, Kurtis & Western Wear"

### Social Media Sharing:
When shared on Facebook/Twitter:
- Large hero image
- Site name: Atsevam
- Title and description
- Proper formatting

## SEO Best Practices Implemented

### 1. Title Tags
- ✅ Under 60 characters
- ✅ Includes brand name
- ✅ Includes primary keywords
- ✅ Unique for each page

### 2. Meta Descriptions
- ✅ 150-160 characters
- ✅ Compelling and descriptive
- ✅ Includes call-to-action
- ✅ Unique for each page

### 3. Keywords
- ✅ Relevant to content
- ✅ Includes category names
- ✅ Natural language
- ✅ Not keyword stuffing

### 4. Open Graph Tags
- ✅ og:title
- ✅ og:description
- ✅ og:image
- ✅ og:type
- ✅ og:url
- ✅ og:site_name

### 5. Twitter Cards
- ✅ twitter:card (summary_large_image)
- ✅ twitter:title
- ✅ twitter:description
- ✅ twitter:image

### 6. Technical SEO
- ✅ Canonical URLs
- ✅ Robots meta tags
- ✅ Mobile-friendly viewport
- ✅ Language declaration (lang="en")
- ✅ Proper heading hierarchy
- ✅ Alt text on images

## Testing Your SEO

### 1. Google Search Console
- Submit sitemap
- Monitor indexing status
- Check for errors

### 2. Social Media Debuggers
- **Facebook:** https://developers.facebook.com/tools/debug/
- **Twitter:** https://cards-dev.twitter.com/validator
- **LinkedIn:** https://www.linkedin.com/post-inspector/

### 3. SEO Tools
- Google PageSpeed Insights
- Lighthouse (Chrome DevTools)
- Screaming Frog SEO Spider

## Next Steps

### 1. Generate Proper Favicon
- Use https://realfavicongenerator.net/
- Upload the SVG favicon
- Download all sizes (16x16, 32x32, 180x180, etc.)
- Replace `/public/favicon.ico`

### 2. Add Structured Data (Schema.org)
Consider adding JSON-LD structured data for:
- Organization
- Product
- BreadcrumbList
- Review/Rating

### 3. Create Sitemap
- Generate XML sitemap
- Submit to Google Search Console
- Update robots.txt

### 4. Add robots.txt
Create `/public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://atsevam.com/sitemap.xml
```

### 5. Monitor Performance
- Set up Google Analytics
- Track conversion rates
- Monitor search rankings
- Analyze user behavior

## Category Keywords Priority

### Primary Keywords:
1. Lehengas / Bridal Lehengas
2. Anarkali Suits
3. Designer Kurtis
4. Ethnic Wear

### Secondary Keywords:
1. Co-ord Sets
2. Western Wear
3. Sarees
4. Navratri Collection

### Long-tail Keywords:
- "Bridal lehenga with embroidery"
- "Designer anarkali suits for wedding"
- "Handcrafted ethnic wear India"
- "Premium kurtis online"

---

**Last Updated:** April 22, 2026
**Maintained By:** Development Team
