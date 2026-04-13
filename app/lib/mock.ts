/**
 * AVESTAM — Mock Data
 * Mirrors the exact shape of Shopify Storefront API responses.
 * Swap these out by replacing loader return values with real API calls.
 */

export type MockProduct = {
  id: string;
  title: string;
  handle: string;
  badge?: 'bestseller' | 'new' | 'top-rated' | 'sale';
  category: string;
  price: string;
  compareAtPrice?: string;
  rating?: number;
  reviewCount?: number;
  featuredImage: {url: string; altText: string};
  hoverImage?: {url: string; altText: string};
};

export type MockCategory = {
  id: string;
  title: string;
  handle: string;
  image: {url: string; altText: string};
};

// ─── Placeholder image helper ─────────────────────────────────────
// Uses picsum.photos with a fixed seed so images are consistent
const img = (seed: number, w = 600, h = 750) =>
  `https://picsum.photos/seed/av${seed}/${w}/${h}`;

// ─── Categories ───────────────────────────────────────────────────

export const MOCK_CATEGORIES: MockCategory[] = [
  {id: '1', title: 'Lehengas',    handle: 'lehengas',     image: {url: img(10, 400, 400), altText: 'Lehengas'}},
  {id: '2', title: 'Anarkalis',   handle: 'anarkalis',    image: {url: img(20, 400, 400), altText: 'Anarkalis'}},
  {id: '3', title: 'Kurtis',      handle: 'kurtis',       image: {url: img(30, 400, 400), altText: 'Kurtis'}},
  {id: '4', title: 'Co-ord Sets', handle: 'co-ords',      image: {url: img(40, 400, 400), altText: 'Co-ord Sets'}},
];

// ─── Bestsellers ──────────────────────────────────────────────────

export const MOCK_BESTSELLERS: MockProduct[] = [
  {id: 'b1', title: 'Zardozi Bridal Lehenga',        handle: 'zardozi-bridal-lehenga',    badge: 'bestseller', category: 'Lehenga',  price: '₹24,500', rating: 4.9, reviewCount: 118, featuredImage: {url: img(101), altText: 'Zardozi Bridal Lehenga'},    hoverImage: {url: img(102), altText: 'Zardozi Bridal Lehenga back'}},
  {id: 'b2', title: 'Threadwork Anarkali Suit',       handle: 'threadwork-anarkali',       badge: 'bestseller', category: 'Anarkali', price: '₹8,200',  rating: 4.8, reviewCount: 74,  featuredImage: {url: img(103), altText: 'Threadwork Anarkali'},          hoverImage: {url: img(104), altText: 'Threadwork Anarkali back'}},
  {id: 'b3', title: 'Lavender Net Lehenga',           handle: 'lavender-net-lehenga',      badge: 'top-rated',  category: 'Lehenga',  price: '₹18,900', rating: 5.0, reviewCount: 32,  featuredImage: {url: img(105), altText: 'Lavender Net Lehenga'},          hoverImage: {url: img(106), altText: 'Lavender Net Lehenga back'}},
  {id: 'b4', title: 'Silk Blend Co-ord Set',          handle: 'silk-blend-co-ord',         badge: 'new',        category: 'Co-ord',   price: '₹4,800',  rating: 4.7, reviewCount: 21,  featuredImage: {url: img(107), altText: 'Silk Blend Co-ord'},             hoverImage: {url: img(108), altText: 'Silk Blend Co-ord back'}},
  {id: 'b5', title: 'Embroidered Georgette Kurti',    handle: 'embroidered-georgette-kurti',badge: 'bestseller', category: 'Kurti',    price: '₹2,400',  rating: 4.6, reviewCount: 203, featuredImage: {url: img(109), altText: 'Embroidered Georgette Kurti'},   hoverImage: {url: img(110), altText: 'Embroidered Georgette Kurti back'}},
  {id: 'b6', title: 'Heavy Zari Festive Lehenga',     handle: 'heavy-zari-festive-lehenga',badge: 'bestseller', category: 'Lehenga',  price: '₹32,000', rating: 4.9, reviewCount: 56,  featuredImage: {url: img(111), altText: 'Heavy Zari Festive Lehenga'},    hoverImage: {url: img(112), altText: 'Heavy Zari Festive Lehenga back'}},
];

// ─── New Arrivals ─────────────────────────────────────────────────

