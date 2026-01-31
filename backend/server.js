const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const cartRoutes = require('./routes/cart');
const deliveryRoutes = require('./routes/delivery');
const userRoutes = require('./routes/user');

// Import middleware
const { authenticate: authMiddleware } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();
let riderLocations = new Map();
let activeDeliveries = new Map();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/delivery-app', express.static(path.join(__dirname, '../delivery-app')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/user', userRoutes);

// Protected admin routes
app.use('/api/admin', authMiddleware);
app.get('/api/admin/dashboard', (req, res) => {
    // Mock dashboard data
    res.json({
        stats: {
            totalProducts: 1234,
            totalOrders: 567,
            totalRevenue: 45678,
            totalUsers: 890
        },
        salesData: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            data: [12000, 19000, 15000, 25000, 22000, 30000]
        },
        orderStatusData: {
            pending: 45,
            confirmed: 120,
            shipped: 89,
            delivered: 234
        }
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Serve delivery app
app.get('/delivery-app/rider.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../delivery-app/rider.html'));
});

app.get('/delivery-app/driver.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../delivery-app/driver.html'));
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            handleWebSocketMessage(ws, data);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        // Remove client from active connections
        for (const [id, client] of clients.entries()) {
            if (client.ws === ws) {
                clients.delete(id);
                riderLocations.delete(id);
                break;
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to AAGAM real-time server'
    }));
});

