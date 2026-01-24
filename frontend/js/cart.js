// Shopping Cart Service for AAGAM Frontend
class CartService {
    constructor() {
        this.api = window.api || new ApiService();
        this.cart = this.loadCart();
        this.init();
    }

    init() {
        this.updateCartBadge();
        this.setupEventListeners();
    }

    // Load cart from localStorage
    loadCart() {
        try {
            const cart = localStorage.getItem('aagam_cart');
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }

    // Save cart to localStorage
    saveCart() {
        try {
            localStorage.setItem('aagam_cart', JSON.stringify(this.cart));
            this.updateCartBadge();
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    // Add item to cart
    addToCart(product, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                mrp: product.mrp,
                img: product.img,
                weight: product.weight,
                quantity: quantity,
                category: product.category
            });
        }

        this.saveCart();
        this.showMessage(`${product.name} added to cart!`, 'success');

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: this.cart } }));
    }

    // Update item quantity
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);

        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: this.cart } }));
            }
        }
    }

    // Remove item from cart
    removeFromCart(productId) {
        const index = this.cart.findIndex(item => item.id === productId);
        if (index > -1) {
            const item = this.cart[index];
            this.cart.splice(index, 1);
            this.saveCart();
            this.showMessage(`${item.name} removed from cart`, 'info');
            window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: this.cart } }));
        }
    }

    // Clear cart
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.showMessage('Cart cleared', 'info');
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: this.cart } }));
    }

    // Get cart items
    getItems() {
        return this.cart;
    }

    // Get cart total
    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Get cart item count
    getItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    // Get cart savings
    getSavings() {
        return this.cart.reduce((savings, item) => {
            const mrp = item.mrp || item.price;
            return savings + ((mrp - item.price) * item.quantity);
        }, 0);
    }

    // Check if cart is empty
    isEmpty() {
        return this.cart.length === 0;
    }

    // Update cart badge in header
    updateCartBadge() {
        const badge = document.querySelector('.cart-badge');
        if (badge) {
            const count = this.getItemCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for add to cart events from product cards
        document.addEventListener('addToCart', (e) => {
            this.addToCart(e.detail.product);
        });

        // Listen for quantity update events
        document.addEventListener('updateQuantity', (e) => {
            this.updateQuantity(e.detail.productId, e.detail.quantity);
        });

        // Listen for cart updates to refresh UI
        window.addEventListener('cartUpdated', () => {
            this.renderCart();
        });
    }

    // Render cart items (for cart page)
    renderCart() {
        const cartContainer = document.getElementById('cartItems');
        const emptyCart = document.getElementById('emptyCart');
        const cartSummary = document.getElementById('cartSummary');

        if (!cartContainer) return;

        if (this.isEmpty()) {
            cartContainer.innerHTML = '';
            if (emptyCart) emptyCart.style.display = 'block';
            if (cartSummary) cartSummary.style.display = 'none';
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        if (cartSummary) cartSummary.style.display = 'block';

        cartContainer.innerHTML = this.cart.map(item => this.renderCartItem(item)).join('');

        this.updateCartSummary();
    }

    // Render individual cart item
    renderCartItem(item) {
        const discount = item.mrp && item.mrp > item.price ?
            Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

        return `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="item-image">
                    <img src="${item.img || '/assets/placeholder.png'}" alt="${item.name}">
                </div>

                <div class="item-details">
                    <h4 class="item-name">${item.name}</h4>
                    <p class="item-weight">${item.weight || '1 kg'}</p>

                    <div class="item-price">
                        <span class="current-price">₹${item.price}</span>
                        ${item.mrp && item.mrp > item.price ?
                            `<span class="original-price">₹${item.mrp}</span>
                             <span class="discount">${discount}% OFF</span>` : ''}
                    </div>
                </div>

                <div class="item-controls">
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="qty-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>

                    <button class="remove-btn" onclick="cart.removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>

                <div class="item-total">
                    ₹${item.price * item.quantity}
                </div>
            </div>
        `;
    }

    // Update cart summary
    updateCartSummary() {
        const subtotalEl = document.getElementById('cartSubtotal');
        const savingsEl = document.getElementById('cartSavings');
        const totalEl = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (subtotalEl) subtotalEl.textContent = `₹${this.getTotal()}`;
        if (savingsEl) savingsEl.textContent = `₹${this.getSavings()}`;
        if (totalEl) totalEl.textContent = `₹${this.getTotal()}`;

        if (checkoutBtn) {
            checkoutBtn.disabled = this.isEmpty();
        }
    }

    // Sync cart with server (if authenticated)
    async syncWithServer() {
        if (!window.auth?.isAuthenticated()) return;

        try {
            // Sync local cart with server
            for (const item of this.cart) {
                await this.api.addToCart(item.id, item.quantity);
            }
        } catch (error) {
            console.error('Error syncing cart with server:', error);
        }
    }

    // Show message to user
    showMessage(message, type = 'info') {
        // Use auth service if available, otherwise create simple message
        if (window.auth && window.auth.showMessage) {
            window.auth.showMessage(message, type);
        } else {
            // Simple fallback
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Export cart data for checkout
    getCheckoutData() {
        return {
            items: this.cart,
            subtotal: this.getTotal(),
            savings: this.getSavings(),
            total: this.getTotal(),
            itemCount: this.getItemCount()
        };
    }
}

// Initialize cart service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new CartService();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartService;
}