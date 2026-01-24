// Admin API Functions

const API_BASE_URL = 'http://localhost:3000/api'; // Adjust as needed

// Generic API call function
async function apiCall(endpoint, method = 'GET', data = null) {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API call failed');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        // For demo purposes, return mock data or show error
        showNotification('API Error: ' + error.message, 'error');
        throw error;
    }
}

// Dashboard API calls
async function getDashboardStats() {
    try {
        // In real app: return await apiCall('/dashboard/stats');
        // Mock data for demo
        return {
            totalProducts: 1234,
            totalOrders: 567,
            totalRevenue: 45678,
            totalUsers: 890
        };
    } catch (error) {
        return {
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,
            totalUsers: 0
        };
    }
}

async function getSalesData() {
    try {
        // In real app: return await apiCall('/dashboard/sales');
        // Mock data
        return {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            data: [12000, 19000, 15000, 25000, 22000, 30000]
        };
    } catch (error) {
        return {
            labels: [],
            data: []
        };
    }
}

async function getOrderStatusData() {
    try {
        // In real app: return await apiCall('/dashboard/order-status');
        // Mock data
        return {
            pending: 45,
            confirmed: 120,
            shipped: 89,
            delivered: 234
        };
    } catch (error) {
        return {};
    }
}

async function getRecentActivity() {
    try {
        // In real app: return await apiCall('/dashboard/activity');
        // Mock data
        return [
            {
                type: 'order',
                message: 'New order placed by John Doe',
                time: '2 minutes ago'
            },
            {
                type: 'product',
                message: 'Product "Apple Shimla" stock updated',
                time: '15 minutes ago'
            },
            {
                type: 'user',
                message: 'New user registered: Jane Smith',
                time: '1 hour ago'
            }
        ];
    } catch (error) {
        return [];
    }
}

// Product API calls
async function getProducts() {
    try {
        return await apiCall('/products');
    } catch (error) {
        // Fallback to local data
        const response = await fetch('../../data/products.json');
        return await response.json();
    }
}

async function createProduct(productData) {
    return await apiCall('/products', 'POST', productData);
}

async function updateProduct(productId, productData) {
    return await apiCall(`/products/${productId}`, 'PUT', productData);
}

async function deleteProductAPI(productId) {
    return await apiCall(`/products/${productId}`, 'DELETE');
}

// Order API calls
async function getOrders() {
    return await apiCall('/orders');
}

async function updateOrderStatusAPI(orderId, status) {
    return await apiCall(`/orders/${orderId}/status`, 'PUT', { status });
}

// User API calls
async function getUsers() {
    return await apiCall('/users');
}

async function updateUserStatus(userId, status) {
    return await apiCall(`/users/${userId}/status`, 'PUT', { status });
}

// Inventory API calls
async function getInventory() {
    return await apiCall('/inventory');
}

async function updateStock(productId, stock) {
    return await apiCall(`/inventory/${productId}`, 'PUT', { stock });
}

// Notification system
function showNotification(message, type = 'info') {
    // Simple notification - in real app, use a proper notification library
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;

    if (type === 'success') notification.style.backgroundColor = '#27ae60';
    else if (type === 'error') notification.style.backgroundColor = '#e74c3c';
    else notification.style.backgroundColor = '#3498db';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add notification styles
const notificationStyles = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

const style = document.createElement('style');
style.textContent = notificationStyles;
document.head.appendChild(style);

// Export functions for use in other modules
window.AdminAPI = {
    getDashboardStats,
    getSalesData,
    getOrderStatusData,
    getRecentActivity,
    getProducts,
    createProduct,
    updateProduct,
    deleteProductAPI,
    getOrders,
    updateOrderStatusAPI,
    getUsers,
    updateUserStatus,
    getInventory,
    updateStock,
    showNotification
};