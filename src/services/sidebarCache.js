// Shared sidebar cache for category tree and posts
// This cache is shared across all pages (BlogPost, Courses, Category)

import { getCategories, buildCategoryTree, getPostsByCategory } from './wordpress';

// Global cache instance
let cache = {
  categoryTree: null,
  categoryPosts: null,
  lastFetch: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to get all category IDs in the tree
function getAllCategoryIds(categories) {
  const ids = [];
  const traverse = (cats) => {
    cats.forEach(cat => {
      ids.push({ id: cat.id, slug: cat.slug });
      if (cat.children) traverse(cat.children);
    });
  };
  traverse(categories);
  return ids;
}

// Get cached data or fetch fresh
export async function getSidebarData() {
  const now = Date.now();

  // Return cached data if still valid
  if (cache.categoryTree && (now - cache.lastFetch) < CACHE_DURATION) {
    return {
      categoryTree: cache.categoryTree,
      categoryPosts: cache.categoryPosts,
      fromCache: true
    };
  }

  // Fetch fresh data
  const allCategories = await getCategories();
  const tree = buildCategoryTree(allCategories);

  // Fetch posts for all categories
  const allCats = getAllCategoryIds(tree);
  const postsPromises = allCats.map(async ({ slug: catSlug }) => {
    const posts = await getPostsByCategory(catSlug, 20);
    return { slug: catSlug, posts };
  });

  const postsResults = await Promise.all(postsPromises);
  const postsMap = {};
  postsResults.forEach(({ slug: catSlug, posts }) => {
    postsMap[catSlug] = posts;
  });

  // Update cache
  cache = {
    categoryTree: tree,
    categoryPosts: postsMap,
    lastFetch: now
  };

  return {
    categoryTree: tree,
    categoryPosts: postsMap,
    fromCache: false
  };
}

// Get current cache state (for initial render)
export function getCachedData() {
  return {
    categoryTree: cache.categoryTree,
    categoryPosts: cache.categoryPosts,
    isValid: cache.categoryTree && (Date.now() - cache.lastFetch) < CACHE_DURATION
  };
}

// Invalidate cache (useful after creating/editing posts)
export function invalidateCache() {
  cache = {
    categoryTree: null,
    categoryPosts: null,
    lastFetch: 0
  };
}
