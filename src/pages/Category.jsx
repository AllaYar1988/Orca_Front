import { useState, useEffect, useCallback, memo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiClock, FiArrowRight, FiCpu, FiWifi, FiZap, FiFolder, FiChevronRight, FiChevronDown, FiHome, FiFileText } from 'react-icons/fi';
import {
  getPostsByCategory,
  formatDate,
  getCategoryBySlug,
  getCategories
} from '../services/wordpress';
import { getSidebarData, getCachedData } from '../services/sidebarCache';
import './Category.css';

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

// Color cycle for dynamic categories
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
  currentCategorySlug,
  categoryPosts,
  onToggleCategory,
  expandedCategories
}) {
  const isActive = category.slug === currentCategorySlug;
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
                currentCategorySlug={currentCategorySlug}
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
                isActive={false}
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
              currentCategorySlug={currentCategorySlug}
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
              isActive={false}
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
  currentCategorySlug,
  expandedCategories,
  onToggleCategory
}) {
  return (
    <aside className="category-sidebar">
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
                currentCategorySlug={currentCategorySlug}
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

// Helper to find category path to expand
function findCategoryPath(categories, targetSlug, path = []) {
  for (const cat of categories) {
    const newPath = [...path, cat.id];
    if (cat.slug === targetSlug) {
      return newPath;
    }
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryPath(cat.children, targetSlug, newPath);
      if (found) return found;
    }
  }
  return null;
}

function Category() {
  const { slug } = useParams();

  // Initialize from shared cache
  const cachedData = getCachedData();
  const [categoryTree, setCategoryTree] = useState(cachedData.categoryTree || []);
  const [categoryPosts, setCategoryPosts] = useState(cachedData.categoryPosts || {});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [sidebarLoaded, setSidebarLoaded] = useState(cachedData.isValid);

  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState(null);
  const [childCategories, setChildCategories] = useState([]);
  const [ancestors, setAncestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorIndex, setColorIndex] = useState(0);

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

      // Auto-expand path to current category
      const path = findCategoryPath(tree, slug);
      if (path) {
        setExpandedCategories(prev => {
          const expanded = { ...prev };
          path.forEach(id => { expanded[id] = true; });
          return expanded;
        });
      }
    }

    fetchSidebarData();
  }, [slug]);

  // Fetch category data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch current category info
      const categoryData = await getCategoryBySlug(slug);
      setCategory(categoryData);

      if (categoryData) {
        // Find child categories from the cached tree
        const findChildren = (cats) => {
          for (const cat of cats) {
            if (cat.slug === slug) {
              return cat.children || [];
            }
            if (cat.children) {
              const found = findChildren(cat.children);
              if (found) return found;
            }
          }
          return null;
        };

        const children = findChildren(categoryTree) || [];
        setChildCategories(children);

        // Fetch all categories to build ancestor chain
        const allCategories = await getCategories();

        // Build ancestor chain (breadcrumb)
        const ancestorChain = [];
        let current = categoryData;
        while (current && current.parent !== 0) {
          const parent = allCategories.find(cat => cat.id === current.parent);
          if (parent) {
            ancestorChain.unshift(parent);
            current = parent;
          } else {
            break;
          }
        }
        setAncestors(ancestorChain);

        // Find color index based on root category
        const rootSlug = ancestorChain.length > 0 ? ancestorChain[0].slug : slug;
        const rootIndex = allCategories
          .filter(c => c.parent === 0 && c.slug !== 'uncategorized')
          .findIndex(c => c.slug === rootSlug);
        setColorIndex(rootIndex >= 0 ? rootIndex : 0);
      }

      // Fetch posts for this category
      const postsData = await getPostsByCategory(slug, 50);
      setPosts(postsData);

      setLoading(false);
    }
    fetchData();
  }, [slug, categoryTree]);

  // Get icon for category
  function getCategoryIcon(categorySlug) {
    return categoryIcons[categorySlug] || FiFolder;
  }

  // Get color for category
  function getCategoryColor(categorySlug) {
    if (categoryColors[categorySlug]) {
      return categoryColors[categorySlug];
    }
    // Use the root category's color index
    return colorCycle[colorIndex % colorCycle.length];
  }

  const color = getCategoryColor(slug);
  const IconComponent = getCategoryIcon(slug);

  if (loading && !sidebarLoaded) {
    return (
      <div className="category-page">
        <section className={`category-hero ${color}`}>
          <div className="container">
            <div className="loading">Loading...</div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="category-page">
      <section className={`category-hero ${color}`}>
        <div className="container">
          {/* Breadcrumb Navigation */}
          <nav className="category-breadcrumb">
            <Link to="/courses" className="breadcrumb-link">
              <FiHome /> Courses
            </Link>
            {ancestors.map((ancestor) => (
              <span key={ancestor.id} className="breadcrumb-item">
                <FiChevronRight />
                <Link to={`/category/${ancestor.slug}`} className="breadcrumb-link">
                  {ancestor.name}
                </Link>
              </span>
            ))}
            {category && (
              <span className="breadcrumb-item current">
                <FiChevronRight />
                <span>{category.name}</span>
              </span>
            )}
          </nav>

          <div className="category-hero-content">
            <div className={`category-icon ${color}`}>
              <IconComponent />
            </div>
            <div>
              <h1>{category?.name || slug}</h1>
              {category?.description && (
                <p dangerouslySetInnerHTML={{ __html: category.description }} />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="category-content section">
        <div className="container">
          <div className="category-layout">
            {/* Sidebar Navigation */}
            <Sidebar
              categoryTree={categoryTree}
              categoryPosts={categoryPosts}
              currentCategorySlug={slug}
              expandedCategories={expandedCategories}
              onToggleCategory={handleToggleCategory}
            />

            {/* Main Content */}
            <div className="category-main">
              {/* Child Categories Section */}
              {childCategories.length > 0 && (
                <div className="child-categories-section">
                  <h2 className="section-title">Subcategories</h2>
                  <div className="children-grid">
                    {childCategories.map((child) => (
                      <Link
                        key={child.id}
                        to={`/category/${child.slug}`}
                        className={`child-category-card ${color}`}
                      >
                        <div className="child-category-content">
                          <FiFolder className="child-icon" />
                          <div>
                            <h3>{child.name}</h3>
                            {child.description && (
                              <p dangerouslySetInnerHTML={{ __html: child.description }} />
                            )}
                            <span className="post-count">{child.count} article{child.count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <FiArrowRight className="arrow-icon" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts Section */}
              <div className="posts-section">
                <h2 className="section-title">
                  {childCategories.length > 0 ? 'All Articles in This Category' : 'All Articles'}
                </h2>

                {loading ? (
                  <div className="loading">Loading posts...</div>
                ) : posts.length === 0 ? (
                  <div className="no-posts">
                    <p>No posts in this category yet.</p>
                    <p>Check back soon or explore our <Link to="/blog">blog</Link> for other articles.</p>
                  </div>
                ) : (
                  <div className="posts-list">
                    {posts.map((post) => (
                      <article key={post.id} className={`post-item ${color}`}>
                        <div className="post-item-content">
                          <h3 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                          <div
                            className="post-item-excerpt"
                            dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                          />
                          <div className="post-item-footer">
                            <span className="post-item-date">
                              <FiClock /> {formatDate(post.date)}
                            </span>
                            <Link to={`/blog/${post.slug}`} className="post-item-link">
                              Read Article <FiArrowRight />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Category;
