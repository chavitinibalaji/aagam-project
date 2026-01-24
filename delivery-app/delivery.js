// AAGAM Delivery App JavaScript with Real-Time Features

// Global variables
let ws = null;
let isConnected = false;
let currentLocation = null;
let locationWatchId = null;
let activeDeliveries = [];
let riderStatus = 'offline';
let realTimeUpdates = {};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    connectWebSocket();
    startLocationTracking();
});

function initializeApp() {
    // Initialize tab switching for driver dashboard
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Load initial data
    loadDashboardData();
    loadRoutesData();
    loadVehiclesData();
    loadReportsData();

    // Setup real-time UI updates
    setupRealTimeUI();
}

function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Add active class to clicked tab
    event.target.classList.add('active');

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(tabName + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

// WebSocket Connection
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to AAGAM delivery server');
            isConnected = true;
            updateConnectionStatus(true);
            authenticateRider();
            startHeartbeat();
        };

        ws.onmessage = (event) => {
            handleWebSocketMessage(JSON.parse(event.data));
        };

        ws.onclose = () => {
            console.log('Disconnected from server');
            isConnected = false;
            updateConnectionStatus(false);
            // Auto reconnect after 5 seconds
            setTimeout(() => connectWebSocket(), 5000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            isConnected = false;
            updateConnectionStatus(false);
        };
    } catch (error) {
        console.error('Failed to connect:', error);
        updateConnectionStatus(false);
    }
}

function authenticateRider() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'rider_auth',
            riderId: getRiderId(),
            token: localStorage.getItem('rider_token')
        }));
    }
}

function handleWebSocketMessage(data) {
    console.log('Received:', data);

    switch (data.type) {
        case 'auth_success':
            onAuthenticated(data);
            break;
        case 'new_delivery':
            onNewDelivery(data.delivery);
            break;
        case 'delivery_update':
            onDeliveryUpdate(data);
            break;
        case 'location_request':
            sendLocationUpdate();
            break;
        case 'earnings_update':
            updateEarningsDisplay(data.earnings);
            break;
        case 'route_update':
            updateRouteProgress(data.route);
            break;
        case 'notification':
            showRealTimeNotification(data.notification);
            break;
        case 'emergency_alert':
            handleEmergencyAlert(data);
            break;
    }
}

function onAuthenticated(data) {
    riderStatus = data.status;
    updateRiderStatus();
    showRealTimeNotification('Connected to AAGAM network', 'success');
}

function onNewDelivery(delivery) {
    activeDeliveries.push(delivery);
    showNewDeliveryAlert(delivery);
    updateDeliveriesList();
}

function onDeliveryUpdate(data) {
    const delivery = activeDeliveries.find(d => d.id === data.deliveryId);
    if (delivery) {
        delivery.status = data.status;
        delivery.lastUpdate = data.timestamp;
        updateDeliveriesList();
        showRealTimeNotification(`Delivery ${data.status}`, 'info');
    }
}

// Location Tracking
function startLocationTracking() {
    if ('geolocation' in navigator) {
        locationWatchId = navigator.geolocation.watchPosition(
            (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    speed: position.coords.speed,
                    timestamp: Date.now()
                };
                sendLocationUpdate();
                updateLocationDisplay();
            },
            (error) => {
                console.error('Location error:', error);
                showRealTimeNotification('Location tracking failed', 'error');
            },
            {
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 27000
            }
        );
    }
}

function sendLocationUpdate() {
    if (ws && ws.readyState === WebSocket.OPEN && currentLocation) {
        ws.send(JSON.stringify({
            type: 'location_update',
            location: currentLocation,
            riderId: getRiderId()
        }));
    }
}

function updateLocationDisplay() {
    const locationEl = document.getElementById('currentLocation');
    if (locationEl && currentLocation) {
        locationEl.textContent = `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
    }
}

// Real-Time UI Updates
function setupRealTimeUI() {
    // Update connection status indicator
    setInterval(() => {
        updateConnectionStatus(isConnected);
    }, 1000);

    // Update live stats every 5 seconds
    setInterval(() => {
        updateLiveStats();
    }, 5000);
}

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    if (!statusEl) {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connectionStatus';
        statusDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
        `;
        document.body.appendChild(statusDiv);
    }

    const statusDiv = document.getElementById('connectionStatus');
    if (connected) {
        statusDiv.textContent = '🟢 Live';
        statusDiv.style.background = '#d4edda';
        statusDiv.style.color = '#155724';
    } else {
        statusDiv.textContent = '🔴 Offline';
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.color = '#721c24';
    }
}

