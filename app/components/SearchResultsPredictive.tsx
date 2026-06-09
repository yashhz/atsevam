import {Link, useFetcher, type Fetcher} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import React, {useRef, useEffect} from 'react';
import {
  getEmptyPredictiveSearchResult,
  urlWithTrackingParams,
  type PredictiveSearchReturn,
} from '~/lib/search';
import {useAside} from './Aside';

type PredictiveSearchItems = PredictiveSearchReturn['result']['items'];

type UsePredictiveSearchReturn = {
  term: React.MutableRefObject<string>;
  total: number;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  items: PredictiveSearchItems;
  fetcher: Fetcher<PredictiveSearchReturn>;
};

type SearchResultsPredictiveArgs = Pick<
  UsePredictiveSearchReturn,
  'term' | 'total' | 'inputRef' | 'items'
> & {
  state: Fetcher['state'];
  closeSearch: () => void;
};

type PartialPredictiveSearchResult<
  ItemType extends keyof PredictiveSearchItems,
  ExtraProps extends keyof SearchResultsPredictiveArgs = 'term' | 'closeSearch',
> = Pick<PredictiveSearchItems, ItemType> &
  Pick<SearchResultsPredictiveArgs, ExtraProps>;

type SearchResultsPredictiveProps = {
  children: (args: SearchResultsPredictiveArgs) => React.ReactNode;
};

/**
 * Wrapper that provides predictive search state to children via render prop.
 */
export function SearchResultsPredictive({
  children,
}: SearchResultsPredictiveProps) {
  const aside = useAside();
  const {term, inputRef, fetcher, total, items} = usePredictiveSearch();

  function resetInput() {
    if (inputRef.current) {
      inputRef.current.blur();
      inputRef.current.value = '';
    }
  }

  function closeSearch() {
    resetInput();
    aside.close();
  }

  return children({
    items,
    closeSearch,
    inputRef,
    state: fetcher.state,
    term,
    total,
  });
}

SearchResultsPredictive.Articles = SearchResultsPredictiveArticles;
SearchResultsPredictive.Collections = SearchResultsPredictiveCollections;
SearchResultsPredictive.Pages = SearchResultsPredictivePages;
SearchResultsPredictive.Products = SearchResultsPredictiveProducts;
SearchResultsPredictive.Queries = SearchResultsPredictiveQueries;
SearchResultsPredictive.Empty = SearchResultsPredictiveEmpty;

// ─── Products ────────────────────────────────────────────────────

