// Profile Management JavaScript
class ProfileManager {
    constructor() {
        this.user = null;
        this.init();
    }

    init() {
        this.loadUserProfile();
        this.setupEventListeners();
        this.loadAccountInfo();
    }

    // Load user profile data
    async loadUserProfile() {
        try {
            // Get user data from localStorage or API
            const userData = JSON.parse(localStorage.getItem('user') || '{}');

            if (userData.id) {
                // Load from API if user is logged in
                const response = await fetch('/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    this.user = await response.json();
                } else {
                    this.user = userData;
                }
            } else {
                // Mock data for demo
                this.user = {
                    id: 1,
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                    phone: '+91 9876543210',
                    dateOfBirth: '1990-01-01',
                    gender: 'male',
                    createdAt: '2024-01-15',
                    totalOrders: 12,
                    notifications: {
                        orderUpdates: true,
                        promotionalOffers: false,
                        deliveryAlerts: true,
                        weeklyNewsletter: false,
                        smsNotifications: true
                    }
                };
            }

            this.populateProfileForm();
            this.updateProfileHeader();
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showError('Failed to load profile data');
        }
    }

    // Populate profile form with user data
    populateProfileForm() {
        if (!this.user) return;

        // Personal info
        document.getElementById('name').value = this.user.name || '';
        document.getElementById('email').value = this.user.email || '';
        document.getElementById('phone').value = this.user.phone || '';
        document.getElementById('dateOfBirth').value = this.user.dateOfBirth || '';
        document.getElementById('gender').value = this.user.gender || '';

        // Account info
        document.getElementById('memberSince').textContent = this.formatDate(this.user.createdAt);
        document.getElementById('totalOrders').textContent = this.user.totalOrders || 0;

        // Notifications
        if (this.user.notifications) {
            document.getElementById('orderUpdates').checked = this.user.notifications.orderUpdates;
            document.getElementById('promotionalOffers').checked = this.user.notifications.promotionalOffers;
            document.getElementById('deliveryAlerts').checked = this.user.notifications.deliveryAlerts;
            document.getElementById('weeklyNewsletter').checked = this.user.notifications.weeklyNewsletter;
            document.getElementById('smsNotifications').checked = this.user.notifications.smsNotifications;
        }
    }

    // Update profile header
    updateProfileHeader() {
        if (!this.user) return;

        const fullName = this.user.name || 'User';
        document.getElementById('profileName').textContent = fullName;
        document.getElementById('profileEmail').textContent = this.user.email || '';

        // Set avatar initial
        const initial = fullName.charAt(0).toUpperCase() || 'U';
        document.getElementById('profileAvatar').textContent = initial;
    }

    // Load account information
    async loadAccountInfo() {
        try {
            // In a real app, this would fetch from API
            const accountInfo = {
                memberSince: this.user?.createdAt || '2024-01-15',
                totalOrders: this.user?.totalOrders || 0,
                accountStatus: this.user?.status || 'Active'
            };

            document.getElementById('memberSince').textContent = this.formatDate(accountInfo.memberSince);
            document.getElementById('totalOrders').textContent = accountInfo.totalOrders;
            document.getElementById('accountStatus').textContent = accountInfo.accountStatus;
        } catch (error) {
            console.error('Error loading account info:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Personal info form
        document.getElementById('personalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePersonalInfo();
        });

        // Password change form
        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });

        // Notifications form
        document.getElementById('notificationsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNotificationPreferences();
        });
    }

    // Save personal information
    async savePersonalInfo() {
        try {
            const formData = new FormData(document.getElementById('personalForm'));
            const personalData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                dateOfBirth: formData.get('dateOfBirth'),
                gender: formData.get('gender')
            };

            // Validate required fields
            if (!personalData.name || !personalData.email) {
                this.showError('Please fill in all required fields');
                return;
            }

            // Update local user data
            this.user = { ...this.user, ...personalData };
            localStorage.setItem('user', JSON.stringify(this.user));

            // Send to API
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(personalData)
            });

            if (response.ok) {
                const result = await response.json();
                this.user = result.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                this.updateProfileHeader();
                this.showSuccess('Profile updated successfully!');
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error saving personal info:', error);
            this.showError('Failed to save profile changes');
        }
    }

    // Change password
    async changePassword() {
        try {
            const formData = new FormData(document.getElementById('passwordForm'));
            const passwordData = {
                currentPassword: formData.get('currentPassword'),
                newPassword: formData.get('newPassword'),
                confirmPassword: formData.get('confirmPassword')
            };

            // Validate passwords
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                this.showError('New passwords do not match');
                return;
            }

            if (passwordData.newPassword.length < 6) {
                this.showError('Password must be at least 6 characters long');
                return;
            }

            // In a real app, send to API
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (response.ok) {
                document.getElementById('passwordForm').reset();
                this.showSuccess('Password changed successfully!');
            } else {
                const error = await response.json();
                this.showError(error.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showError('Failed to change password');
        }
    }

    // Save notification preferences
    async saveNotificationPreferences() {
        try {
            const preferences = {
                orderUpdates: document.getElementById('orderUpdates').checked,
                promotionalOffers: document.getElementById('promotionalOffers').checked,
                deliveryAlerts: document.getElementById('deliveryAlerts').checked,
                weeklyNewsletter: document.getElementById('weeklyNewsletter').checked,
                smsNotifications: document.getElementById('smsNotifications').checked
            };

            // Update local user data
            if (this.user) {
                this.user.notifications = preferences;
                localStorage.setItem('user', JSON.stringify(this.user));
            }

            // In a real app, send to API
            const response = await fetch('/api/auth/notifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(preferences)
            });

            if (response.ok) {
                this.showSuccess('Notification preferences saved!');
            } else {
                throw new Error('Failed to save preferences');
            }
        } catch (error) {
            console.error('Error saving notification preferences:', error);
            this.showError('Failed to save notification preferences');
        }
    }

    // Switch between tabs
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName + 'Tab').classList.add('active');

        // Add active class to clicked button
        event.target.classList.add('active');
    }

    // Utility functions
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Global function for HTML onclick
function switchTab(tabName) {
    if (window.profileManager) {
        window.profileManager.switchTab(tabName);
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .toast {
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
    }
`;
document.head.appendChild(style);