import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiClock, FiCpu, FiWifi, FiZap, FiFolder, FiChevronRight, FiChevronDown, FiHome, FiFileText } from 'react-icons/fi';
import {
  getPostBySlug,
  getCategoryNames,
  formatDate,
  sanitizePostContent
} from '../services/wordpress';
import { getSidebarData, getCachedData } from '../services/sidebarCache';
import './posts/Post.css';

// Icon mapping for known category slugs
const categoryIcons = {
  'embedded-systems': FiCpu,
  'iot': FiWifi,
  'energy-monitoring': FiZap,
};

// Color mapping for known category slugs
const categoryColors = {
  'embedded-systems': 'green',
  'iot': 'blue',
  'energy-monitoring': 'orange',
};

const colorCycle = ['green', 'blue', 'orange', 'purple', 'teal'];

// Memoized post link component
const PostLink = memo(function PostLink({ post, color, isActive }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`nav-post-link ${color} ${isActive ? 'active' : ''}`}
    >
      <FiFileText className="nav-post-icon" />
      <span dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
    </Link>
  );
});

// Memoized recursive component to render category tree with posts
const CategoryTreeItem = memo(function CategoryTreeItem({
  category,
  depth,
  color,
  currentCategoryIds,
  currentPostSlug,
  categoryPosts,
  onToggleCategory,
  expandedCategories
}) {
  const isActive = currentCategoryIds.includes(category.id);
  const hasChildren = category.children && category.children.length > 0;
  const posts = categoryPosts[category.slug] || [];
  const hasPosts = posts.length > 0;
  const hasContent = hasChildren || hasPosts;
  const isExpanded = expandedCategories[category.id];

  const handleToggle = useCallback(() => {
    onToggleCategory(category.id);
  }, [onToggleCategory, category.id]);

  // For root level (depth 0), use full card style
  if (depth === 0) {
    const IconComponent = categoryIcons[category.slug] || FiFolder;
    return (
      <div className="nav-category">
        <div className="nav-category-header">
          {hasContent && (
            <button
              className={`nav-toggle ${color}`}
              onClick={handleToggle}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
            </button>
          )}
          <Link
            to={`/category/${category.slug}`}
            className={`nav-category-link ${color} ${isActive ? 'active' : ''}`}
          >
            <IconComponent className="nav-icon" />
            <span>{category.name}</span>
          </Link>
        </div>

        {hasContent && isExpanded && (
          <div className="nav-children">
            {category.children.map((child) => (
              <CategoryTreeItem
                key={child.id}
                category={child}
                depth={depth + 1}
                color={color}
                currentCategoryIds={currentCategoryIds}
                currentPostSlug={currentPostSlug}
                categoryPosts={categoryPosts}
                onToggleCategory={onToggleCategory}
                expandedCategories={expandedCategories}
              />
            ))}
            {posts.map((post) => (
              <PostLink
                key={post.id}
                post={post}
                color={color}
                isActive={post.slug === currentPostSlug}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // For nested levels, use tree item style
  return (
    <div className="nav-tree-item">
      <div className="nav-child-header">
        {hasContent && (
          <button
            className={`nav-toggle-small ${color}`}
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
          </button>
        )}
        {!hasContent && <span className="nav-toggle-spacer" />}
        <Link
          to={`/category/${category.slug}`}
          className={`nav-child-link ${color} ${isActive ? 'active' : ''}`}
        >
          <span>{category.name}</span>
        </Link>
      </div>

      {hasContent && isExpanded && (
        <div className="nav-children nested">
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              depth={depth + 1}
              color={color}
              currentCategoryIds={currentCategoryIds}
              currentPostSlug={currentPostSlug}
              categoryPosts={categoryPosts}
              onToggleCategory={onToggleCategory}
              expandedCategories={expandedCategories}
            />
          ))}
          {posts.map((post) => (
            <PostLink
              key={post.id}
              post={post}
              color={color}
              isActive={post.slug === currentPostSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Memoized sidebar component
const Sidebar = memo(function Sidebar({
  categoryTree,
  categoryPosts,
  currentCategoryIds,
  currentPostSlug,
  expandedCategories,
  onToggleCategory
}) {
  return (
    <aside className="post-sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">
          <FiHome /> Topics
        </h3>
        <nav className="category-nav">
          {categoryTree.map((category, index) => {
            const color = categoryColors[category.slug] || colorCycle[index % colorCycle.length];
            return (
              <CategoryTreeItem
                key={category.id}
                category={category}
                depth={0}
                color={color}
                currentCategoryIds={currentCategoryIds}
                currentPostSlug={currentPostSlug}
                categoryPosts={categoryPosts}
                onToggleCategory={onToggleCategory}
                expandedCategories={expandedCategories}
              />
            );
          })}
        </nav>
      </div>
    </aside>
  );
});

// Helper to find category path to current post
function findCategoryPath(categories, targetCategoryIds, path = []) {
  for (const cat of categories) {
    const newPath = [...path, cat.id];
    if (targetCategoryIds.includes(cat.id)) {
      return newPath;
    }
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryPath(cat.children, targetCategoryIds, newPath);
      if (found) return found;
    }
  }
  return null;
}

function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from shared cache
  const cachedData = getCachedData();
  const [categoryTree, setCategoryTree] = useState(cachedData.categoryTree || []);
  const [categoryPosts, setCategoryPosts] = useState(cachedData.categoryPosts || {});
  const [currentPostCategories, setCurrentPostCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [sidebarLoaded, setSidebarLoaded] = useState(cachedData.isValid);

  // Memoized current category IDs array
  const currentCategoryIds = useMemo(() =>
    currentPostCategories.map(cat => cat.id),
    [currentPostCategories]
  );

  // Memoized toggle handler
  const handleToggleCategory = useCallback((categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  // Fetch sidebar data (using shared cache)
  useEffect(() => {
    async function fetchSidebarData() {
      const { categoryTree: tree, categoryPosts: posts } = await getSidebarData();
      setCategoryTree(tree);
      setCategoryPosts(posts);
      setSidebarLoaded(true);
    }

    fetchSidebarData();
  }, []); // Only run once on mount

  // Fetch post data (on slug change)
  useEffect(() => {
    async function fetchPost() {
      setLoading(true);

      const postData = await getPostBySlug(slug);

      if (postData) {
        setPost(postData);
        // Get current post's category info from embedded data
        if (postData._embedded && postData._embedded['wp:term']) {
          const postCats = postData._embedded['wp:term'][0] || [];
          setCurrentPostCategories(postCats);

          // Auto-expand only the path to current post's category
          // Reset expanded state to only include the current path
          if (categoryTree.length > 0) {
            const postCategoryIds = postCats.map(c => c.id);
            const path = findCategoryPath(categoryTree, postCategoryIds);
            if (path) {
              const expanded = {};
              path.forEach(id => { expanded[id] = true; });
              setExpandedCategories(expanded);
            }
          }
        }
        setError(null);
      } else {
        setError('Post not found');
      }

      setLoading(false);
    }

    fetchPost();
  }, [slug, categoryTree]);

  // Get category info for display
  const categoryInfo = useMemo(() => {
    if (!post) return null;
    const categories = getCategoryNames(post);
    const catName = categories[0]?.toLowerCase() || '';
    if (catName.includes('embedded')) {
      return { color: 'green', icon: <FiCpu />, name: 'Embedded Systems' };
    }
    if (catName.includes('iot')) {
      return { color: 'blue', icon: <FiWifi />, name: 'IoT' };
    }
    if (catName.includes('energy')) {
      return { color: 'orange', icon: <FiZap />, name: 'Energy Monitoring' };
    }
    return { color: 'green', icon: <FiCpu />, name: categories[0] || 'Article' };
  }, [post]);

  if (loading) {
    return (
      <article className="post">
        <div className="container">
          <div className="post-layout">
            {/* Show sidebar while loading if available */}
            {sidebarLoaded && (
              <Sidebar
                categoryTree={categoryTree}
                categoryPosts={categoryPosts}
                currentCategoryIds={currentCategoryIds}
                currentPostSlug={slug}
                expandedCategories={expandedCategories}
                onToggleCategory={handleToggleCategory}
              />
            )}
            <div className="post-main">
              <div className="loading" style={{ padding: '3rem 0', color: 'var(--text-secondary)' }}>
                Loading...
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (error || !post) {
    return (
      <article className="post">
        <div className="container">
          <div className="post-layout">
            {sidebarLoaded && (
              <Sidebar
                categoryTree={categoryTree}
                categoryPosts={categoryPosts}
                currentCategoryIds={currentCategoryIds}
                currentPostSlug={slug}
                expandedCategories={expandedCategories}
                onToggleCategory={handleToggleCategory}
              />
            )}
            <div className="post-main">
              <div className="post-header">
                <h1>Post Not Found</h1>
                <p className="post-meta">The article you're looking for doesn't exist.</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="post">
      <div className="container">
        <div className="post-layout">
          {/* Memoized Sidebar */}
          <Sidebar
            categoryTree={categoryTree}
            categoryPosts={categoryPosts}
            currentCategoryIds={currentCategoryIds}
            currentPostSlug={slug}
            expandedCategories={expandedCategories}
            onToggleCategory={handleToggleCategory}
          />

          {/* Main Content */}
          <div className="post-main">
            <header className="post-header">
              <span className={`post-category ${categoryInfo.color}`}>
                {categoryInfo.icon} {categoryInfo.name}
              </span>
              <h1 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
              <p className="post-meta">
                <FiClock style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                {formatDate(post.date)}
              </p>
            </header>

            <div
              className="post-content"
              dangerouslySetInnerHTML={{ __html: sanitizePostContent(post.content.rendered) }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export default BlogPost;