export const MOCK_NEW_ARRIVALS: MockProduct[] = [
  {id: 'n1', title: 'Pastel Floral Anarkali',         handle: 'pastel-floral-anarkali',    badge: 'new', category: 'Anarkali', price: '₹7,600',  featuredImage: {url: img(201), altText: 'Pastel Floral Anarkali'},   hoverImage: {url: img(202), altText: 'Pastel Floral Anarkali back'}},
  {id: 'n2', title: 'Teal Chanderi Kurti',            handle: 'teal-chanderi-kurti',       badge: 'new', category: 'Kurti',    price: '₹1,950',  featuredImage: {url: img(203), altText: 'Teal Chanderi Kurti'},      hoverImage: {url: img(204), altText: 'Teal Chanderi Kurti back'}},
  {id: 'n3', title: 'Ivory Sequin Lehenga',           handle: 'ivory-sequin-lehenga',      badge: 'new', category: 'Lehenga',  price: '₹21,000', featuredImage: {url: img(205), altText: 'Ivory Sequin Lehenga'},     hoverImage: {url: img(206), altText: 'Ivory Sequin Lehenga back'}},
  {id: 'n4', title: 'Rust Linen Co-ord',              handle: 'rust-linen-co-ord',         badge: 'new', category: 'Co-ord',   price: '₹3,200',  featuredImage: {url: img(207), altText: 'Rust Linen Co-ord'},        hoverImage: {url: img(208), altText: 'Rust Linen Co-ord back'}},
  {id: 'n5', title: 'Midnight Blue Anarkali',         handle: 'midnight-blue-anarkali',    badge: 'new', category: 'Anarkali', price: '₹9,400',  featuredImage: {url: img(209), altText: 'Midnight Blue Anarkali'},   hoverImage: {url: img(210), altText: 'Midnight Blue Anarkali back'}},
  {id: 'n6', title: 'Rose Gold Tissue Lehenga',       handle: 'rose-gold-tissue-lehenga',  badge: 'new', category: 'Lehenga',  price: '₹28,500', featuredImage: {url: img(211), altText: 'Rose Gold Tissue Lehenga'}, hoverImage: {url: img(212), altText: 'Rose Gold Tissue Lehenga back'}},
];

// ─── Testimonials ─────────────────────────────────────────────────

export const MOCK_TESTIMONIALS = [
  {id: 't1', name: 'Priya S.',    location: 'Mumbai',    rating: 5, text: 'The lehenga was absolutely stunning. The embroidery is so intricate and the fabric quality is exceptional. Got so many compliments at the wedding!', product: 'Zardozi Bridal Lehenga',     image: img(301, 80, 80)},
  {id: 't2', name: 'Ananya R.',   location: 'Delhi',     rating: 5, text: 'Ordered the Anarkali for Diwali and it arrived beautifully packaged. The fit was perfect and the colors are exactly as shown. Will definitely order again.', product: 'Threadwork Anarkali Suit', image: img(302, 80, 80)},
  {id: 't3', name: 'Meera K.',    location: 'Bangalore', rating: 5, text: 'Such a beautiful piece. The craftsmanship is evident in every detail. Avestam truly understands ethnic wear.', product: 'Lavender Net Lehenga',       image: img(303, 80, 80)},
  {id: 't4', name: 'Divya M.',    location: 'Chennai',   rating: 5, text: 'The kurti is so comfortable and elegant. Perfect for both office and casual outings. The fabric is breathable and the stitching is flawless.', product: 'Embroidered Georgette Kurti', image: img(304, 80, 80)},
];

// ─── Press logos ──────────────────────────────────────────────────

export const MOCK_PRESS = [
  {id: 'p1', name: 'Vogue India'},
  {id: 'p2', name: 'Harper\'s Bazaar'},
  {id: 'p3', name: 'Femina'},
  {id: 'p4', name: 'Elle India'},
  {id: 'p5', name: 'Grazia'},
];

// ─── Collection page products (larger set) ────────────────────────

