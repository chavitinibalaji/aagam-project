// Product Model
// For demo purposes, using simple object structure
// In production, use Mongoose with MongoDB

class Product {
    constructor(data) {
        this.id = data.id || Date.now();
        this.name = data.name;
        this.price = data.price;
        this.mrp = data.mrp || null;
        this.off = data.off || null;
        this.weight = data.weight;
        this.img = data.img;
        this.cat = data.cat;
        this.stock = data.stock || 0;
        this.description = data.description || '';
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = new Date();
    }

    // Validate product data
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Product name is required');
        }

        if (!this.price || isNaN(this.price) || this.price <= 0) {
            errors.push('Valid price is required');
        }

        if (!this.weight || this.weight.trim().length === 0) {
            errors.push('Weight/quantity is required');
        }

        if (!this.img || this.img.trim().length === 0) {
            errors.push('Product image URL is required');
        }

        if (!this.cat || this.cat.trim().length === 0) {
            errors.push('Product category is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Convert to plain object for JSON storage
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            price: this.price,
            mrp: this.mrp,
            off: this.off,
            weight: this.weight,
            img: this.img,
            cat: this.cat,
            stock: this.stock,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    // Calculate discount percentage
    getDiscountPercentage() {
        if (this.mrp && this.price) {
            return Math.round(((this.mrp - this.price) / this.mrp) * 100);
        }
        return 0;
    }

    // Check if product is in stock
    isInStock() {
        return this.stock > 0;
    }

    // Update stock
    updateStock(quantity) {
        this.stock = Math.max(0, this.stock + quantity);
        this.updatedAt = new Date();
    }
}

module.exports = Product;