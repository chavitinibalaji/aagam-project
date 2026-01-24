// Header Component for AAGAM
class HeaderComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        const user = JSON.parse(localStorage.getItem('aagam_user') || 'null');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                }

                .header {
                    background: #fff;
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border-bottom: 1px solid #eee;
                    position: relative;
                }

                .logo {
                    font-size: 22px;
                    font-weight: 800;
                    color: #00b761;
                    cursor: pointer;
                    text-decoration: none;
                }

                .search {
                    flex: 1;
                    display: flex;
                    background: #f2f3f7;
                    border-radius: 10px;
                    padding: 8px 10px;
                    align-items: center;
                    max-width: 500px;
                }

                .search input {
                    flex: 1;
                    border: none;
                    background: none;
                    outline: none;
                    font-size: 16px;
                }

                .search input::placeholder {
                    color: #999;
                }

                .search-icon {
                    color: #666;
                    cursor: pointer;
                    margin-left: 8px;
                }

                .header-icons {
                    display: flex;
                    gap: 12px;
                    font-size: 20px;
                    cursor: pointer;
                    align-items: center;
                }

                .header-icon {
                    position: relative;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background-color 0.3s ease;
                }

                .header-icon:hover {
                    background-color: #f5f5f5;
                }

                .cart-count {
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    background: #00b761;
                    color: white;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                }

                .user-menu {
                    position: relative;
                }

                .user-menu-content {
                    display: none;
                    position: absolute;
                    right: 0;
                    top: 100%;
                    background: white;
                    min-width: 200px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    z-index: 1000;
                    border: 1px solid #eee;
                }

                .user-menu-content.show {
                    display: block;
                }

                .user-menu-item {
                    padding: 12px 16px;
                    cursor: pointer;
                    border-bottom: 1px solid #f5f5f5;
                    transition: background-color 0.3s ease;
                }

                .user-menu-item:hover {
                    background-color: #f8f9fa;
                }

                .user-menu-item:last-child {
                    border-bottom: none;
                }

                .user-menu-item.logout {
                    color: #dc3545;
                }

                .auth-buttons {
                    display: flex;
                    gap: 10px;
                }

                .auth-btn {
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }

                .login-btn {
                    background: transparent;
                    color: #00b761;
                    border: 1px solid #00b761;
                }

                .login-btn:hover {
                    background: #00b761;
                    color: white;
                }

                .signup-btn {
                    background: #00b761;
                    color: white;
                    border: 1px solid #00b761;
                }

                .signup-btn:hover {
                    background: #005a3d;
                }

                @media (max-width: 768px) {
                    .header {
                        padding: 8px;
                    }

                    .logo {
                        font-size: 18px;
                    }

                    .search {
                        max-width: none;
                    }

                    .header-icons {
                        gap: 8px;
                        font-size: 18px;
                    }
                }
            </style>

            <div class="header">
                <a href="index.html" class="logo">AAGAM</a>

                <div class="search">
                    <input type="text" placeholder="Search for groceries..." id="searchInput">
                    <span class="search-icon" id="searchIcon">🔍</span>
                </div>

                <div class="header-icons">
                    ${user ? `
                        <a href="cart.html" class="header-icon cart-icon">
                            🛒
                            <span class="cart-count" id="cartCount">0</span>
                        </a>
                        <div class="user-menu">
                            <div class="header-icon user-icon" id="userMenuTrigger">
                                👤
                            </div>
                            <div class="user-menu-content" id="userMenuContent">
                                <div class="user-menu-item">
                                    <strong>${user.name}</strong><br>
                                    <small>${user.email}</small>
                                </div>
                                <div class="user-menu-item" onclick="navigateTo('orders.html')">
                                    📦 My Orders
                                </div>
                                <div class="user-menu-item" onclick="navigateTo('profile.html')">
                                    👤 Profile
                                </div>
                                <div class="user-menu-item" onclick="navigateTo('address.html')">
                                    📍 My Addresses
                                </div>
                                <div class="user-menu-item logout" onclick="logout()">
                                    🚪 Logout
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="auth-buttons">
                            <a href="login.html" class="auth-btn login-btn">Login</a>
                            <a href="login.html" class="auth-btn signup-btn">Sign Up</a>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = this.shadowRoot.getElementById('searchInput');
        const searchIcon = this.shadowRoot.getElementById('searchIcon');

        const performSearch = () => {
            const query = searchInput.value.trim();
            if (query) {
                // In a real app, this would navigate to search results
                console.log('Searching for:', query);
                // window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        };

        searchIcon.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // User menu toggle
        const userMenuTrigger = this.shadowRoot.getElementById('userMenuTrigger');
        const userMenuContent = this.shadowRoot.getElementById('userMenuContent');

        if (userMenuTrigger && userMenuContent) {
            userMenuTrigger.addEventListener('click', () => {
                userMenuContent.classList.toggle('show');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.shadowRoot.contains(e.target)) {
                    userMenuContent.classList.remove('show');
                }
            });
        }

        // Update cart count
        this.updateCartCount();
    }

    updateCartCount() {
        const cartCount = this.shadowRoot.getElementById('cartCount');
        if (cartCount) {
            const cart = JSON.parse(localStorage.getItem('aagam_cart') || '[]');
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }
}

// Helper functions
function navigateTo(url) {
    window.location.href = url;
}

function logout() {
    localStorage.removeItem('aagam_user');
    localStorage.removeItem('aagam_cart');
    window.location.href = 'index.html';
}

// Register the component
customElements.define('aagam-header', HeaderComponent);