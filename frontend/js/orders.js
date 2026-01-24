// Orders Service for AAGAM Frontend
class OrdersService {
    constructor() {
        this.api = window.api || new ApiService();
        this.orders = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    // Get all orders
    async getOrders() {
        try {
            const response = await this.api.getOrders();
            this.orders = response.orders || [];
            return this.orders;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    }

    // Get single order
    async getOrder(orderId) {
        try {
            return await this.api.getOrder(orderId);
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    }

    // Create new order
    async createOrder(orderData) {
        try {
            const response = await this.api.createOrder(orderData);

            // Clear cart after successful order
            if (window.cart) {
                window.cart.clearCart();
            }

            // Show success message
            this.showMessage('Order placed successfully!', 'success');

            return response;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    // Cancel order
    async cancelOrder(orderId) {
        try {
            const response = await this.api.cancelOrder(orderId);
            this.showMessage('Order cancelled successfully', 'success');

            // Refresh orders list
            await this.getOrders();
            this.renderOrders();

            return response;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    // Get order status text
    getStatusText(status) {
        const statusMap = {
            'pending': 'Order Placed',
            'confirmed': 'Order Confirmed',
            'preparing': 'Preparing',
            'ready': 'Ready for Pickup',
            'out_for_delivery': 'Out for Delivery',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }

    // Get status color
    getStatusColor(status) {
        const colorMap = {
            'pending': '#ffa500',
            'confirmed': '#007bff',
            'preparing': '#28a745',
            'ready': '#17a2b8',
            'out_for_delivery': '#6f42c1',
            'delivered': '#28a745',
            'cancelled': '#dc3545'
        };
        return colorMap[status] || '#6c757d';
    }

    // Render orders list
    renderOrders() {
        const container = document.getElementById('ordersContainer');
        if (!container) return;

        if (this.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>No orders yet</h3>
                    <p>Start shopping to place your first order!</p>
                    <a href="/index.html" class="btn btn-primary">Start Shopping</a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.orders.map(order => this.renderOrderCard(order)).join('');
    }

    // Render individual order card
    renderOrderCard(order) {
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h4>Order #${order.id.slice(-8)}</h4>
                        <p class="order-date">${orderDate}</p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge" style="background: ${this.getStatusColor(order.status)}">
                            ${this.getStatusText(order.status)}
                        </span>
                    </div>
                </div>

                <div class="order-items">
                    ${order.items.slice(0, 3).map(item => `
                        <div class="order-item-preview">
                            <img src="${item.img || '/assets/placeholder.png'}" alt="${item.name}">
                            <div class="item-info">
                                <p class="item-name">${item.name}</p>
                                <p class="item-qty">Qty: ${item.quantity}</p>
                            </div>
                        </div>
                    `).join('')}
                    ${order.items.length > 3 ? `<span class="more-items">+${order.items.length - 3} more</span>` : ''}
                </div>

                <div class="order-footer">
                    <div class="order-total">
                        <span class="total-label">Total: </span>
                        <span class="total-amount">₹${order.total}</span>
                        <span class="items-count">(${totalItems} items)</span>
                    </div>

                    <div class="order-actions">
                        <button class="btn btn-outline" onclick="orders.showOrderDetails('${order.id}')">
                            View Details
                        </button>
                        ${this.getOrderActions(order)}
                    </div>
                </div>
            </div>
        `;
    }

    // Get order actions based on status
    getOrderActions(order) {
        const cancellableStatuses = ['pending', 'confirmed'];

        if (cancellableStatuses.includes(order.status)) {
            return `
                <button class="btn btn-danger" onclick="orders.cancelOrder('${order.id}')">
                    Cancel Order
                </button>
            `;
        }

        if (order.status === 'delivered') {
            return `
                <button class="btn btn-success" onclick="orders.reorder('${order.id}')">
                    Reorder
                </button>
            `;
        }

        return '';
    }

    // Show order details modal
    showOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.createElement('div');
        modal.className = 'modal order-details-modal';
        modal.innerHTML = this.renderOrderDetails(order);

        document.body.appendChild(modal);

        // Setup modal close
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => modal.remove());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // Render order details
    renderOrderDetails(order) {
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Order Details</h3>
                    <button class="modal-close">&times;</button>
                </div>

                <div class="modal-body">
                    <div class="order-summary">
                        <div class="summary-row">
                            <span>Order ID:</span>
                            <span>${order.id}</span>
                        </div>
                        <div class="summary-row">
                            <span>Date:</span>
                            <span>${orderDate}</span>
                        </div>
                        <div class="summary-row">
                            <span>Status:</span>
                            <span class="status-badge" style="background: ${this.getStatusColor(order.status)}">
                                ${this.getStatusText(order.status)}
                            </span>
                        </div>
                        <div class="summary-row">
                            <span>Payment:</span>
                            <span>${order.paymentMethod}</span>
                        </div>
                    </div>

                    <div class="delivery-address">
                        <h4>Delivery Address</h4>
                        <p>${order.deliveryAddress}</p>
                    </div>

                    <div class="order-items-detailed">
                        <h4>Items Ordered</h4>
                        ${order.items.map(item => `
                            <div class="detailed-item">
                                <img src="${item.img || '/assets/placeholder.png'}" alt="${item.name}">
                                <div class="item-details">
                                    <h5>${item.name}</h5>
                                    <p class="item-weight">${item.weight || '1 kg'}</p>
                                    <p class="item-price">₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="order-total-detailed">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>₹${order.subtotal || order.total}</span>
                        </div>
                        ${order.deliveryCharge ? `
                            <div class="total-row">
                                <span>Delivery Charge:</span>
                                <span>₹${order.deliveryCharge}</span>
                            </div>
                        ` : ''}
                        <div class="total-row final-total">
                            <span>Total:</span>
                            <span>₹${order.total}</span>
                        </div>
                    </div>

                    ${order.status === 'out_for_delivery' || order.status === 'delivered' ? `
                        <div class="delivery-tracking">
                            <h4>Delivery Tracking</h4>
                            <button class="btn btn-primary" onclick="orders.trackOrder('${order.id}')">
                                Track Order
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Track order
    async trackOrder(orderId) {
        try {
            const tracking = await this.api.getDeliveryStatus(orderId);
            this.showTrackingModal(tracking);
        } catch (error) {
            this.showMessage('Unable to fetch tracking information', 'error');
        }
    }

    // Show tracking modal
    showTrackingModal(tracking) {
        const modal = document.createElement('div');
        modal.className = 'modal tracking-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Order Tracking</h3>
                    <button class="modal-close">&times;</button>
                </div>

                <div class="modal-body">
                    <div class="tracking-timeline">
                        ${this.renderTrackingTimeline(tracking)}
                    </div>

                    ${tracking.rider ? `
                        <div class="rider-info">
                            <h4>Delivery Partner</h4>
                            <p><strong>${tracking.rider.name}</strong></p>
                            <p>Phone: ${tracking.rider.phone}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => modal.remove());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // Render tracking timeline
    renderTrackingTimeline(tracking) {
        const steps = [
            { status: 'confirmed', label: 'Order Confirmed', time: tracking.confirmedAt },
            { status: 'preparing', label: 'Preparing Order', time: tracking.preparingAt },
            { status: 'ready', label: 'Ready for Pickup', time: tracking.readyAt },
            { status: 'out_for_delivery', label: 'Out for Delivery', time: tracking.outForDeliveryAt },
            { status: 'delivered', label: 'Delivered', time: tracking.deliveredAt }
        ];

        return steps.map(step => `
            <div class="timeline-step ${tracking.status === step.status || this.isStepCompleted(step.status, tracking.status) ? 'completed' : ''}">
                <div class="step-icon">
                    <i class="fas fa-check"></i>
                </div>
                <div class="step-content">
                    <h5>${step.label}</h5>
                    ${step.time ? `<p>${new Date(step.time).toLocaleString()}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    // Check if step is completed
    isStepCompleted(stepStatus, currentStatus) {
        const statusOrder = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
        const stepIndex = statusOrder.indexOf(stepStatus);
        const currentIndex = statusOrder.indexOf(currentStatus);
        return stepIndex < currentIndex;
    }

    // Reorder functionality
    async reorder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        // Add items to cart
        order.items.forEach(item => {
            if (window.cart) {
                window.cart.addToCart(item, item.quantity);
            }
        });

        // Redirect to cart
        window.location.href = '/cart.html';
    }

    // Setup event listeners
    setupEventListeners() {
        // Filter orders
        const filterSelect = document.getElementById('orderFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                this.filterOrders(filterSelect.value);
            });
        }

        // Search orders
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.searchOrders(searchInput.value);
            });
        }
    }

    // Filter orders by status
    filterOrders(status) {
        let filteredOrders = this.orders;

        if (status !== 'all') {
            filteredOrders = this.orders.filter(order => order.status === status);
        }

        this.renderFilteredOrders(filteredOrders);
    }

    // Search orders
    searchOrders(query) {
        if (!query.trim()) {
            this.renderOrders();
            return;
        }

        const filteredOrders = this.orders.filter(order =>
            order.id.toLowerCase().includes(query.toLowerCase()) ||
            order.items.some(item =>
                item.name.toLowerCase().includes(query.toLowerCase())
            )
        );

        this.renderFilteredOrders(filteredOrders);
    }

    // Render filtered orders
    renderFilteredOrders(filteredOrders) {
        const container = document.getElementById('ordersContainer');
        if (!container) return;

        if (filteredOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-search"></i>
                    <h3>No orders found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredOrders.map(order => this.renderOrderCard(order)).join('');
    }

    // Show message to user
    showMessage(message, type = 'info') {
        if (window.auth && window.auth.showMessage) {
            window.auth.showMessage(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize orders service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.orders = new OrdersService();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrdersService;
}