// Handle WebSocket messages
function handleWebSocketMessage(ws, data) {
    console.log('Received WebSocket message:', data.type);

    switch (data.type) {
        case 'rider_auth':
            handleRiderAuth(ws, data);
            break;
        case 'admin_auth':
            handleAdminAuth(ws, data);
            break;
        case 'location_update':
            handleLocationUpdate(ws, data);
            break;
        case 'status_change':
            handleStatusChange(ws, data);
            break;
        case 'accept_delivery':
            handleAcceptDelivery(ws, data);
            break;
        case 'complete_delivery':
            handleCompleteDelivery(ws, data);
            break;
        case 'heartbeat':
            handleHeartbeat(ws, data);
            break;
        case 'report_issue':
            handleReportIssue(ws, data);
            break;
        case 'emergency_stop':
            handleEmergencyStop(ws, data);
            break;
        case 'optimize_routes':
            handleOptimizeRoutes(ws, data);
            break;
        case 'product_stock_changed':
            handleProductStockChanged(ws, data);
            break;
        case 'inventory_updated':
            handleInventoryUpdated(ws, data);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

// Handle rider authentication
function handleRiderAuth(ws, data) {
    const riderId = data.riderId || `rider_${Date.now()}`;
    clients.set(riderId, { ws, riderId, status: 'offline', lastSeen: Date.now() });

    ws.send(JSON.stringify({
        type: 'auth_success',
        riderId: riderId,
        status: 'offline'
    }));

    console.log(`Rider ${riderId} authenticated`);
}

// Handle location updates
function handleLocationUpdate(ws, data) {
    const rider = getRiderByWs(ws);
    if (rider) {
        riderLocations.set(rider.riderId, {
            ...data.location,
            timestamp: Date.now(),
            riderId: rider.riderId
        });

        // Broadcast location to admin dashboard if needed
        broadcastToAdmins({
            type: 'rider_location_update',
            riderId: rider.riderId,
            location: data.location
        });
    }
}

// Handle status changes
function handleStatusChange(ws, data) {
    const rider = getRiderByWs(ws);
    if (rider) {
        rider.status = data.status;
        rider.lastSeen = Date.now();

        // Notify admin of status change
        broadcastToAdmins({
            type: 'rider_status_change',
            riderId: rider.riderId,
            status: data.status
        });

        // Confirm status change to rider
        ws.send(JSON.stringify({
            type: 'status_update',
            status: data.status,
            timestamp: Date.now()
        }));

        // If rider goes online, send available deliveries
        if (data.status === 'online') {
            sendAvailableDeliveries(ws);
        }
    }
}

// Handle delivery acceptance
function handleAcceptDelivery(ws, data) {
    const rider = getRiderByWs(ws);
    if (rider) {
        // Mark delivery as accepted
        activeDeliveries.set(data.deliveryId, {
            riderId: rider.riderId,
            status: 'accepted',
            acceptedAt: Date.now()
        });

        // Notify rider
        ws.send(JSON.stringify({
            type: 'delivery_accepted',
            deliveryId: data.deliveryId
        }));

        // Notify admin
        broadcastToAdmins({
            type: 'delivery_accepted',
            deliveryId: data.deliveryId,
            riderId: rider.riderId
        });

        // Simulate delivery progress updates
        simulateDeliveryProgress(data.deliveryId, rider.riderId);
    }
}

// Handle delivery completion
function handleCompleteDelivery(ws, data) {
    const rider = getRiderByWs(ws);
    if (rider) {
        // Mark delivery as completed
        const delivery = activeDeliveries.get(data.deliveryId);
        if (delivery) {
            delivery.status = 'completed';
            delivery.completedAt = Date.now();
        }

        // Notify rider
        ws.send(JSON.stringify({
            type: 'delivery_completed',
            deliveryId: data.deliveryId,
            earnings: Math.floor(Math.random() * 100) + 50 // Mock earnings
        }));

        // Notify admin
        broadcastToAdmins({
            type: 'delivery_completed',
            deliveryId: data.deliveryId,
            riderId: rider.riderId
        });
    }
}

// Handle heartbeat
function handleHeartbeat(ws, data) {
    const rider = getRiderByWs(ws);
    if (rider) {
        rider.lastSeen = Date.now();
    }
}

// Handle issue reporting
function handleReportIssue(ws, data) {
    console.log('Issue reported:', data);
    broadcastToAdmins({
        type: 'issue_reported',
        issue: data.issue,
        riderId: data.riderId,
        location: data.location
    });
}

// Handle emergency stop
function handleEmergencyStop(ws, data) {
    console.log('Emergency stop activated by:', data.riderId);
    broadcastToAdmins({
        type: 'emergency_alert',
        message: `Emergency stop activated by rider ${data.riderId}`,
        riderId: data.riderId
    });
}

// Handle route optimization
function handleOptimizeRoutes(ws, data) {
    // Simulate route optimization
    setTimeout(() => {
        ws.send(JSON.stringify({
            type: 'routes_optimized',
            message: 'Routes optimized successfully'
        }));
    }, 2000);
}

// Send available deliveries to rider
function sendAvailableDeliveries(ws) {
    const mockDeliveries = generateMockDeliveries();
    mockDeliveries.forEach(delivery => {
        setTimeout(() => {
            ws.send(JSON.stringify({
                type: 'new_delivery',
                delivery: delivery
            }));
        }, Math.random() * 5000); // Random delay up to 5 seconds
    });
}

// Generate mock deliveries
function generateMockDeliveries() {
    const deliveries = [];
    const customers = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];
    const addresses = [
        '123 Main Street, Apartment 4B, Downtown',
        '456 Oak Avenue, Building C, Floor 2',
        '789 Pine Road, Villa 15',
        '321 Elm Street, Block A, Floor 3',
        '654 Maple Drive, House 12'
    ];
    const items = [
        [{ name: 'Aashirvaad Atta', quantity: 2 }, { name: 'Fresh Milk', quantity: 1 }],
        [{ name: 'Fresh Vegetables', quantity: 3 }, { name: 'Milk Pack', quantity: 1 }],
        [{ name: 'Grocery Items', quantity: 2 }, { name: 'Fruit Basket', quantity: 1 }],
        [{ name: 'Rice Pack', quantity: 1 }, { name: 'Cooking Oil', quantity: 1 }],
        [{ name: 'Snacks Pack', quantity: 5 }, { name: 'Soft Drinks', quantity: 2 }]
    ];

    for (let i = 0; i < 3; i++) {
        const deliveryId = `ORD${Date.now()}${i}`;
        deliveries.push({
            id: deliveryId,
            customerName: customers[Math.floor(Math.random() * customers.length)],
            address: addresses[Math.floor(Math.random() * addresses.length)],
            items: items[Math.floor(Math.random() * items.length)],
            total: Math.floor(Math.random() * 300) + 100,
            distance: Math.floor(Math.random() * 10) + 2,
            customerPhone: '+91' + Math.floor(Math.random() * 9000000000 + 1000000000)
        });
    }

    return deliveries;
}

// Simulate delivery progress
function simulateDeliveryProgress(deliveryId, riderId) {
    const stages = ['picked_up', 'out_for_delivery', 'arrived'];
    let currentStage = 0;

    const progressInterval = setInterval(() => {
        if (currentStage < stages.length) {
            const rider = Array.from(clients.values()).find(c => c.riderId === riderId);
            if (rider && rider.ws.readyState === WebSocket.OPEN) {
                rider.ws.send(JSON.stringify({
                    type: 'delivery_update',
                    deliveryId: deliveryId,
                    status: stages[currentStage],
                    timestamp: Date.now()
                }));
            }
            currentStage++;
        } else {
            clearInterval(progressInterval);
        }
    }, 10000); // Update every 10 seconds
}

// Handle admin authentication
function handleAdminAuth(ws, data) {
    const adminId = data.adminId || `admin_${Date.now()}`;
    clients.set(adminId, { ws, adminId, type: 'admin', lastSeen: Date.now() });

    ws.send(JSON.stringify({
        type: 'admin_auth_success',
        adminId: adminId,
        message: 'Admin authenticated successfully'
    }));

    console.log(`Admin ${adminId} authenticated`);
}

// Handle product stock changes
function handleProductStockChanged(ws, data) {
    // Broadcast stock change to all connected clients (frontend and other admins)
    broadcastToAll({
        type: 'product_stock_changed',
        productId: data.productId,
        newStock: data.newStock,
        adjustment: data.adjustment || 0
    });

    console.log(`Product ${data.productId} stock changed to ${data.newStock}`);
}

// Handle inventory updates
function handleInventoryUpdated(ws, data) {
    // Broadcast inventory update to all connected clients
    broadcastToAll({
        type: 'inventory_updated',
        inventory: data.inventory
    });

    console.log('Inventory updated and broadcasted to all clients');
}

// Utility functions
function getRiderByWs(ws) {
    for (const [id, client] of clients.entries()) {
        if (client.ws === ws) {
            return client;
        }
    }
    return null;
}

function broadcastToAdmins(message) {
    // In a real app, you'd check for admin clients
    // For now, just log the message
    console.log('Broadcasting to admins:', message);
}

function broadcastToAll(message) {
    // Broadcast to all connected WebSocket clients
    for (const [id, client] of clients.entries()) {
        if (client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error(`Error sending message to client ${id}:`, error);
            }
        }
    }
    console.log('Message broadcasted to all clients:', message.type);
}

// Periodic tasks
setInterval(() => {
    // Clean up inactive riders
    const now = Date.now();
    for (const [id, client] of clients.entries()) {
        if (now - client.lastSeen > 300000) { // 5 minutes
            clients.delete(id);
            riderLocations.delete(id);
            console.log(`Removed inactive rider: ${id}`);
        }
    }

    // Send earnings updates to online riders
    for (const [id, client] of clients.entries()) {
        if (client.status === 'online' && client.ws.readyState === WebSocket.OPEN) {
            const earnings = {
                today: Math.floor(Math.random() * 500) + 800,
                week: Math.floor(Math.random() * 3000) + 5000,
                month: Math.floor(Math.random() * 12000) + 20000
            };

            client.ws.send(JSON.stringify({
                type: 'earnings_update',
                earnings: earnings
            }));
        }
    }
}, 60000); // Every minute

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

server.listen(PORT, () => {
    console.log(`AAGAM Real-Time Server running on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/admin`);
    console.log(`Rider App: http://localhost:${PORT}/delivery-app/rider.html`);
    console.log(`Driver App: http://localhost:${PORT}/delivery-app/driver.html`);
});

module.exports = app;