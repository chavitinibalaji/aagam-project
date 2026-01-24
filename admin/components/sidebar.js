// Admin Sidebar Component

class AdminSidebar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 250px;
                    background-color: #2c3e50;
                    color: white;
                    position: fixed;
                    height: 100vh;
                    left: 0;
                    top: 0;
                    z-index: 1000;
                    transition: transform 0.3s ease;
                }

                :host(.collapsed) {
                    transform: translateX(-250px);
                }

                .sidebar-header {
                    padding: 20px;
                    border-bottom: 1px solid #34495e;
                }

                .sidebar-header h2 {
                    color: #3498db;
                    font-size: 24px;
                    margin: 0;
                }

                .sidebar-nav {
                    padding: 20px 0;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    padding: 15px 20px;
                    color: #bdc3c7;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                    font-family: inherit;
                }

                .nav-item:hover,
                .nav-item.active {
                    background-color: #34495e;
                    color: white;
                }

                .nav-item .icon {
                    margin-right: 10px;
                    font-size: 18px;
                }

                @media (max-width: 768px) {
                    :host {
                        transform: translateX(-250px);
                    }

                    :host(.expanded) {
                        transform: translateX(0);
                    }
                }
            </style>

            <div class="sidebar-header">
                <h2>AAGAM Admin</h2>
            </div>
            <nav class="sidebar-nav">
                <button class="nav-item active" data-page="dashboard">
                    <span class="icon">📊</span> Dashboard
                </button>
                <button class="nav-item" data-page="products">
                    <span class="icon">📦</span> Products
                </button>
                <button class="nav-item" data-page="orders">
                    <span class="icon">📋</span> Orders
                </button>
                <button class="nav-item" data-page="inventory">
                    <span class="icon">📈</span> Inventory
                </button>
                <button class="nav-item" data-page="users">
                    <span class="icon">👥</span> Users
                </button>
            </nav>
        `;
    }

    setupEventListeners() {
        const navItems = this.shadowRoot.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all items
                navItems.forEach(navItem => navItem.classList.remove('active'));
                // Add active class to clicked item
                item.classList.add('active');

                // Dispatch custom event for page change
                const page = item.dataset.page;
                this.dispatchEvent(new CustomEvent('pageChange', {
                    detail: { page },
                    bubbles: true,
                    composed: true
                }));
            });
        });
    }

    setActivePage(page) {
        const navItems = this.shadowRoot.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    }

    toggle() {
        this.classList.toggle('collapsed');
    }
}

// Register the custom element
customElements.define('admin-sidebar', AdminSidebar);