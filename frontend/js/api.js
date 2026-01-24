// API Service for AAGAM Frontend
class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('aagam_token');
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Network error' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication methods
    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.token) {
            this.token = response.token;
            localStorage.setItem('aagam_token', response.token);
            localStorage.setItem('aagam_user', JSON.stringify(response.user));
        }

        return response;
    }

    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.token) {
            this.token = response.token;
            localStorage.setItem('aagam_token', response.token);
            localStorage.setItem('aagam_user', JSON.stringify(response.user));
        }

        return response;
    }

    async logout() {
        localStorage.removeItem('aagam_token');
        localStorage.removeItem('aagam_user');
        this.token = null;
    }

    // Products methods
    async getProducts(category = null, search = null) {
        let endpoint = '/products';
        const params = new URLSearchParams();

        if (category) params.append('category', category);
        if (search) params.append('search', search);

        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }

        return await this.request(endpoint);
    }

    async getProduct(id) {
        return await this.request(`/products/${id}`);
    }

    // Cart methods
    async getCart() {
        return await this.request('/cart');
    }

    async addToCart(productId, quantity = 1) {
        return await this.request('/cart', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        });
    }

    async updateCartItem(productId, quantity) {
        return await this.request(`/cart/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    }

    async removeFromCart(productId) {
        return await this.request(`/cart/${productId}`, {
            method: 'DELETE'
        });
    }

    async clearCart() {
        return await this.request('/cart', {
            method: 'DELETE'
        });
    }

    // Orders methods
    async getOrders() {
        return await this.request('/orders');
    }

    async getOrder(id) {
        return await this.request(`/orders/${id}`);
    }

    async createOrder(orderData) {
        return await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async cancelOrder(orderId) {
        return await this.request(`/orders/${orderId}/cancel`, {
            method: 'PUT'
        });
    }

    // User profile methods
    async getProfile() {
        return await this.request('/auth/profile');
    }

    async updateProfile(userData) {
        return await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // Delivery methods
    async getDeliveryStatus(orderId) {
        return await this.request(`/delivery/${orderId}/status`);
    }

    async updateDeliveryStatus(orderId, status, location = null) {
        return await this.request(`/delivery/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, location })
        });
    }

    // Admin methods (if user is admin)
    async getAllOrders() {
        return await this.request('/admin/orders');
    }

    async updateOrderStatus(orderId, status) {
        return await this.request(`/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    async getAllProducts() {
        return await this.request('/admin/products');
    }

    async createProduct(productData) {
        return await this.request('/admin/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async updateProduct(productId, productData) {
        return await this.request(`/admin/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    async deleteProduct(productId) {
        return await this.request(`/admin/products/${productId}`, {
            method: 'DELETE'
        });
    }

    // Utility methods
    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        const user = localStorage.getItem('aagam_user');
        return user ? JSON.parse(user) : null;
    }

    // Error handling
    handleError(error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            this.logout();
            window.location.href = '/login.html';
        }
        throw error;
    }
}

// Create global API instance
const api = new ApiService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}