// Admin Order Management

let orders = [];
let filteredOrders = [];

// Mock orders data
const mockOrders = [
    {
        id: 'ORD001',
        customer: 'John Doe',
        items: ['Apple Shimla', 'Banana Robusta'],
        total: 145.50,
        status: 'pending',
        date: '2024-01-20',
        address: '123 Main St, City'
    },
    {
        id: 'ORD002',
        customer: 'Jane Smith',
        items: ['Aashirvaad Atta', 'Tata Salt'],
        total: 235.00,
        status: 'confirmed',
        date: '2024-01-19',
        address: '456 Oak Ave, City'
    },
    {
        id: 'ORD003',
        customer: 'Bob Johnson',
        items: ['Milk', 'Bread', 'Eggs'],
        total: 89.75,
        status: 'shipped',
        date: '2024-01-18',
        address: '789 Pine Rd, City'
    }
];

// Load orders
function loadOrders() {
    // In real app, fetch from API
    orders = mockOrders;
    filteredOrders = [...orders];
    renderOrdersTable();
}

// Render orders table
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';

    filteredOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.items.join(', ')}</td>
            <td>₹${order.total.toFixed(2)}</td>
            <td><span class="status-badge status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>
                <select onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                </select>
                <button class="btn-secondary" onclick="viewOrderDetails('${order.id}')">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Filter orders by status
function filterOrders(status) {
    if (status === 'all') {
        filteredOrders = [...orders];
    } else {
        filteredOrders = orders.filter(order => order.status === status);
    }
    renderOrdersTable();
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        // In real app, make API call to update status
        renderOrdersTable();
    }
}

// View order details
function viewOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        alert(`Order Details:\nID: ${order.id}\nCustomer: ${order.customer}\nItems: ${order.items.join(', ')}\nTotal: ₹${order.total}\nStatus: ${order.status}\nDate: ${order.date}\nAddress: ${order.address}`);
    }
}

// Initialize order management
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();

    // Event listeners
    document.getElementById('orderStatusFilter').addEventListener('change', function(e) {
        filterOrders(e.target.value);
    });
});