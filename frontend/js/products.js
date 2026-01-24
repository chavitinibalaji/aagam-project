// Products Service for AAGAM Frontend
class ProductsService {
    constructor() {
        this.api = window.api || new ApiService();
        this.products = [];
        this.categories = [];
        this.currentCategory = null;
        this.currentSearch = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    // Load products
    async loadProducts(category = null, search = null) {
        try {
            this.currentCategory = category;
            this.currentSearch = search;

            const response = await this.api.getProducts(category, search);
            this.products = response.products || [];
            this.categories = response.categories || [];

            return this.products;
        } catch (error) {
            console.error('Error loading products:', error);
            throw error;
        }
    }

    // Get products by category
    async getProductsByCategory(category) {
        return this.loadProducts(category, this.currentSearch);
    }

    // Search products
    async searchProducts(query) {
        return this.loadProducts(this.currentCategory, query);
    }

    // Get single product
    async getProduct(productId) {
        try {
            return await this.api.getProduct(productId);
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    }

    // Render products grid
    renderProducts() {
        const container = document.getElementById('productsGrid');
        if (!container) return;

        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="empty-products">
                    <i class="fas fa-search"></i>
                    <h3>No products found</h3>
                    <p>Try adjusting your search or browse different categories.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.products.map(product => `
            <aagam-product-card product='${JSON.stringify(product).replace(/'/g, "&apos;")}'></aagam-product-card>
        `).join('');
    }

    // Render categories
    renderCategories() {
        const container = document.getElementById('categoriesContainer');
        if (!container) return;

        const categoriesHtml = this.categories.map(category => `
            <div class="category-item ${this.currentCategory === category.id ? 'active' : ''}"
                 data-category="${category.id}"
                 onclick="products.selectCategory('${category.id}')">
                <div class="category-icon">
                    <i class="fas ${category.icon || 'fa-utensils'}"></i>
                </div>
                <span class="category-name">${category.name}</span>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="category-item ${!this.currentCategory ? 'active' : ''}"
                 data-category="all"
                 onclick="products.selectCategory(null)">
                <div class="category-icon">
                    <i class="fas fa-th-large"></i>
                </div>
                <span class="category-name">All</span>
            </div>
            ${categoriesHtml}
        `;
    }

    // Select category
    async selectCategory(categoryId) {
        this.currentCategory = categoryId;
        await this.loadProducts(categoryId, this.currentSearch);
        this.renderProducts();
        this.renderCategories();
        this.updateURL();
    }

    // Search products
    async performSearch(query) {
        this.currentSearch = query;
        await this.loadProducts(this.currentCategory, query);
        this.renderProducts();
        this.updateURL();
    }

    // Update URL with current filters
    updateURL() {
        const params = new URLSearchParams();

        if (this.currentCategory) {
            params.set('category', this.currentCategory);
        }

        if (this.currentSearch) {
            params.set('search', this.currentSearch);
        }

        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newURL);
    }

    // Load filters from URL
    loadFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        const search = params.get('search');

        return { category, search };
    }

    // Setup event listeners
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;

            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });

            // Search on Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(searchTimeout);
                    this.performSearch(e.target.value);
                }
            });
        }

        // Search button
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    this.performSearch(searchInput.value);
                }
            });
        }

        // Clear search
        const clearSearchBtn = document.getElementById('clearSearch');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = '';
                    this.performSearch('');
                }
            });
        }

        // Load filters from URL on page load
        document.addEventListener('DOMContentLoaded', async () => {
            const { category, search } = this.loadFiltersFromURL();

            if (category || search) {
                await this.loadProducts(category, search);

                // Update UI
                if (search) {
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) searchInput.value = search;
                }

                this.renderProducts();
                this.renderCategories();
            } else {
                // Load all products initially
                await this.loadProducts();
                this.renderProducts();
                this.renderCategories();
            }
        });

        // Product card events
        document.addEventListener('productClick', (e) => {
            // Handle product click (could open product modal or navigate to product page)
            console.log('Product clicked:', e.detail.product);
        });
    }

    // Get product recommendations
    getRecommendations(productId, limit = 4) {
        // Simple recommendation logic - products from same category
        const product = this.products.find(p => p.id === productId);
        if (!product) return [];

        return this.products
            .filter(p => p.id !== productId && p.category === product.category)
            .slice(0, limit);
    }

    // Get featured products
    getFeaturedProducts(limit = 8) {
        // Return products with highest discount or rating
        return this.products
            .filter(p => p.mrp && p.mrp > p.price)
            .sort((a, b) => {
                const discountA = ((a.mrp - a.price) / a.mrp) * 100;
                const discountB = ((b.mrp - b.price) / b.mrp) * 100;
                return discountB - discountA;
            })
            .slice(0, limit);
    }

    // Get products on sale
    getSaleProducts(limit = 8) {
        return this.products
            .filter(p => p.mrp && p.mrp > p.price)
            .slice(0, limit);
    }

    // Get products by price range
    getProductsByPriceRange(minPrice, maxPrice) {
        return this.products.filter(p => p.price >= minPrice && p.price <= maxPrice);
    }

    // Sort products
    sortProducts(sortBy) {
        switch (sortBy) {
            case 'price-low':
                this.products.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.products.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                this.products.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'discount':
                this.products.sort((a, b) => {
                    const discountA = a.mrp ? ((a.mrp - a.price) / a.mrp) * 100 : 0;
                    const discountB = b.mrp ? ((b.mrp - b.price) / b.mrp) * 100 : 0;
                    return discountB - discountA;
                });
                break;
            default:
                // Default sort by relevance/popularity
                break;
        }

        this.renderProducts();
    }

    // Filter products
    filterProducts(filters) {
        let filtered = [...this.products];

        // Price filter
        if (filters.minPrice !== undefined) {
            filtered = filtered.filter(p => p.price >= filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            filtered = filtered.filter(p => p.price <= filters.maxPrice);
        }

        // Stock filter
        if (filters.inStockOnly) {
            filtered = filtered.filter(p => p.stock > 0);
        }

        // Category filter (if not already filtered)
        if (filters.category && filters.category !== this.currentCategory) {
            filtered = filtered.filter(p => p.category === filters.category);
        }

        // Update products and render
        this.products = filtered;
        this.renderProducts();
    }

    // Reset filters
    async resetFilters() {
        await this.loadProducts(this.currentCategory, this.currentSearch);
        this.renderProducts();
    }

    // Get product statistics
    getStats() {
        return {
            total: this.products.length,
            inStock: this.products.filter(p => p.stock > 0).length,
            outOfStock: this.products.filter(p => p.stock === 0).length,
            onSale: this.products.filter(p => p.mrp && p.mrp > p.price).length,
            categories: this.categories.length
        };
    }
}

// Initialize products service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.products = new ProductsService();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductsService;
}