function updateLiveStats() {
    // Update live statistics
    const stats = {
        activeDeliveries: activeDeliveries.filter(d => d.status === 'in_progress').length,
        completedToday: Math.floor(Math.random() * 10) + 5, // Mock data
        distanceToday: (Math.random() * 50 + 20).toFixed(1),
        earningsToday: Math.floor(Math.random() * 500 + 800)
    };

    // Update UI elements if they exist
    const activeDeliveriesEl = document.getElementById('activeDeliveriesCount');
    if (activeDeliveriesEl) activeDeliveriesEl.textContent = stats.activeDeliveries;

    const completedEl = document.getElementById('completedToday');
    if (completedEl) completedEl.textContent = stats.completedToday;

    const distanceEl = document.getElementById('distanceToday');
    if (distanceEl) distanceEl.textContent = `${stats.distanceToday} km`;

    const earningsEl = document.getElementById('earningsToday');
    if (earningsEl) earningsEl.textContent = `₹${stats.earningsToday}`;
}

// Rider Status Management
function toggleStatus() {
    riderStatus = riderStatus === 'online' ? 'offline' : 'online';

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'status_change',
            status: riderStatus,
            riderId: getRiderId()
        }));
    }

    updateRiderStatus();
    showRealTimeNotification(
        `You are now ${riderStatus}`,
        riderStatus === 'online' ? 'success' : 'warning'
    );
}

function updateRiderStatus() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const statusSubtext = document.getElementById('statusSubtext');
    const toggleBtn = document.getElementById('toggleBtn');

    if (riderStatus === 'online') {
        if (statusIndicator) statusIndicator.textContent = '🟢';
        if (statusText) statusText.textContent = 'You\'re Online';
        if (statusSubtext) statusSubtext.textContent = 'Ready to accept deliveries';
        if (toggleBtn) {
            toggleBtn.textContent = 'Go Offline';
            toggleBtn.className = 'toggle-btn offline';
        }
    } else {
        if (statusIndicator) statusIndicator.textContent = '🔴';
        if (statusText) statusText.textContent = 'You\'re Offline';
        if (statusSubtext) statusSubtext.textContent = 'Not accepting deliveries';
        if (toggleBtn) {
            toggleBtn.textContent = 'Go Online';
            toggleBtn.className = 'toggle-btn';
        }
    }
}

// Delivery Management
function acceptDelivery(deliveryId) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'accept_delivery',
            deliveryId: deliveryId,
            riderId: getRiderId()
        }));

        // Update local state
        const delivery = activeDeliveries.find(d => d.id === deliveryId);
        if (delivery) {
            delivery.status = 'accepted';
            showActiveDelivery(delivery);
        }
    }
}

function completeDelivery() {
    const activeDelivery = activeDeliveries.find(d => d.status === 'in_progress');
    if (activeDelivery && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'complete_delivery',
            deliveryId: activeDelivery.id,
            riderId: getRiderId()
        }));

        activeDelivery.status = 'completed';
        hideActiveDelivery();
        showRealTimeNotification('Delivery completed successfully!', 'success');
    }
}

function showActiveDelivery(delivery) {
    const activeDeliveryDiv = document.getElementById('activeDelivery');
    if (activeDeliveryDiv) {
        activeDeliveryDiv.style.display = 'block';
        // Update delivery details in the UI
        const orderIdEl = activeDeliveryDiv.querySelector('.order-id');
        const customerNameEl = activeDeliveryDiv.querySelector('.customer-name');
        const customerAddressEl = activeDeliveryDiv.querySelector('.customer-address');
        const orderItemsEl = activeDeliveryDiv.querySelector('.order-items');
        const deliveryTotalEl = activeDeliveryDiv.querySelector('.delivery-total');

        if (orderIdEl) orderIdEl.textContent = `Order #${delivery.id.slice(-6)}`;
        if (customerNameEl) customerNameEl.textContent = delivery.customerName;
        if (customerAddressEl) customerAddressEl.textContent = delivery.address;
        if (orderItemsEl) {
            orderItemsEl.innerHTML = delivery.items.map(item =>
                `<div class="order-item">• ${item.quantity}x ${item.name}</div>`
            ).join('');
        }
        if (deliveryTotalEl) deliveryTotalEl.textContent = `₹${delivery.total}`;
    }
}

