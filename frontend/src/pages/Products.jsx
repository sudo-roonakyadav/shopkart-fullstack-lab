/**
 * ============================================================================
 * File: frontend/src/pages/Products.jsx
 * Purpose: Product Catalog Page Component (Lab 03)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Fetches and renders all Linux distribution ISO products from /api/products.
 * - Implements live search filtering by distribution name and description.
 * - Implements filtering by category (Beginner, Developer, Server, Enterprise).
 * - Implements filtering by CPU architecture (x86_64, ARM64).
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('default');

  // Wishlist item IDs to highlight saved items
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // Available categories
  const categories = [
    'All',
    'Desktop Distributions',
    'Server & Enterprise',
    'Security & Forensics',
    'Rolling Release'
  ];

  // Fetch Wishlist IDs if logged in
  const fetchWishlistIds = async () => {
    if (!user) return;
    try {
      const res = await api.get('/wishlist');
      const ids = new Set((res.data.wishlist || []).map((p) => p._id));
      setWishlistIds(ids);
    } catch (err) {
      // Non-blocking
    }
  };

  // Fetch Products based on search, category and sorting
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (sortOption === 'price_asc' || sortOption === 'price_desc') {
        params.sort = sortOption;
      }

      const response = await api.get('/products', { params });
      setProducts(response.data.products || []);
    } catch (err) {
      setError('Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortOption]);

  useEffect(() => {
    fetchWishlistIds();
  }, [user]);

  // Debounced search trigger or form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSortOption('default');
  };

  return (
    <div className="page-container">
      <div className="products-page-header">
        <div>
          <h2>Linux Distribution Catalog</h2>
          <p className="page-subtitle">
            Browse and download bootable digital ISOs for production servers, desktops, and security labs.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls (Lab-03 Task 7) */}
      <div className="filter-bar card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search products by distribution name (e.g. Ubuntu, Debian, Arch)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div className="filter-controls-row">
          <div className="filter-group">
            <label htmlFor="categoryFilter">Category:</label>
            <select
              id="categoryFilter"
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sortFilter">Sort by:</label>
            <select
              id="sortFilter"
              className="form-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="default">Default (Newest First)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {(searchTerm || selectedCategory !== 'All' || sortOption !== 'default') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-outline btn-sm reset-btn"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* State Handlers: Loading, Error, Empty, and List */}
      {loading ? (
        <div className="state-container">
          <p className="loading-text">Loading products...</p>
        </div>
      ) : error ? (
        <div className="state-container error-state">
          <p className="error-title">Error</p>
          <p className="error-text">{error}</p>
          <button onClick={fetchProducts} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="state-container empty-state">
          <h3>No products found.</h3>
          <p className="empty-text">
            No Linux distributions matched your search criteria. Try modifying your filters.
          </p>
          <button onClick={handleResetFilters} className="btn btn-secondary">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              initialWishlisted={wishlistIds.has(product._id)}
              onWishlistChange={fetchWishlistIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
