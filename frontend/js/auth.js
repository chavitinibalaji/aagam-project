// Authentication Service for AAGAM Frontend
class AuthService {
    constructor() {
        this.api = window.api || new ApiService();
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('aagam_token');
    }

    // Get current user
    getCurrentUser() {
        const user = localStorage.getItem('aagam_user');
        return user ? JSON.parse(user) : null;
    }

    // Login user
    async login(email, password) {
        try {
            const response = await this.api.login({ email, password });

            // Update UI
            this.updateUI();

            // Show success message
            this.showMessage('Login successful!', 'success');

            // Redirect based on user role
            const user = this.getCurrentUser();
            if (user.role === 'admin') {
                window.location.href = '/admin/index.html';
            } else {
                window.location.href = '/index.html';
            }

            return response;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    // Register user
    async register(userData) {
        try {
            const response = await this.api.register(userData);

            // Update UI
            this.updateUI();

            // Show success message
            this.showMessage('Registration successful!', 'success');

            // Redirect to home
            window.location.href = '/index.html';

            return response;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    // Logout user
    logout() {
        this.api.logout();
        this.updateUI();
        this.showMessage('Logged out successfully', 'success');
        window.location.href = '/index.html';
    }

    // Update user profile
    async updateProfile(userData) {
        try {
            const response = await this.api.updateProfile(userData);

            // Update stored user data
            localStorage.setItem('aagam_user', JSON.stringify(response.user));

            this.showMessage('Profile updated successfully!', 'success');
            return response;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    // Check authentication status and redirect if needed
    checkAuthStatus() {
        const currentPath = window.location.pathname;

        // Pages that require authentication
        const protectedPages = ['/cart.html', '/checkout.html', '/orders.html'];

        // Admin pages
        const adminPages = ['/admin/index.html'];

        if (protectedPages.some(page => currentPath.includes(page)) && !this.isAuthenticated()) {
            this.showMessage('Please login to continue', 'warning');
            window.location.href = '/login.html';
            return;
        }

        if (adminPages.some(page => currentPath.includes(page))) {
            const user = this.getCurrentUser();
            if (!this.isAuthenticated() || user?.role !== 'admin') {
                this.showMessage('Access denied. Admin privileges required.', 'error');
                window.location.href = '/index.html';
                return;
            }
        }
    }

    // Update UI based on authentication status
    updateUI() {
        const user = this.getCurrentUser();
        const isAuth = this.isAuthenticated();

        // Update header component if it exists
        const header = document.querySelector('aagam-header');
        if (header) {
            header.setAttribute('authenticated', isAuth.toString());
            if (user) {
                header.setAttribute('user', JSON.stringify(user));
            }
        }

        // Update any auth-dependent elements
        this.updateAuthElements();
    }

    // Update authentication-dependent elements
    updateAuthElements() {
        const user = this.getCurrentUser();

        // Update user name displays
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = user ? user.name : '';
        });

        // Update user email displays
        const userEmailElements = document.querySelectorAll('.user-email');
        userEmailElements.forEach(el => {
            el.textContent = user ? user.email : '';
        });

        // Show/hide authenticated content
        const authOnlyElements = document.querySelectorAll('.auth-only');
        authOnlyElements.forEach(el => {
            el.style.display = user ? 'block' : 'none';
        });

        const guestOnlyElements = document.querySelectorAll('.guest-only');
        guestOnlyElements.forEach(el => {
            el.style.display = user ? 'none' : 'block';
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(loginForm);
                const email = formData.get('email');
                const password = formData.get('password');

                try {
                    await this.login(email, password);
                } catch (error) {
                    // Error already handled in login method
                }
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(registerForm);
                const userData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    password: formData.get('password')
                };

                try {
                    await this.register(userData);
                } catch (error) {
                    // Error already handled in register method
                }
            });
        }

        // Logout buttons
        const logoutButtons = document.querySelectorAll('.logout-btn');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', () => this.logout());
        });

        // Profile update form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(profileForm);
                const userData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone')
                };

                try {
                    await this.updateProfile(userData);
                } catch (error) {
                    // Error already handled in updateProfile method
                }
            });
        }
    }

    // Show message to user
    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.innerHTML = `
            <div class="message-content">
                <span class="message-text">${message}</span>
                <button class="message-close">&times;</button>
            </div>
        `;

        // Add styles
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;

        // Add to page
        document.body.appendChild(messageEl);

        // Setup close button
        const closeBtn = messageEl.querySelector('.message-close');
        closeBtn.addEventListener('click', () => {
            messageEl.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => messageEl.remove(), 300);
            }
        }, 5000);
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    validatePassword(password) {
        return password.length >= 6;
    }

    // Validate phone number
    validatePhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone);
    }
}

// Initialize auth service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new AuthService();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}