export const MOCK_COLLECTION_PRODUCTS: MockProduct[] = [
  ...MOCK_BESTSELLERS,
  ...MOCK_NEW_ARRIVALS,
  {id: 'c1', title: 'Crimson Silk Lehenga',          handle: 'crimson-silk-lehenga',       badge: 'bestseller', category: 'Lehenga',  price: '₹19,500', compareAtPrice: '₹22,000', rating: 4.8, reviewCount: 44,  featuredImage: {url: img(301), altText: 'Crimson Silk Lehenga'},       hoverImage: {url: img(302), altText: 'Crimson Silk Lehenga back'}},
  {id: 'c2', title: 'Sage Green Anarkali',            handle: 'sage-green-anarkali',        badge: 'new',        category: 'Anarkali', price: '₹6,800',                             rating: 4.5, reviewCount: 12,  featuredImage: {url: img(303), altText: 'Sage Green Anarkali'},        hoverImage: {url: img(304), altText: 'Sage Green Anarkali back'}},
  {id: 'c3', title: 'Mustard Block Print Kurti',      handle: 'mustard-block-print-kurti',  badge: 'bestseller', category: 'Kurti',    price: '₹1,800',                             rating: 4.7, reviewCount: 89,  featuredImage: {url: img(305), altText: 'Mustard Block Print Kurti'},  hoverImage: {url: img(306), altText: 'Mustard Block Print Kurti back'}},
  {id: 'c4', title: 'Blush Pink Tissue Lehenga',      handle: 'blush-pink-tissue-lehenga',  badge: 'top-rated',  category: 'Lehenga',  price: '₹26,000', compareAtPrice: '₹30,000', rating: 5.0, reviewCount: 67,  featuredImage: {url: img(307), altText: 'Blush Pink Tissue Lehenga'},  hoverImage: {url: img(308), altText: 'Blush Pink Tissue Lehenga back'}},
  {id: 'c5', title: 'Navy Chanderi Co-ord',           handle: 'navy-chanderi-co-ord',                            category: 'Co-ord',   price: '₹3,600',                             rating: 4.4, reviewCount: 8,   featuredImage: {url: img(309), altText: 'Navy Chanderi Co-ord'},       hoverImage: {url: img(310), altText: 'Navy Chanderi Co-ord back'}},
  {id: 'c6', title: 'Emerald Zari Anarkali',          handle: 'emerald-zari-anarkali',      badge: 'bestseller', category: 'Anarkali', price: '₹11,200',                            rating: 4.9, reviewCount: 38,  featuredImage: {url: img(311), altText: 'Emerald Zari Anarkali'},      hoverImage: {url: img(312), altText: 'Emerald Zari Anarkali back'}},
];

// ─── Filter options ───────────────────────────────────────────────

export type FilterGroup = {
  id: string;
  label: string;
  options: {value: string; label: string; count: number}[];
};

export const MOCK_FILTERS: FilterGroup[] = [
  {
    id: 'category',
    label: 'Category',
    options: [
      {value: 'lehenga',  label: 'Lehenga',  count: 48},
      {value: 'anarkali', label: 'Anarkali', count: 32},
      {value: 'kurti',    label: 'Kurti',    count: 61},
      {value: 'co-ord',   label: 'Co-ord',   count: 24},
    ],
  },
  {
    id: 'fabric',
    label: 'Fabric',
    options: [
      {value: 'net',        label: 'Net',        count: 29},
      {value: 'silk',       label: 'Silk',       count: 41},
      {value: 'georgette',  label: 'Georgette',  count: 35},
      {value: 'chanderi',   label: 'Chanderi',   count: 18},
      {value: 'cotton',     label: 'Cotton',     count: 27},
    ],
  },
  {
    id: 'work',
    label: 'Work',
    options: [
      {value: 'zari',        label: 'Zari',        count: 33},
      {value: 'threadwork',  label: 'Threadwork',  count: 44},
      {value: 'sequin',      label: 'Sequin',      count: 21},
      {value: 'plain',       label: 'Plain',       count: 15},
      {value: 'block-print', label: 'Block Print', count: 19},
    ],
  },
  {
    id: 'stitching',
    label: 'Stitching',
    options: [
      {value: 'semi-stitched',  label: 'Semi-Stitched',  count: 52},
      {value: 'ready-to-wear',  label: 'Ready to Wear',  count: 48},
      {value: 'full-stitched',  label: 'Full Stitched',  count: 22},
    ],
  },
  {
    id: 'color',
    label: 'Color',
    options: [
      {value: 'red',    label: 'Red',    count: 18},
      {value: 'green',  label: 'Green',  count: 22},
      {value: 'blue',   label: 'Blue',   count: 15},
      {value: 'pink',   label: 'Pink',   count: 31},
      {value: 'ivory',  label: 'Ivory',  count: 14},
      {value: 'black',  label: 'Black',  count: 20},
    ],
  },
  {
    id: 'price',
    label: 'Price Range',
    options: [
      {value: '0-2000',    label: 'Under ₹2,000',       count: 24},
      {value: '2000-5000', label: '₹2,000 – ₹5,000',    count: 38},
      {value: '5000-15000',label: '₹5,000 – ₹15,000',   count: 45},
      {value: '15000+',    label: 'Above ₹15,000',       count: 28},
    ],
  },
];


