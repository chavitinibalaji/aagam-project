// Database configuration
// For demo purposes, using JSON file storage
// In production, use MongoDB or other database

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File paths
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Initialize files if they don't exist
const initializeFile = (filePath, defaultData) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
};

// Initialize data files
initializeFile(PRODUCTS_FILE, { products: [] });
initializeFile(ORDERS_FILE, { orders: [] });
initializeFile(USERS_FILE, { users: [] });

// Database operations
const db = {
    // Products
    getProducts: () => {
        try {
            const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading products:', error);
            return { products: [] };
        }
    },

    saveProducts: (products) => {
        try {
            fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving products:', error);
            return false;
        }
    },

    // Orders
    getOrders: () => {
        try {
            const data = fs.readFileSync(ORDERS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading orders:', error);
            return { orders: [] };
        }
    },

    saveOrders: (orders) => {
        try {
            fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving orders:', error);
            return false;
        }
    },

    // Users
    getUsers: () => {
        try {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading users:', error);
            return { users: [] };
        }
    },

    saveUsers: (users) => {
        try {
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving users:', error);
            return false;
        }
    }
};

module.exports = db;