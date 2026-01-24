// User Model

const bcrypt = require('bcryptjs');

class User {
    constructor(data) {
        this.id = data.id || Date.now();
        this.name = data.name;
        this.email = data.email;
        this.phone = data.phone || '';
        this.password = data.password; // Will be hashed
        this.role = data.role || 'customer'; // customer, admin
        this.status = data.status || 'active'; // active, inactive, suspended
        this.address = data.address || {};
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = new Date();
        this.lastLogin = data.lastLogin || null;
    }

    // Hash password before saving
    async hashPassword() {
        if (this.password && !this.password.startsWith('$2a$')) {
            const saltRounds = 10;
            this.password = await bcrypt.hash(this.password, saltRounds);
        }
    }

    // Verify password
    async verifyPassword(password) {
        return await bcrypt.compare(password, this.password);
    }

    // Validate user data
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Name is required');
        }

        if (!this.email || !this.isValidEmail(this.email)) {
            errors.push('Valid email is required');
        }

        if (!this.password || this.password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Email validation helper
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Update user profile
    updateProfile(data) {
        if (data.name) this.name = data.name;
        if (data.phone) this.phone = data.phone;
        if (data.address) this.address = { ...this.address, ...data.address };
        this.updatedAt = new Date();
    }

    // Change password
    async changePassword(newPassword) {
        this.password = newPassword;
        await this.hashPassword();
        this.updatedAt = new Date();
    }

    // Update last login
    updateLastLogin() {
        this.lastLogin = new Date();
    }

    // Check if user is admin
    isAdmin() {
        return this.role === 'admin';
    }

    // Check if user is active
    isActive() {
        return this.status === 'active';
    }

    // Suspend user
    suspend() {
        this.status = 'suspended';
        this.updatedAt = new Date();
    }

    // Activate user
    activate() {
        this.status = 'active';
        this.updatedAt = new Date();
    }

    // Get user profile (without sensitive data)
    getProfile() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phone: this.phone,
            role: this.role,
            status: this.status,
            address: this.address,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin
        };
    }

    // Convert to plain object for JSON storage
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phone: this.phone,
            password: this.password,
            role: this.role,
            status: this.status,
            address: this.address,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastLogin: this.lastLogin
        };
    }
}

module.exports = User;