export const CATALOG_PAGE_SIZE = 20

export function listingPagePath(basePath, page) {
  return page === 1 ? basePath : `${basePath}/page/${page}`
}
