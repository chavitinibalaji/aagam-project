// Order Model

class Order {
    constructor(data) {
        this.id = data.id || this.generateOrderId();
        this.userId = data.userId;
        this.customer = data.customer;
        this.items = data.items || []; // Array of {productId, name, price, quantity}
        this.total = data.total || 0;
        this.status = data.status || 'pending'; // pending, confirmed, shipped, delivered
        this.paymentMethod = data.paymentMethod || 'cod';
        this.address = data.address || {};
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = new Date();
    }

    // Generate unique order ID
    generateOrderId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `ORD${timestamp}${random}`;
    }

    // Validate order data
    validate() {
        const errors = [];

        if (!this.userId) {
            errors.push('User ID is required');
        }

        if (!this.customer || this.customer.trim().length === 0) {
            errors.push('Customer name is required');
        }

        if (!this.items || this.items.length === 0) {
            errors.push('Order must have at least one item');
        }

        if (this.total <= 0) {
            errors.push('Order total must be greater than 0');
        }

        if (!this.address || !this.address.street) {
            errors.push('Delivery address is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Calculate total from items
    calculateTotal() {
        this.total = this.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        return this.total;
    }

    // Update order status
    updateStatus(newStatus) {
        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];
        if (validStatuses.includes(newStatus)) {
            this.status = newStatus;
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    // Add item to order
    addItem(item) {
        this.items.push(item);
        this.calculateTotal();
        this.updatedAt = new Date();
    }

    // Remove item from order
    removeItem(productId) {
        this.items = this.items.filter(item => item.productId !== productId);
        this.calculateTotal();
        this.updatedAt = new Date();
    }

    // Get order summary
    getSummary() {
        return {
            id: this.id,
            customer: this.customer,
            itemCount: this.items.length,
            total: this.total,
            status: this.status,
            createdAt: this.createdAt
        };
    }

    // Convert to plain object for JSON storage
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            customer: this.customer,
            items: this.items,
            total: this.total,
            status: this.status,
            paymentMethod: this.paymentMethod,
            address: this.address,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Order;