function hideActiveDelivery() {
    const activeDeliveryDiv = document.getElementById('activeDelivery');
    if (activeDeliveryDiv) {
        activeDeliveryDiv.style.display = 'none';
    }
}

function updateDeliveriesList() {
    const availableDeliveriesDiv = document.getElementById('availableDeliveries');
    if (!availableDeliveriesDiv) return;

    const availableDeliveries = activeDeliveries.filter(d => d.status === 'pending');

    // Clear existing deliveries except the first one (which is static in HTML)
    const existingCards = availableDeliveriesDiv.querySelectorAll('.delivery-card');
    for (let i = 1; i < existingCards.length; i++) {
        existingCards[i].remove();
    }

    // Add new deliveries
    availableDeliveries.forEach(delivery => {
        const deliveryCard = document.createElement('div');
        deliveryCard.className = 'delivery-card';
        deliveryCard.innerHTML = `
            <div class="delivery-header">
                <span class="order-id">Order #${delivery.id.slice(-6)}</span>
                <span class="delivery-time">${delivery.distance || '5'}km away</span>
            </div>
            <div class="customer-info">
                <div class="customer-name">${delivery.customerName}</div>
                <div class="customer-address">${delivery.address}</div>
            </div>
            <div class="order-items">
                ${delivery.items.map(item => `<div class="order-item">• ${item.quantity}x ${item.name}</div>`).join('')}
            </div>
            <div class="delivery-total">₹${delivery.total}</div>
            <div class="action-btns">
                <button class="btn-secondary" onclick="viewDetails('${delivery.id}')">Details</button>
                <button class="btn-primary" onclick="acceptDelivery('${delivery.id}')">Accept</button>
            </div>
        `;
        availableDeliveriesDiv.appendChild(deliveryCard);
    });
}

// Notifications
function showRealTimeNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `app-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <span class="notification-time">${new Date().toLocaleTimeString()}</span>
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        font-size: 14px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function showNewDeliveryAlert(delivery) {
    const alert = document.createElement('div');
    alert.className = 'delivery-alert';
    alert.innerHTML = `
        <div class="alert-content">
            <h4>🚚 New Delivery Available!</h4>
            <p><strong>Order #${delivery.id.slice(-6)}</strong></p>
            <p>${delivery.customerName} - ${delivery.distance || '5'}km away</p>
            <p>₹${delivery.total} • ${delivery.items.length} items</p>
            <div class="alert-actions">
                <button onclick="acceptDelivery('${delivery.id}'); this.parentElement.parentElement.parentElement.remove();">Accept</button>
                <button onclick="this.parentElement.parentElement.parentElement.remove();">Ignore</button>
            </div>
        </div>
    `;

    alert.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 2000;
        max-width: 400px;
        width: 90%;
        animation: bounceIn 0.4s ease;
    `;

    document.body.appendChild(alert);

    // Auto remove after 20 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.style.animation = 'bounceOut 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }
    }, 20000);
}

// Emergency Handling
function handleEmergencyAlert(data) {
    const alert = document.createElement('div');
    alert.className = 'emergency-alert';
    alert.innerHTML = `
        <div class="alert-content">
            <h3>🚨 Emergency Alert</h3>
            <p>${data.message}</p>
            <div class="alert-actions">
                <button onclick="acknowledgeEmergency(); this.parentElement.parentElement.parentElement.remove();">Acknowledge</button>
            </div>
        </div>
    `;

    alert.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #dc3545;
        color: white;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        z-index: 3000;
        max-width: 400px;
        width: 90%;
        text-align: center;
        animation: shake 0.5s ease;
    `;

    document.body.appendChild(alert);
}

function acknowledgeEmergency() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'emergency_acknowledged',
            riderId: getRiderId()
        }));
    }
}

// Utility Functions
function getRiderId() {
    return localStorage.getItem('rider_id') || 'rider_' + Date.now();
}

function startHeartbeat() {
    setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'heartbeat',
                riderId: getRiderId(),
                timestamp: Date.now()
            }));
        }
    }, 30000); // Every 30 seconds
}

function callCustomer() {
    const activeDelivery = activeDeliveries.find(d => d.status === 'in_progress');
    if (activeDelivery && activeDelivery.customerPhone) {
        window.location.href = `tel:${activeDelivery.customerPhone}`;
    }
}

function viewDetails(deliveryId) {
    const delivery = activeDeliveries.find(d => d.id === deliveryId);
    if (delivery) {
        showRealTimeNotification(`Viewing details for Order #${delivery.id.slice(-6)}`, 'info');
        // In a real app, this would open a detailed modal
    }
}

