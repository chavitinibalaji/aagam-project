// Admin Authentication and Session Management

// Check if admin is logged in
function checkAdminAuth() {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (!adminToken || !adminUser) {
        // Redirect to login page (for now, just show alert)
        alert('Please login as admin first');
        // window.location.href = 'login.html';
        return false;
    }

    // In a real app, validate token with server
    return true;
}

// Login function (for future login page)
function adminLogin(email, password) {
    // Mock login - in real app, this would be an API call
    if (email === 'admin@aagam.com' && password === 'admin123') {
        const token = 'admin_token_' + Date.now();
        const user = { email: email, name: 'Admin User', role: 'admin' };

        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(user));

        return { success: true, user: user };
    } else {
        return { success: false, message: 'Invalid credentials' };
    }
}

// Logout function
function adminLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    // window.location.href = 'login.html';
}

// Get current admin user
function getCurrentAdmin() {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
}

// Initialize admin session
function initAdminSession() {
    const user = getCurrentAdmin();
    if (user) {
        // Update UI with user info
        const userProfile = document.querySelector('.user-profile span:last-child');
        if (userProfile) {
            userProfile.textContent = user.name;
        }
    }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAuth()) {
        // For demo purposes, auto-login
        const loginResult = adminLogin('admin@aagam.com', 'admin123');
        if (loginResult.success) {
            initAdminSession();
        }
    } else {
        initAdminSession();
    }
});