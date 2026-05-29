import { createContentSecurityPolicy } from '@shopify/hydrogen';

const resDefault = createContentSecurityPolicy({
  shop: {
    checkoutDomain: 'checkout.example.com',
    storeDomain: 'example.com',
  }
});
console.log('DEFAULT HEADER:');
console.log(resDefault.header);

const resCustom = createContentSecurityPolicy({
  shop: {
    checkoutDomain: 'checkout.example.com',
    storeDomain: 'example.com',
  },
  scriptSrc: ["'self'", 'https://cdn.judge.me'],
  connectSrc: ["'self'", 'https://judge.me', 'https://cdn.judge.me'],
  imgSrc: ["'self'", 'https://cdn.judge.me', 'https://judge.me'],
});
console.log('\nCUSTOM DIRECTIVES HEADER:');
console.log(resCustom.header);
