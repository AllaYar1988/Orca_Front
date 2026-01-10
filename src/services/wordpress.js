// WordPress API Service
const WP_API_URL = 'https://myco-grid.com/wp/wp-json/wp/v2';

// Fetch all posts
export async function getPosts(perPage = 10) {
  try {
    const response = await fetch(`${WP_API_URL}/posts?per_page=${perPage}&_embed`);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return await response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// Fetch single post by slug (or ID for redirect purposes)
export async function getPostBySlug(slugOrId) {
  try {
    // Check if it's a numeric ID - fetch by ID then return post (for redirect)
    if (/^\d+$/.test(slugOrId)) {
      const response = await fetch(`${WP_API_URL}/posts/${slugOrId}?_embed`);
      if (!response.ok) return null;
      const post = await response.json();
      // Mark that this was fetched by ID so BlogPost can redirect
      post._fetchedById = true;
      return post;
    }

    // Fetch by slug
    const response = await fetch(`${WP_API_URL}/posts?slug=${slugOrId}&_embed`);
    if (!response.ok) throw new Error('Failed to fetch post');
    const posts = await response.json();
    return posts.length > 0 ? posts[0] : null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Fetch posts by category slug
export async function getPostsByCategory(categorySlug, perPage = 10) {
  try {
    // First get the category ID
    const catResponse = await fetch(`${WP_API_URL}/categories?slug=${categorySlug}`);
    const categories = await catResponse.json();

    if (categories.length === 0) return [];

    const categoryId = categories[0].id;
    const response = await fetch(`${WP_API_URL}/posts?categories=${categoryId}&per_page=${perPage}&_embed`);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return await response.json();
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    return [];
  }
}

// Fetch all categories with hierarchy support
export async function getCategories() {
  try {
    // Fetch all categories (increase per_page to get all)
    const response = await fetch(`${WP_API_URL}/categories?per_page=100&_fields=id,name,slug,description,parent,count`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const categories = await response.json();
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Build category tree with parent-child relationships (supports unlimited depth)
export function buildCategoryTree(categories) {
  // Filter out only "Uncategorized"
  const filtered = categories.filter(cat => cat.slug !== 'uncategorized');

  // Create a map for quick lookup - include ALL categories first
  const categoryMap = {};
  filtered.forEach(cat => {
    categoryMap[cat.id] = { ...cat, children: [] };
  });

  // Build the tree structure
  const rootCategories = [];
  filtered.forEach(cat => {
    if (cat.parent === 0) {
      // This is a root/parent category
      rootCategories.push(categoryMap[cat.id]);
    } else if (categoryMap[cat.parent]) {
      // This is a child category - add to parent's children
      categoryMap[cat.parent].children.push(categoryMap[cat.id]);
    } else {
      // Parent doesn't exist in our list, treat as root
      rootCategories.push(categoryMap[cat.id]);
    }
  });

  // Helper function to check if a category or its descendants have posts
  function hasPostsInTree(category) {
    if (category.count > 0) return true;
    return category.children.some(child => hasPostsInTree(child));
  }

  // Helper function to filter tree - keep categories that have posts or have children with posts
  function filterTree(cats) {
    return cats
      .filter(cat => hasPostsInTree(cat))
      .map(cat => ({
        ...cat,
        children: filterTree(cat.children)
      }));
  }

  return filterTree(rootCategories);
}

// Get category by slug with its children
export async function getCategoryBySlug(slug) {
  try {
    const response = await fetch(`${WP_API_URL}/categories?slug=${slug}&_fields=id,name,slug,description,parent,count`);
    if (!response.ok) throw new Error('Failed to fetch category');
    const categories = await response.json();
    return categories.length > 0 ? categories[0] : null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

// Get children of a category by parent ID
export async function getChildCategories(parentId) {
  try {
    const response = await fetch(`${WP_API_URL}/categories?parent=${parentId}&_fields=id,name,slug,description,parent,count`);
    if (!response.ok) throw new Error('Failed to fetch child categories');
    const categories = await response.json();
    // Filter out empty categories
    return categories.filter(cat => cat.count > 0);
  } catch (error) {
    console.error('Error fetching child categories:', error);
    return [];
  }
}

// Get parent category chain (breadcrumb)
export async function getCategoryAncestors(category, allCategories) {
  const ancestors = [];
  let current = category;

  while (current && current.parent !== 0) {
    const parent = allCategories.find(cat => cat.id === current.parent);
    if (parent) {
      ancestors.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }

  return ancestors;
}

// Helper to extract featured image from embedded data
export function getFeaturedImage(post) {
  if (post._embedded && post._embedded['wp:featuredmedia']) {
    return post._embedded['wp:featuredmedia'][0]?.source_url || null;
  }
  return null;
}

// Helper to extract category names from embedded data
export function getCategoryNames(post) {
  if (post._embedded && post._embedded['wp:term']) {
    const categories = post._embedded['wp:term'][0] || [];
    return categories.map(cat => cat.name);
  }
  return [];
}

// Helper to format date
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Sanitize post content that may contain full HTML documents
// This handles posts where someone pasted a complete HTML page into WordPress
export function sanitizePostContent(html) {
  if (!html) return '';

  // Check if content contains a full HTML document
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    return html; // Normal content, return as-is
  }

  // Create a temporary DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Try to extract just the body content
  const body = doc.body;
  if (body) {
    // Remove any script tags for safety
    const scripts = body.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Get the inner HTML of body
    return body.innerHTML;
  }

  // Fallback: strip HTML/HEAD/BODY tags manually
  let cleaned = html
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head>[\s\S]*?<\/head>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '');

  return cleaned.trim();
}
