// Product Card Component for AAGAM
class ProductCardComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['product'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'product' && oldValue !== newValue) {
            this.render();
            this.setupEventListeners();
        }
    }

    set product(value) {
        this.setAttribute('product', JSON.stringify(value));
    }

    get product() {
        const productAttr = this.getAttribute('product');
        return productAttr ? JSON.parse(productAttr) : null;
    }

    render() {
        const product = this.product;
        if (!product) return;

        const discount = product.mrp && product.price < product.mrp ?
            Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .product-card {
                    background: #fff;
                    border-radius: 16px;
                    overflow: hidden;
                    width: 160px;
                    flex-shrink: 0;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    position: relative;
                }

                .product-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                }

                .product-image {
                    width: 100%;
                    height: 120px;
                    background: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }

                .product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .product-badge {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    background: #00b761;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                }

                .product-info {
                    padding: 12px;
                }

                .product-name {
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 4px;
                    color: #333;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .product-weight {
                    color: #666;
                    font-size: 12px;
                    margin-bottom: 8px;
                }

                .product-price {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .current-price {
                    font-weight: 700;
                    font-size: 16px;
                    color: #00b761;
                }

                .original-price {
                    text-decoration: line-through;
                    color: #999;
                    font-size: 12px;
                }

                .discount-badge {
                    background: #dc3545;
                    color: white;
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 600;
                }

                .add-to-cart {
                    width: 100%;
                    padding: 8px;
                    background: #00b761;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                }

                .add-to-cart:hover {
                    background: #005a3d;
                }

                .add-to-cart.added {
                    background: #28a745;
                }

                .quantity-controls {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                }

                .qty-btn {
                    width: 30px;
                    height: 30px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-weight: 600;
                    color: #00b761;
                    transition: all 0.3s ease;
                }

                .qty-btn:hover {
                    background: #00b761;
                    color: white;
                }

                .quantity {
                    font-weight: 600;
                    min-width: 30px;
                    text-align: center;
                }

                .out-of-stock {
                    opacity: 0.6;
                    pointer-events: none;
                }

                .out-of-stock .add-to-cart {
                    background: #6c757d;
                    cursor: not-allowed;
                }

                @media (max-width: 480px) {
                    .product-card {
                        width: 140px;
                    }

                    .product-image {
                        height: 100px;
                    }
                }
            </style>

            <div class="product-card ${product.stock === 0 ? 'out-of-stock' : ''}" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.img || '/assets/placeholder.png'}" alt="${product.name}" loading="lazy">
                    ${discount > 0 ? `<span class="product-badge">${discount}% OFF</span>` : ''}
                </div>

                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-weight">${product.weight || '1 kg'}</div>

                    <div class="product-price">
                        <span class="current-price">₹${product.price}</span>
                        ${product.mrp && product.mrp > product.price ?
                            `<span class="original-price">₹${product.mrp}</span>
                             <span class="discount-badge">${discount}%</span>` : ''}
                    </div>

                    ${this.getCartControls(product)}
                </div>
            </div>
        `;
    }

    getCartControls(product) {
        const cartItem = this.getCartItem(product.id);

        if (cartItem) {
            return `
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="this.dispatchEvent(new CustomEvent('updateQuantity', {detail: {productId: '${product.id}', quantity: ${cartItem.quantity - 1}}, bubbles: true}))">-</button>
                    <span class="quantity">${cartItem.quantity}</span>
                    <button class="qty-btn" onclick="this.dispatchEvent(new CustomEvent('updateQuantity', {detail: {productId: '${product.id}', quantity: ${cartItem.quantity + 1}}, bubbles: true}))">+</button>
                </div>
            `;
        } else {
            return `
                <button class="add-to-cart" onclick="this.dispatchEvent(new CustomEvent('addToCart', {detail: {product: ${JSON.stringify(product)}}, bubbles: true}))">
                    <span>+</span> Add
                </button>
            `;
        }
    }

    setupEventListeners() {
        const card = this.shadowRoot.querySelector('.product-card');
        if (!card) return;

        // Card click for product details
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on buttons
            if (e.target.closest('.add-to-cart, .qty-btn')) return;

            this.dispatchEvent(new CustomEvent('productClick', {
                detail: { product: this.product },
                bubbles: true,
                composed: true
            }));
        });
    }

    getCartItem(productId) {
        const cart = JSON.parse(localStorage.getItem('aagam_cart') || '[]');
        return cart.find(item => item.id === productId);
    }
}

// Register the component
customElements.define('aagam-product-card', ProductCardComponent);