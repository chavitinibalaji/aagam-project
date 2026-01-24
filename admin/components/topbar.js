// Admin Topbar Component

class AdminTopbar extends HTMLElement {
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
                    background-color: white;
                    padding: 15px 30px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .topbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .topbar-left {
                    display: flex;
                    align-items: center;
                }

                .menu-toggle {
                    background: none;
                    border: none;
                    font-size: 24px;
                    margin-right: 20px;
                    cursor: pointer;
                    color: #333;
                    display: none;
                }

                #pageTitle {
                    font-size: 28px;
                    color: #2c3e50;
                    margin: 0;
                }

                .topbar-right {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .notifications,
                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    position: relative;
                }

                .badge {
                    background-color: #e74c3c;
                    color: white;
                    border-radius: 50%;
                    padding: 2px 6px;
                    font-size: 12px;
                    position: absolute;
                    top: -8px;
                    right: -8px;
                }

                .user-profile span {
                    font-size: 14px;
                    color: #2c3e50;
                }

                @media (max-width: 768px) {
                    :host {
                        padding: 10px 15px;
                    }

                    .menu-toggle {
                        display: block;
                    }

                    #pageTitle {
                        font-size: 24px;
                    }
                }
            </style>

            <div class="topbar">
                <div class="topbar-left">
                    <button class="menu-toggle" id="menuToggle">☰</button>
                    <h1 id="pageTitle">Dashboard</h1>
                </div>
                <div class="topbar-right">
                    <div class="notifications">
                        <span class="icon">🔔</span>
                        <span class="badge" id="notificationBadge">3</span>
                    </div>
                    <div class="user-profile">
                        <span class="icon">👤</span>
                        <span id="userName">Admin</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const menuToggle = this.shadowRoot.getElementById('menuToggle');
        menuToggle.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('toggleSidebar', {
                bubbles: true,
                composed: true
            }));
        });

        const notifications = this.shadowRoot.querySelector('.notifications');
        notifications.addEventListener('click', () => {
            // Handle notifications click
            alert('Notifications clicked');
        });

        const userProfile = this.shadowRoot.querySelector('.user-profile');
        userProfile.addEventListener('click', () => {
            // Handle user profile click
            this.showUserMenu();
        });
    }

    setPageTitle(title) {
        const pageTitle = this.shadowRoot.getElementById('pageTitle');
        pageTitle.textContent = title;
    }

    setUserName(name) {
        const userName = this.shadowRoot.getElementById('userName');
        userName.textContent = name;
    }

    setNotificationCount(count) {
        const badge = this.shadowRoot.getElementById('notificationBadge');
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }

    showUserMenu() {
        // Simple user menu - in real app, use a proper dropdown
        const menu = document.createElement('div');
        menu.innerHTML = `
            <div style="position: absolute; top: 100%; right: 0; background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000;">
                <button onclick="adminLogout()" style="display: block; width: 100%; padding: 8px; border: none; background: none; cursor: pointer; text-align: left;">Logout</button>
            </div>
        `;
        menu.style.position = 'absolute';
        menu.style.top = '100%';
        menu.style.right = '0';
        menu.style.background = 'white';
        menu.style.border = '1px solid #ddd';
        menu.style.borderRadius = '4px';
        menu.style.padding = '10px';
        menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        menu.style.zIndex = '1000';

        // Remove existing menu
        const existingMenu = document.querySelector('.user-menu');
        if (existingMenu) {
            document.body.removeChild(existingMenu);
        }

        menu.className = 'user-menu';
        document.body.appendChild(menu);

        // Close menu when clicking outside
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !e.target.closest('.user-profile')) {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            }
        });
    }
}

// Register the custom element
customElements.define('admin-topbar', AdminTopbar);