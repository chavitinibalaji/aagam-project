// Address Management JavaScript
class AddressManager {
    constructor() {
        this.addresses = [];
        this.editingAddress = null;
        this.init();
    }

    init() {
        this.loadAddresses();
        this.setupEventListeners();
    }

    // Load addresses from storage/API
    async loadAddresses() {
        try {
            // Try to load from API first
            const response = await fetch('/api/user/addresses', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.addresses = await response.json();
            } else {
                // Fallback to localStorage or mock data
                const savedAddresses = localStorage.getItem('userAddresses');
                if (savedAddresses) {
                    this.addresses = JSON.parse(savedAddresses);
                } else {
                    // Mock addresses for demo
                    this.addresses = [
                        {
                            id: 1,
                            type: 'home',
                            name: 'My Home',
                            fullName: 'John Doe',
                            phone: '+91 9876543210',
                            addressLine1: '123 MG Road',
                            addressLine2: 'Near Central Mall',
                            city: 'Bangalore',
                            state: 'Karnataka',
                            pincode: '560001',
                            country: 'India',
                            landmark: 'Opposite to Central Mall',
                            instructions: 'Ring the doorbell twice',
                            isDefault: true,
                            createdAt: '2024-01-15T10:00:00Z'
                        },
                        {
                            id: 2,
                            type: 'work',
                            name: 'Office',
                            fullName: 'John Doe',
                            phone: '+91 9876543210',
                            addressLine1: '456 Business District',
                            addressLine2: 'Tech Park, Floor 5',
                            city: 'Bangalore',
                            state: 'Karnataka',
                            pincode: '560002',
                            country: 'India',
                            landmark: 'Near Tech Park Entrance',
                            instructions: 'Call before delivery',
                            isDefault: false,
                            createdAt: '2024-01-20T14:30:00Z'
                        }
                    ];
                }
            }

            this.renderAddresses();
        } catch (error) {
            console.error('Error loading addresses:', error);
            this.showError('Failed to load addresses');
        }
    }

