import {Link} from 'react-router';
import {Image, Money, Pagination} from '@shopify/hydrogen';
import {urlWithTrackingParams, type RegularSearchReturn} from '~/lib/search';

type SearchItems = RegularSearchReturn['result']['items'];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & {term: string}) => React.ReactNode;
};

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }
  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

// ─── Products (primary result — full product card grid) ───────────

function SearchResultsProducts({
  term,
  products,
}: PartialSearchResult<'products'>) {
  if (!products?.nodes.length) return null;

  return (
    <div className="av-search-results-section">
      <Pagination connection={products}>
        {({nodes, isLoading, NextLink, PreviousLink, hasPreviousPage, hasNextPage}) => (
          <>
            {hasPreviousPage && (
              <div className="av-search-pagination av-search-pagination--top">
                <PreviousLink className="btn btn-ghost">
                  {isLoading ? (
                    <span className="av-search-pagination__loading">Loading…</span>
                  ) : (
                    '↑ Load previous'
                  )}
                </PreviousLink>
              </div>
            )}

            <div className="av-search-product-grid">
              {nodes.map((product) => {
                const productUrl = urlWithTrackingParams({
                  baseUrl: `/products/${product.handle}`,
                  trackingParams: product.trackingParameters,
                  term,
                });
                const price = product?.selectedOrFirstAvailableVariant?.price;
                const compareAtPrice = product?.selectedOrFirstAvailableVariant?.compareAtPrice;
                const image = product?.selectedOrFirstAvailableVariant?.image
                  ?? (product as any).featuredImage;

                const rawPrice = parseFloat(price?.amount ?? '0');
                const rawCompare = compareAtPrice?.amount
                  ? parseFloat(compareAtPrice.amount)
                  : undefined;
                const discount = rawCompare && rawCompare > rawPrice
                  ? Math.round(((rawCompare - rawPrice) / rawCompare) * 100)
                  : undefined;

                return (
                  <Link
                    key={product.id}
                    prefetch="intent"
                    to={productUrl}
                    className="av-search-product-card"
                  >
                    {/* Image */}
                    <div className="av-search-product-card__img-wrap">
                      {image?.url ? (
                        <Image
                          data={image}
                          alt={product.title}
                          sizes="(min-width: 768px) 25vw, 50vw"
                          className="av-search-product-card__img"
                        />
                      ) : (
                        <div className="av-search-product-card__img-placeholder" />
                      )}
                      {discount && (
                        <span className="av-search-product-card__badge">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="av-search-product-card__info">
                      <p className="av-search-product-card__title">{product.title}</p>
                      <div className="av-search-product-card__price-row">
                        {price && (
                          <span className="av-search-product-card__price">
                            <Money data={price} />
                          </span>
                        )}
                        {compareAtPrice?.amount && (
                          <span className="av-search-product-card__compare">
                            <Money data={compareAtPrice} />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {hasNextPage && (
              <div className="av-search-pagination">
                <NextLink className="btn btn-ghost btn-lg">
                  {isLoading ? (
                    <span className="av-search-pagination__loading">Loading…</span>
                  ) : (
                    'Load more results ↓'
                  )}
                </NextLink>
              </div>
            )}
          </>
        )}
      </Pagination>
    </div>
  );
}

// ─── Pages ───────────────────────────────────────────────────────

function SearchResultsPages({term, pages}: PartialSearchResult<'pages'>) {
  if (!pages?.nodes.length) return null;

  return (
    <div className="av-search-misc-section">
      <h3 className="av-search-misc-section__title">Pages</h3>
      <div className="av-search-misc-list">
        {pages.nodes.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term,
          });
          return (
            <Link
              key={page.id}
              prefetch="intent"
              to={pageUrl}
              className="av-search-misc-item"
            >
              <span className="av-search-misc-item__icon">📄</span>
              <span>{page.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Articles ────────────────────────────────────────────────────

function SearchResultsArticles({term, articles}: PartialSearchResult<'articles'>) {
  if (!articles?.nodes.length) return null;

  return (
    <div className="av-search-misc-section">
      <h3 className="av-search-misc-section__title">Articles</h3>
      <div className="av-search-misc-list">
        {articles.nodes.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.handle}`,
            trackingParams: article.trackingParameters,
            term,
          });
          return (
            <Link
              key={article.id}
              prefetch="intent"
              to={articleUrl}
              className="av-search-misc-item"
            >
              <span className="av-search-misc-item__icon">✍️</span>
              <span>{article.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Empty ───────────────────────────────────────────────────────

function SearchResultsEmpty() {
  return (
    <div className="av-search-page__empty">
      <p>No results found. Try a different search term.</p>
    </div>
  );
}
