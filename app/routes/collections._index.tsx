import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections._index';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 250,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {collections};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="av-collections-page">
      {/* Breadcrumb */}
      <nav className="av-breadcrumb container" aria-label="Breadcrumb">
        <a href="/" className="av-breadcrumb__link">Home</a>
        <span className="av-breadcrumb__sep">&gt;</span>
        <span className="av-breadcrumb__current">Collections</span>
      </nav>

      {/* Header section */}
      <div className="av-collections-page__header container">
        <span className="av-collections-page__eyebrow">OUR HERITAGE</span>
        <h1 className="av-collections-page__title">Curated Collections</h1>
        <p className="av-collections-page__subtitle">
          Explore premium handcrafted Indian ethnic wear celebrating traditional artistry, vibrant colors, and timeless silhouettes.
        </p>
      </div>

      {/* Grid section */}
      <div className="container">
        <div className="av-collections-grid">
          {(collections?.nodes || []).map((collection, index) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CollectionItem({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  return (
    <Link
      className="av-collection-card"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      <div className="av-collection-card__image-wrap">
        {collection?.image ? (
          <Image
            alt={collection.image.altText || collection.title}
            aspectRatio="3/4"
            data={collection.image}
            loading={index < 4 ? 'eager' : 'lazy'}
            sizes="(min-width: 45em) 400px, 100vw"
            className="av-collection-card__img"
          />
        ) : (
          <img
            src={`https://picsum.photos/seed/${collection.handle}/600/800`}
            alt={collection.title}
            loading={index < 4 ? 'eager' : 'lazy'}
            className="av-collection-card__img"
          />
        )}
        <div className="av-collection-card__overlay" />
      </div>
      <div className="av-collection-card__info">
        <h3 className="av-collection-card__title">{collection.title}</h3>
        <span className="av-collection-card__cta">
          Explore Collection <span className="av-collection-card__arrow">→</span>
        </span>
      </div>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