    // Render addresses in grid
    renderAddresses() {
        const grid = document.getElementById('addressGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.addresses.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        grid.innerHTML = '';

        // Sort addresses with default first
        const sortedAddresses = [...this.addresses].sort((a, b) => b.isDefault - a.isDefault);

        sortedAddresses.forEach(address => {
            const card = this.createAddressCard(address);
            grid.appendChild(card);
        });

        // Add "Add New Address" card
        const addCard = this.createAddAddressCard();
        grid.appendChild(addCard);
    }

    // Create address card element
    createAddressCard(address) {
        const card = document.createElement('div');
        card.className = `address-card ${address.isDefault ? 'default' : ''}`;

        const addressText = this.formatAddressText(address);

        card.innerHTML = `
            ${address.isDefault ? '<div class="default-badge">Default</div>' : ''}
            <div class="address-type">${address.type.charAt(0).toUpperCase() + address.type.slice(1)}</div>
            <div class="address-name">${address.name || 'Unnamed Address'}</div>
            <div class="address-text">${addressText}</div>
            <div class="address-actions">
                <button class="btn btn-outline" onclick="addressManager.editAddress(${address.id})">Edit</button>
                ${!address.isDefault ? `<button class="btn btn-secondary" onclick="addressManager.setDefault(${address.id})">Set Default</button>` : ''}
                <button class="btn btn-danger" onclick="addressManager.deleteAddress(${address.id})">Delete</button>
            </div>
        `;

        return card;
    }

    // Create add new address card
    createAddAddressCard() {
        const card = document.createElement('div');
        card.className = 'address-card add-address-card';
        card.onclick = () => this.openAddressModal();

        card.innerHTML = `
            <div class="add-icon">+</div>
            <h3>Add New Address</h3>
            <p>Add a new delivery address</p>
        `;

        return card;
    }

    // Format address text for display
    formatAddressText(address) {
        const parts = [
            address.fullName,
            address.addressLine1,
            address.addressLine2,
            address.landmark,
            `${address.city}, ${address.state} ${address.pincode}`,
            address.country,
            address.phone
        ].filter(part => part && part.trim() !== '');

        return parts.join(', ');
    }

    // Open address modal for adding/editing
    openAddressModal(addressId = null) {
        const modal = document.getElementById('addressModal');
        const form = document.getElementById('addressForm');
        const title = document.getElementById('modalTitle');

        if (addressId) {
            this.editingAddress = this.addresses.find(addr => addr.id === addressId);
            if (this.editingAddress) {
                title.textContent = 'Edit Address';
                this.populateAddressForm(this.editingAddress);
            }
        } else {
            this.editingAddress = null;
            title.textContent = 'Add New Address';
            form.reset();
            document.getElementById('country').value = 'India';
        }

        modal.style.display = 'block';
    }

    // Close address modal
    closeAddressModal() {
        const modal = document.getElementById('addressModal');
        modal.style.display = 'none';
        this.editingAddress = null;
    }

    // Populate form with address data
    populateAddressForm(address) {
        document.getElementById('addressType').value = address.type || '';
        document.getElementById('addressName').value = address.name || '';
        document.getElementById('fullName').value = address.fullName || '';
        document.getElementById('phone').value = address.phone || '';
        document.getElementById('addressLine1').value = address.addressLine1 || '';
        document.getElementById('addressLine2').value = address.addressLine2 || '';
        document.getElementById('city').value = address.city || '';
        document.getElementById('state').value = address.state || '';
        document.getElementById('pincode').value = address.pincode || '';
        document.getElementById('country').value = address.country || 'India';
        document.getElementById('landmark').value = address.landmark || '';
        document.getElementById('instructions').value = address.instructions || '';
        document.getElementById('isDefault').checked = address.isDefault || false;
    }

    // Save address (add or update)
    async saveAddress(formData) {
        try {
            const addressData = {
                type: formData.get('type'),
                name: formData.get('name'),
                fullName: formData.get('fullName'),
                phone: formData.get('phone'),
                addressLine1: formData.get('addressLine1'),
                addressLine2: formData.get('addressLine2'),
                city: formData.get('city'),
                state: formData.get('state'),
                pincode: formData.get('pincode'),
                country: formData.get('country'),
                landmark: formData.get('landmark'),
                instructions: formData.get('instructions'),
                isDefault: formData.get('isDefault') === 'on'
            };

            // Validate required fields
            const requiredFields = ['type', 'fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
            const missingFields = requiredFields.filter(field => !addressData[field]);

            if (missingFields.length > 0) {
                this.showError(`Please fill in all required fields: ${missingFields.join(', ')}`);
                return;
            }

            if (this.editingAddress) {
                // Update existing address
                addressData.id = this.editingAddress.id;
                addressData.createdAt = this.editingAddress.createdAt;

                const index = this.addresses.findIndex(addr => addr.id === this.editingAddress.id);
                if (index !== -1) {
                    this.addresses[index] = addressData;
                }
            } else {
                // Add new address
                addressData.id = Date.now();
                addressData.createdAt = new Date().toISOString();
                this.addresses.push(addressData);
            }

            // If setting as default, remove default from others
            if (addressData.isDefault) {
                this.addresses.forEach(addr => {
                    if (addr.id !== addressData.id) {
                        addr.isDefault = false;
                    }
                });
            }

            // Save to localStorage
            localStorage.setItem('userAddresses', JSON.stringify(this.addresses));

            // In a real app, save to API
            try {
                const method = this.editingAddress ? 'PUT' : 'POST';
                const url = this.editingAddress ? `/api/user/addresses/${addressData.id}` : '/api/user/addresses';

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(addressData)
                });

                if (!response.ok) {
                    console.warn('API save failed, using local storage');
                }
            } catch (apiError) {
                console.warn('API unavailable, using local storage only');
            }

            this.renderAddresses();
            this.closeAddressModal();
            this.showSuccess(this.editingAddress ? 'Address updated successfully!' : 'Address added successfully!');
        } catch (error) {
            console.error('Error saving address:', error);
            this.showError('Failed to save address');
        }
    }