// ─── Full product detail (PDP mock) ──────────────────────────────

export type MockProductDetail = MockProduct & {
  description: string;
  images: {url: string; altText: string}[];
  // Accordion data — maps to Shopify metafields
  details: {
    workPattern: string;
    stitchingType: string;
    neckline: string;
    sleeves: string;
    closure: string;
    setContents: string;
  };
  fabric: {
    top: string;
    bottom: string;
    dupatta: string;
    innerLining: string;
    flairWidth: string;
    topLength: string;
    bottomLength: string;
    dupattaDimensions: string;
  };
  care: {
    washing: string;
    drying: string;
    ironing: string;
    delivery: string;
  };
  sizes: string[];
  relatedProducts: MockProduct[];
};

const pdpImg = (seed: number) => `https://picsum.photos/seed/pdp${seed}/800/1000`;

export const MOCK_PRODUCT_DETAIL: MockProductDetail = {
  id: 'pd1',
  title: 'Heavy Thread Embroidered Semi-Stitched Lavender Net Lehenga',
  handle: 'lavender-net-lehenga',
  badge: 'top-rated',
  category: 'Lehenga',
  price: '₹18,900',
  compareAtPrice: '₹22,000',
  rating: 5.0,
  reviewCount: 32,
  description:
    'A breathtaking three-piece lehenga crafted from premium net fabric, adorned with intricate heavy thread embroidery across the skirt and choli. The soft lavender hue makes it perfect for sangeet ceremonies, receptions, and festive occasions. Each piece is handcrafted by skilled artisans, ensuring no two sets are exactly alike.',
  featuredImage: {url: pdpImg(1), altText: 'Lavender Net Lehenga front'},
  hoverImage:    {url: pdpImg(2), altText: 'Lavender Net Lehenga back'},
  images: [
    {url: pdpImg(1),  altText: 'Front view'},
    {url: pdpImg(2),  altText: 'Back view'},
    {url: pdpImg(3),  altText: 'Embroidery close-up'},
    {url: pdpImg(4),  altText: 'Dupatta detail'},
    {url: pdpImg(5),  altText: 'Choli detail'},
    {url: pdpImg(6),  altText: 'Full length'},
    {url: pdpImg(7),  altText: 'Model wearing'},
    {url: pdpImg(8),  altText: 'Fabric texture'},
  ],
  details: {
    workPattern:    'Heavy Thread Chain Stitch Embroidery',
    stitchingType:  'Semi-Stitched (Choli stitched up to 42" bust)',
    neckline:       'Round Neck with Embroidered Border',
    sleeves:        'Three-Quarter Sleeves',
    closure:        'Back Zip on Choli, Elastic Waistband on Lehenga',
    setContents:    'Lehenga × 1, Choli × 1, Dupatta × 1',
  },
  fabric: {
    top:               'Premium Net with Satin Lining',
    bottom:            'Heavy Net with Satin Inner Lining',
    dupatta:           'Soft Net with Embroidered Border',
    innerLining:       'Ultra Satin (Skin-friendly)',
    flairWidth:        '3.5 Meters',
    topLength:         '16 Inches (Crop Choli)',
    bottomLength:      '42 Inches',
    dupattaDimensions: '2.25 Meters × 1.1 Meters',
  },
  care: {
    washing:  'Dry clean only. Do not machine wash.',
    drying:   'Dry in shade. Avoid direct sunlight.',
    ironing:  'Iron on reverse side at low heat. Use a pressing cloth.',
    delivery: '5–7 business days within India. Express delivery available.',
  },
  sizes: ['Free Size (Up to 42" Bust)', 'Custom Stitching Available'],
  relatedProducts: MOCK_BESTSELLERS.slice(0, 4),
};