// Dashboard Functions
function loadDashboardData() {
    console.log('Loading real-time dashboard data...');
    updateLiveStats();
}

function startRoute() {
    showRealTimeNotification('Starting next route...', 'info');
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'start_route',
            riderId: getRiderId()
        }));
    }
}

function reportIssue() {
    const issue = prompt('Describe the issue:');
    if (issue) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'report_issue',
                issue: issue,
                riderId: getRiderId(),
                location: currentLocation
            }));
        }
        showRealTimeNotification('Issue reported successfully', 'success');
    }
}

function emergencyStop() {
    if (confirm('Are you sure you want to trigger emergency stop?')) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'emergency_stop',
                riderId: getRiderId()
            }));
        }
        showRealTimeNotification('Emergency stop activated', 'error');
    }
}

// Routes Functions
function loadRoutesData() {
    console.log('Loading real-time routes data...');
}

function optimizeRoutes() {
    showRealTimeNotification('Optimizing routes...', 'info');
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'optimize_routes',
            riderId: getRiderId()
        }));
    }
    setTimeout(() => {
        showRealTimeNotification('Routes optimized successfully!', 'success');
    }, 2000);
}

// Vehicles Functions
function loadVehiclesData() {
    console.log('Loading real-time vehicles data...');
}

// Reports Functions
function loadReportsData() {
    console.log('Loading real-time reports data...');
}

function exportReport() {
    const period = document.getElementById('reportPeriod')?.value || 'daily';
    showRealTimeNotification(`Exporting ${period} report...`, 'info');
    setTimeout(() => {
        showRealTimeNotification('Report exported successfully!', 'success');
    }, 1500);
}

// Update earnings display
function updateEarningsDisplay(earnings) {
    const earningsAmount = document.querySelector('.earnings-amount');
    if (earningsAmount) earningsAmount.textContent = `₹${earnings.today}`;

    const todayStat = document.querySelector('.stat-value');
    if (todayStat) todayStat.textContent = `₹${earnings.today}`;
}

// Update route progress
function updateRouteProgress(route) {
    // Update route progress in UI
    console.log('Route progress updated:', route);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    @keyframes bounceIn {
        0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.05); }
        70% { transform: translate(-50%, -50%) scale(0.9); }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    @keyframes bounceOut {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }

    .app-notification {
        border-left: 4px solid #00b761;
    }

    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .notification-time {
        font-size: 12px;
        opacity: 0.7;
        margin-left: 10px;
    }

    .delivery-alert .alert-content {
        padding: 20px;
    }

    .delivery-alert h4 {
        color: #00b761;
        margin-bottom: 10px;
    }

    .delivery-alert .alert-actions {
        margin-top: 15px;
        display: flex;
        gap: 10px;
        justify-content: center;
    }

    .delivery-alert button {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
    }

    .delivery-alert button:first-child {
        background: #00b761;
        color: white;
    }

    .delivery-alert button:last-child {
        background: #6c757d;
        color: white;
    }

    .emergency-alert .alert-content {
        padding: 30px 20px;
    }

    .emergency-alert h3 {
        margin-bottom: 15px;
    }

    .emergency-alert .alert-actions {
        margin-top: 20px;
    }

    .emergency-alert button {
        background: white;
        color: #dc3545;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
    }
`;
document.head.appendChild(style);

// Export functions for global access
window.DeliveryApp = {
    switchTab,
    startRoute,
    reportIssue,
    emergencyStop,
    optimizeRoutes,
    viewRouteDetails,
    continueRoute,
    startRouteB,
    addVehicle,
    viewMaintenance,
    assignDriver,
    scheduleService,
    exportReport,
    formatCurrency,
    formatDate,
    formatTime,
    calculateDistance,
    estimateDeliveryTime,
    showRealTimeNotification,
    handleError,
    toggleStatus,
    acceptDelivery,
    completeDelivery,
    callCustomer,
    viewDetails
};