    // Edit address
    editAddress(addressId) {
        this.openAddressModal(addressId);
    }

    // Set address as default
    async setDefault(addressId) {
        try {
            // Update local data
            this.addresses.forEach(addr => {
                addr.isDefault = addr.id === addressId;
            });

            localStorage.setItem('userAddresses', JSON.stringify(this.addresses));

            // In a real app, update via API
            try {
                await fetch(`/api/user/addresses/${addressId}/default`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
            } catch (apiError) {
                console.warn('API update failed, using local storage');
            }

            this.renderAddresses();
            this.showSuccess('Default address updated!');
        } catch (error) {
            console.error('Error setting default address:', error);
            this.showError('Failed to set default address');
        }
    }

    // Delete address
    async deleteAddress(addressId) {
        if (!confirm('Are you sure you want to delete this address?')) {
            return;
        }

        try {
            // Remove from local data
            this.addresses = this.addresses.filter(addr => addr.id !== addressId);
            localStorage.setItem('userAddresses', JSON.stringify(this.addresses));

            // In a real app, delete via API
            try {
                await fetch(`/api/user/addresses/${addressId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
            } catch (apiError) {
                console.warn('API delete failed, using local storage');
            }

            this.renderAddresses();
            this.showSuccess('Address deleted successfully!');
        } catch (error) {
            console.error('Error deleting address:', error);
            this.showError('Failed to delete address');
        }
    }

    // Get current location using GPS
    getCurrentLocation() {
        const statusEl = document.getElementById('locationStatus');

        if (!navigator.geolocation) {
            statusEl.textContent = 'Geolocation is not supported by this browser';
            statusEl.style.color = '#e74c3c';
            return;
        }

        statusEl.textContent = 'Detecting location...';
        statusEl.style.color = '#666';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Reverse geocoding to get address from coordinates
                    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                    const locationData = await response.json();

                    // Fill form with location data
                    document.getElementById('addressLine1').value = locationData.localityInfo?.administrative?.[2]?.name || '';
                    document.getElementById('city').value = locationData.city || '';
                    document.getElementById('state').value = locationData.principalSubdivision || '';
                    document.getElementById('pincode').value = locationData.postcode || '';
                    document.getElementById('country').value = locationData.countryName || 'India';

                    statusEl.textContent = 'Location detected and filled!';
                    statusEl.style.color = '#28a745';
                } catch (error) {
                    console.error('Error reverse geocoding:', error);
                    statusEl.textContent = `Location detected (${latitude.toFixed(6)}, ${longitude.toFixed(6)}) but address lookup failed`;
                    statusEl.style.color = '#f39c12';
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                let errorMessage = 'Failed to get location';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                }

                statusEl.textContent = errorMessage;
                statusEl.style.color = '#e74c3c';
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    }

    // Setup event listeners
    setupEventListeners() {
        // Address form submission
        document.getElementById('addressForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.saveAddress(formData);
        });

        // Modal close on outside click
        document.getElementById('addressModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('addressModal')) {
                this.closeAddressModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('addressModal').style.display === 'block') {
                this.closeAddressModal();
            }
        });
    }

    // Utility functions
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

// Global functions for HTML onclick handlers
function openAddressModal() {
    if (window.addressManager) {
        window.addressManager.openAddressModal();
    }
}

function closeAddressModal() {
    if (window.addressManager) {
        window.addressManager.closeAddressModal();
    }
}

function getCurrentLocation() {
    if (window.addressManager) {
        window.addressManager.getCurrentLocation();
    }
}

// Initialize address manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.addressManager = new AddressManager();
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