import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { FiCpu, FiWifi, FiZap, FiFolder, FiArrowRight, FiChevronRight, FiChevronDown, FiHome, FiFileText } from 'react-icons/fi';
import { getSidebarData, getCachedData } from '../services/sidebarCache';
import './Courses.css';

// Icon mapping for known category slugs (fallback to FiFolder for unknown)
const categoryIcons = {
  'embedded-systems': FiCpu,
  'iot': FiWifi,
  'energy-monitoring': FiZap,
};

// Color mapping for known category slugs (fallback to 'green' for unknown)
const categoryColors = {
  'embedded-systems': 'green',
  'iot': 'blue',
  'energy-monitoring': 'orange',
};

// Color cycle for dynamic categories
const colorCycle = ['green', 'blue', 'orange', 'purple', 'teal'];

// Memoized post link component
const PostLink = memo(function PostLink({ post, color }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`nav-post-link ${color}`}
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
  categoryPosts,
  onToggleCategory,
  expandedCategories
}) {
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
            className={`nav-category-link ${color}`}
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
          className={`nav-child-link ${color}`}
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
  expandedCategories,
  onToggleCategory
}) {
  return (
    <aside className="courses-sidebar">
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

function Courses() {
  // Initialize from shared cache
  const cachedData = getCachedData();
  const [categoryTree, setCategoryTree] = useState(cachedData.categoryTree || []);
  const [categoryPosts, setCategoryPosts] = useState(cachedData.categoryPosts || {});
  const [featuredPosts, setFeaturedPosts] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(() => {
    // Auto-expand first level categories if we have cached data
    if (cachedData.categoryTree) {
      const expanded = {};
      cachedData.categoryTree.forEach(cat => {
        expanded[cat.id] = true;
      });
      return expanded;
    }
    return {};
  });
  const [loading, setLoading] = useState(!cachedData.isValid);

  // Memoized toggle handler
  const handleToggleCategory = useCallback((categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  useEffect(() => {
    async function fetchData() {
      const { categoryTree: tree, categoryPosts: posts } = await getSidebarData();

      setCategoryTree(tree);
      setCategoryPosts(posts);

      // Auto-expand first level categories
      setExpandedCategories(prev => {
        const expanded = { ...prev };
        tree.forEach(cat => {
          if (expanded[cat.id] === undefined) {
            expanded[cat.id] = true;
          }
        });
        return expanded;
      });

      // Set featured posts (first post from each parent category)
      const featuredMap = {};
      tree.forEach(cat => {
        const catPosts = posts[cat.slug];
        if (catPosts && catPosts.length > 0) {
          featuredMap[cat.slug] = catPosts[0];
        }
      });
      setFeaturedPosts(featuredMap);

      setLoading(false);
    }

    fetchData();
  }, []);

  // Get icon for a category
  function getCategoryIcon(slug) {
    return categoryIcons[slug] || FiFolder;
  }

  // Get color for a category (use mapping or cycle through colors)
  function getCategoryColor(slug, index) {
    return categoryColors[slug] || colorCycle[index % colorCycle.length];
  }

  // Get featured post for a category
  function getFeaturedPost(slug) {
    const post = featuredPosts[slug];
    if (post) {
      return {
        title: post.title.rendered.replace(/<[^>]+>/g, ''),
        link: `/blog/${post.slug}`
      };
    }
    return null;
  }

  if (loading) {
    return (
      <div className="courses-page">
        <section className="courses-hero">
          <div className="container">
            <h1>Our <span className="text-gradient">Courses</span></h1>
            <p>Practical, hands-on learning for embedded systems and IoT</p>
          </div>
        </section>
        <section className="courses-list section">
          <div className="container">
            <div className="loading">Loading categories...</div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <section className="courses-hero">
        <div className="container">
          <h1>Our <span className="text-gradient">Courses</span></h1>
          <p>Practical, hands-on learning for embedded systems and IoT</p>
        </div>
      </section>

      <section className="courses-list section">
        <div className="container">
          <div className="courses-layout">
            {/* Sidebar Navigation */}
            <Sidebar
              categoryTree={categoryTree}
              categoryPosts={categoryPosts}
              expandedCategories={expandedCategories}
              onToggleCategory={handleToggleCategory}
            />

            {/* Main Content */}
            <div className="courses-main">
              {categoryTree.length === 0 ? (
                <div className="no-categories">
                  <p>No categories available yet.</p>
                  <p>Check back soon for new content!</p>
                </div>
              ) : (
                categoryTree.map((category, index) => {
                  const IconComponent = getCategoryIcon(category.slug);
                  const color = getCategoryColor(category.slug, index);
                  const featured = getFeaturedPost(category.slug);

                  return (
                    <div key={category.id} className={`course-detail ${color}`}>
                      <div className="course-header">
                        <div className="course-icon">
                          <IconComponent />
                        </div>
                        <div>
                          <h2>{category.name}</h2>
                          {category.description && (
                            <p dangerouslySetInnerHTML={{ __html: category.description }} />
                          )}
                        </div>
                      </div>

                      {/* Featured Post */}
                      {featured && (
                        <div className="course-featured">
                          <span>Featured Article:</span>
                          <Link to={featured.link} className="featured-link">
                            {featured.title} <FiArrowRight />
                          </Link>
                        </div>
                      )}

                      {/* View All Link */}
                      <div className="course-all-posts">
                        <Link to={`/category/${category.slug}`} className="view-all-link">
                          View All {category.name} Articles <FiArrowRight />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Courses;
