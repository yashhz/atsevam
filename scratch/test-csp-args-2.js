import { createContentSecurityPolicy } from '@shopify/hydrogen';

const resCustom = createContentSecurityPolicy({
  shop: {
    checkoutDomain: 'checkout.example.com',
    storeDomain: 'example.com',
  },
  scriptSrc: [
    "'self'",
    'https://cdn.judge.me',
    'https://judge.me',
  ],
  connectSrc: [
    "'self'",
    'https://judge.me',
    'https://cdn.judge.me',
  ],
  imgSrc: [
    "'self'",
    'https://cdn.shopify.com',
    'https://shopify.com',
    'https://cdn.judge.me',
    'https://judge.me',
    'data:',
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'",
    'https://cdn.shopify.com',
    'https://cdn.judge.me',
    'https://judge.me',
  ],
});
console.log('\nCUSTOM DIRECTIVES HEADER:');
console.log(resCustom.header);