function SearchResultsPredictiveProducts({
  term,
  products,
  closeSearch,
}: PartialPredictiveSearchResult<'products'>) {
  if (!products.length) return null;

  return (
    <div className="av-search-results__group">
      <p className="av-search-results__group-label">Products</p>
      <ul className="av-search-results__list">
        {products.map((product) => {
          const productUrl = urlWithTrackingParams({
            baseUrl: `/products/${product.handle}`,
            trackingParams: product.trackingParameters,
            term: term.current,
          });
          const price = product?.selectedOrFirstAvailableVariant?.price;
          const image = product?.selectedOrFirstAvailableVariant?.image
            ?? (product as any).featuredImage;

          return (
            <li key={product.id}>
              <Link
                to={productUrl}
                onClick={closeSearch}
                className="av-search-result-item"
                prefetch="intent"
              >
                <div className="av-search-result-item__img-wrap">
                  {image?.url ? (
                    <Image
                      alt={image.altText ?? product.title}
                      src={image.url}
                      width={64}
                      height={80}
                      className="av-search-result-item__img"
                    />
                  ) : (
                    <div className="av-search-result-item__img-placeholder" />
                  )}
                </div>
                <div className="av-search-result-item__info">
                  <p className="av-search-result-item__title">{product.title}</p>
                  {price && (
                    <p className="av-search-result-item__price">
                      <Money data={price} />
                    </p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Collections ──────────────────────────────────────────────────

function SearchResultsPredictiveCollections({
  term,
  collections,
  closeSearch,
}: PartialPredictiveSearchResult<'collections'>) {
  if (!collections.length) return null;

  return (
    <div className="av-search-results__group">
      <p className="av-search-results__group-label">Collections</p>
      <ul className="av-search-results__list av-search-results__list--compact">
        {collections.map((collection) => {
          const collectionUrl = urlWithTrackingParams({
            baseUrl: `/collections/${collection.handle}`,
            trackingParams: collection.trackingParameters,
            term: term.current,
          });
          return (
            <li key={collection.id}>
              <Link
                onClick={closeSearch}
                to={collectionUrl}
                className="av-search-result-compact"
                prefetch="intent"
              >
                <span className="av-search-result-compact__icon">🗂</span>
                <span>{collection.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Pages ───────────────────────────────────────────────────────

function SearchResultsPredictivePages({
  term,
  pages,
  closeSearch,
}: PartialPredictiveSearchResult<'pages'>) {
  if (!pages.length) return null;

  return (
    <div className="av-search-results__group">
      <p className="av-search-results__group-label">Pages</p>
      <ul className="av-search-results__list av-search-results__list--compact">
        {pages.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term: term.current,
          });
          return (
            <li key={page.id}>
              <Link
                onClick={closeSearch}
                to={pageUrl}
                className="av-search-result-compact"
                prefetch="intent"
              >
                <span className="av-search-result-compact__icon">📄</span>
                <span>{page.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Articles ────────────────────────────────────────────────────

function SearchResultsPredictiveArticles({
  term,
  articles,
  closeSearch,
}: PartialPredictiveSearchResult<'articles'>) {
  if (!articles.length) return null;

  return (
    <div className="av-search-results__group">
      <p className="av-search-results__group-label">Articles</p>
      <ul className="av-search-results__list av-search-results__list--compact">
        {articles.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.blog.handle}/${article.handle}`,
            trackingParams: article.trackingParameters,
            term: term.current ?? '',
          });
          return (
            <li key={article.id}>
              <Link
                onClick={closeSearch}
                to={articleUrl}
                className="av-search-result-compact"
                prefetch="intent"
              >
                <span className="av-search-result-compact__icon">✍️</span>
                <span>{article.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Queries datalist ─────────────────────────────────────────────

function SearchResultsPredictiveQueries({
  queries,
  queriesDatalistId,
}: PartialPredictiveSearchResult<'queries', never> & {
  queriesDatalistId: string;
}) {
  if (!queries.length) return null;

  return (
    <datalist id={queriesDatalistId}>
      {queries.map((suggestion) => {
        if (!suggestion) return null;
        return <option key={suggestion.text} value={suggestion.text} />;
      })}
    </datalist>
  );
}

// ─── Empty state ──────────────────────────────────────────────────

function SearchResultsPredictiveEmpty({
  term,
}: {
  term: React.MutableRefObject<string>;
}) {
  if (!term.current) return null;

  return (
    <div className="av-search-aside__empty">
      <p className="av-search-aside__empty-text">
        No results for <strong>&ldquo;{term.current}&rdquo;</strong>
      </p>
      <p className="av-search-aside__empty-sub">
        Try a different spelling or browse our collections.
      </p>
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────

function usePredictiveSearch(): UsePredictiveSearchReturn {
  const fetcher = useFetcher<PredictiveSearchReturn>({key: 'search'});
  const term = useRef<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (fetcher?.state === 'loading') {
    term.current = String(fetcher.formData?.get('q') || '');
  }

  useEffect(() => {
    if (!inputRef.current) {
      inputRef.current = document.querySelector('input[data-search-input]');
    }
  }, []);

  const {items, total} =
    fetcher?.data?.result ?? getEmptyPredictiveSearchResult();

  return {items, total, inputRef, term, fetcher};
}
