import { createContentSecurityPolicy } from '@shopify/hydrogen';

const resCustom = createContentSecurityPolicy({
  shop: {
    checkoutDomain: 'checkout.example.com',
    storeDomain: 'example.com',
  },
  scriptSrc: [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://*.judge.me',
    'https://judge.me',
  ],
  connectSrc: [
    "'self'",
    'https://judge.me',
    'https://*.judge.me',
  ],
  imgSrc: [
    "'self'",
    'https://cdn.shopify.com',
    'https://shopify.com',
    'https://*.judge.me',
    'https://judge.me',
    'data:',
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'",
    'https://cdn.shopify.com',
    'https://*.judge.me',
    'https://judge.me',
  ],
});
console.log('\nWILDCARD CSP HEADER:');
console.log(resCustom.header);
