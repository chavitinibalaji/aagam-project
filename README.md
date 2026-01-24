# AAGAM - Complete E-commerce Platform with Real-Time Delivery Tracking

A comprehensive e-commerce platform featuring customer shopping, admin management, and real-time delivery tracking with GPS location sharing and live notifications.

## 🚀 Features

### Customer Features
- **Product Catalog**: Browse products by categories with search functionality
- **Shopping Cart**: Add/remove items, quantity management, price calculations
- **User Authentication**: Login/register with JWT tokens
- **Order Management**: Place orders, track order history, reorder items
- **Checkout Process**: Address management, payment options, delivery scheduling

### Admin Features
- **Dashboard**: Sales analytics, order statistics, revenue tracking
- **Product Management**: Add, edit, delete products with image uploads
- **Order Management**: View and update order statuses
- **User Management**: Manage customer accounts and permissions

### Real-Time Delivery Features
- **GPS Tracking**: Live location sharing for delivery riders
- **WebSocket Communication**: Real-time updates between riders, drivers, and admin
- **Live Notifications**: Instant alerts for new deliveries, status changes
- **Delivery Management**: Accept/reject deliveries, track progress
- **Emergency Features**: Emergency stop, issue reporting, route optimization

### Mobile Apps
- **Android App**: Native Android application for customers
- **iOS App**: Native iOS application for customers

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Custom Web Components
- **Backend**: Node.js, Express.js, WebSocket (ws library)
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: JSON file-based (for demo purposes)
- **Real-Time**: WebSocket connections, GPS Geolocation API
- **Mobile**: Native Android (Java), iOS (Swift)

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

1. **Node.js** (version 14 or higher)
   - Download from: https://nodejs.org/
   - This will also install npm (Node Package Manager)

2. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

## 🚀 Installation & Setup

### 1. Install Node.js

Download and install Node.js from the official website: https://nodejs.org/

After installation, verify by opening a terminal/command prompt and running:
```bash
node --version
npm --version
```

### 2. Install Dependencies

Navigate to the project directory and install all required packages:

```bash
cd path/to/aagam-project
npm install
```

This will install all dependencies including:
- express (web framework)
- ws (WebSocket library)
- jsonwebtoken (JWT authentication)
- cors (cross-origin resource sharing)
- body-parser (request parsing)

### 3. Start the Server

Run the application:

```bash
npm start
```

For development with auto-restart on file changes:

```bash
npm run dev
```

The server will start on port 3000 by default.

## 🌐 Accessing the Application

Once the server is running, you can access different parts of the application:

- **Customer Frontend**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Rider Delivery App**: http://localhost:3000/delivery-app/rider.html
- **Driver Delivery App**: http://localhost:3000/delivery-app/driver.html
- **Customer Order Tracking**: http://localhost:3000/delivery-app/tracking.html

## 📱 Real-Time Features

### For Delivery Riders:
1. Open the Rider App: http://localhost:3000/delivery-app/rider.html
2. Authenticate as a rider (auto-generated ID)
3. Go online to start receiving delivery requests
4. Accept deliveries and track your location in real-time
5. Receive live notifications for new orders
6. Share your GPS location with the admin dashboard

### Real-Time Capabilities:
- **Live Location Tracking**: GPS coordinates updated every few seconds
- **Instant Notifications**: New delivery alerts, status updates
- **WebSocket Communication**: Real-time bidirectional communication
- **Emergency Features**: Emergency stop, issue reporting
- **Earnings Tracking**: Live earnings updates
- **Route Optimization**: AI-powered route suggestions

## 📂 Project Structure

```
aagam/
├── frontend/                 # Customer-facing website
│   ├── index.html           # Main homepage
│   ├── cart.html            # Shopping cart
│   ├── checkout.html        # Order checkout
│   ├── login.html           # Authentication
│   ├── orders.html          # Order history
│   ├── components/          # Reusable web components
│   ├── css/                 # Stylesheets
│   └── js/                  # JavaScript modules
├── admin/                   # Admin dashboard
│   ├── index.html
│   ├── components/
│   ├── css/
│   └── js/
├── backend/                 # Server-side code
│   ├── server.js            # Main server file with WebSocket
│   ├── routes/              # API routes
│   ├── models/              # Data models
│   ├── middleware/          # Authentication middleware
│   └── config/              # Database configuration
├── delivery-app/            # Delivery tracking system
│   ├── rider.html           # Rider dashboard
│   ├── driver.html          # Driver interface
│   ├── tracking.html        # Customer tracking
│   ├── delivery.css         # Shared styles
│   └── delivery.js          # Real-time functionality
├── mobile-app/              # Mobile applications
│   ├── android/             # Android app
│   └── ios/                 # iOS app
├── data/                    # JSON data files
├── infra/                   # Infrastructure configs
├── package.json             # Dependencies
└── README.md               # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics

## 🔒 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Tokens are stored in localStorage on the client side
- Protected routes require valid JWT tokens
- Admin routes have additional role-based access control

## 📊 Real-Time WebSocket Events

### Rider Events
- `rider_auth` - Rider authentication
- `location_update` - GPS location sharing
- `status_change` - Online/offline status
- `accept_delivery` - Accept delivery request
- `complete_delivery` - Mark delivery complete
- `heartbeat` - Connection keep-alive
- `report_issue` - Report delivery issues
- `emergency_stop` - Emergency situation

### Server Events
- `connected` - Connection established
- `auth_success` - Authentication successful
- `new_delivery` - New delivery available
- `delivery_update` - Delivery status update
- `earnings_update` - Earnings information
- `routes_optimized` - Route optimization complete

## 🐛 Troubleshooting

### Common Issues:

1. **Port 3000 already in use**
   ```bash
   # Kill process using port 3000
   npx kill-port 3000
   # Or change port in server.js
   ```

2. **WebSocket connection fails**
   - Ensure the server is running
   - Check browser console for errors
   - Verify firewall settings

3. **GPS location not working**
   - Must be accessed over HTTPS in production
   - Grant location permissions in browser
   - Test on actual mobile device for best results

4. **Dependencies installation fails**
   ```bash
   # Clear npm cache
   npm cache clean --force
   # Reinstall
   npm install
   ```

## 🚀 Deployment

### For Production:

1. **Environment Variables**:
   ```bash
   PORT=3000
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```

2. **HTTPS Required** for GPS functionality in production

3. **Database**: Replace JSON files with a proper database (MongoDB, PostgreSQL)

4. **Process Manager**: Use PM2 for production
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name "aagam-server"
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the code comments for implementation details

---

**Happy Shopping with AAGAM! 🛒**