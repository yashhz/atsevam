import {useEffect} from 'react';

interface UseJudgemeProps {
  shopDomain: string;
  publicToken: string;
  cdnHost: string;
  delay?: number;
  nonce: string;
}

export function useJudgemeCustom({
  shopDomain,
  publicToken,
  cdnHost,
  delay = 500,
  nonce,
}: UseJudgemeProps) {
  useEffect(() => {
    if (!shopDomain || !publicToken || !cdnHost) {
      console.log(
        'CONFIG ERROR: Missing config values for store domain, store public token, cdn host',
      );
      return;
    }

    const shopCredentials = `
      if (typeof jdgm === 'undefined') {
        let jdgm = {};
        jdgm.SHOP_DOMAIN = '${shopDomain}';
        jdgm.PLATFORM = 'shopify';
        jdgm.PUBLIC_TOKEN = '${publicToken}';
        window.jdgm = jdgm;
      };
    `;

    fetch(cdnHost + '/widget_preloader.js')
      .then((res) => res.text())
      .then((text) => {
        const preloaderFunction = `function jdgm_preloader(){${text}}`;
        const shopCredentialsScript = document.createElement('script');
        const preloaderScript = document.createElement('script');
        const installedScript = document.createElement('script');

        // Apply CSP Nonce so the browser allows execution of dynamically created inline scripts
        if (nonce) {
          shopCredentialsScript.setAttribute('nonce', nonce);
          preloaderScript.setAttribute('nonce', nonce);
          installedScript.setAttribute('nonce', nonce);
        }

        shopCredentialsScript.innerText = shopCredentials;
        preloaderScript.innerText = preloaderFunction;
        installedScript.src = cdnHost + '/assets/installed.js';

        document.head.append(
          shopCredentialsScript,
          preloaderScript,
          installedScript,
        );
        console.log('Judge.me script loaded with nonce');

        // Immediately trigger preloader after appending script
        window.setTimeout(() => {
          if (typeof window.jdgm_preloader === 'function') {
            window.jdgm_preloader();
          }
        }, 100);
      });
  }, [shopDomain, publicToken, cdnHost, nonce]);

  useEffect(() => {
    if (window.jdgm_rerender) {
      window.clearTimeout(window.jdgm_rerender);
    }
    window.jdgm_rerender = window.setTimeout(() => {
      window.clearTimeout(window.jdgm_rerender);
      if (window.jdgm_preloader && !window.jdgmCacheServer) {
        window.jdgm_preloader();
      } else if (window.jdgmCacheServer) {
        window.jdgmCacheServer.reloadAll();
      } else {
        console.log('missing Judge.me script');
      }
    }, delay);
  });
}
