// Category Bar Component for AAGAM
class CategoryBarComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.categories = [
            { id: 'all', name: 'All', icon: '🏠' },
            { id: 'vegetables', name: 'Vegetables', icon: '🥕' },
            { id: 'fruits', name: 'Fruits', icon: '🍎' },
            { id: 'dairy', name: 'Dairy', icon: '🥛' },
            { id: 'grains', name: 'Grains', icon: '🌾' },
            { id: 'spices', name: 'Spices', icon: '🌶️' },
            { id: 'snacks', name: 'Snacks', icon: '🍿' },
            { id: 'beverages', name: 'Beverages', icon: '🥤' },
            { id: 'household', name: 'Household', icon: '🏠' },
            { id: 'personal', name: 'Personal Care', icon: '🧴' }
        ];
        this.activeCategory = 'all';
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        const categoryHtml = this.categories.map(category => `
            <span class="category-item ${category.id === this.activeCategory ? 'active' : ''}"
                  data-category="${category.id}">
                <span class="category-icon">${category.icon}</span>
                ${category.name}
            </span>
        `).join('');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .category-nav {
                    display: flex;
                    gap: 18px;
                    padding: 12px;
                    background: #fff;
                    overflow-x: auto;
                    border-bottom: 1px solid #eee;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .category-nav::-webkit-scrollbar {
                    display: none;
                }

                .category-item {
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                    color: #666;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 8px 12px;
                    border-radius: 20px;
                }

                .category-item:hover {
                    color: #00b761;
                    background-color: #f0f9f0;
                }

                .category-item.active {
                    color: #00b761;
                    border-bottom: 3px solid #00b761;
                    padding-bottom: 5px;
                    background-color: #f0f9f0;
                }

                .category-icon {
                    font-size: 16px;
                }

                @media (max-width: 768px) {
                    .category-nav {
                        gap: 12px;
                        padding: 10px;
                    }

                    .category-item {
                        font-size: 14px;
                        padding: 6px 10px;
                    }
                }
            </style>

            <div class="category-nav">
                ${categoryHtml}
            </div>
        `;
    }

    setupEventListeners() {
        const categoryItems = this.shadowRoot.querySelectorAll('.category-item');

        categoryItems.forEach(item => {
            item.addEventListener('click', () => {
                const categoryId = item.dataset.category;
                this.setActiveCategory(categoryId);

                // Dispatch custom event for category change
                this.dispatchEvent(new CustomEvent('categoryChange', {
                    detail: { category: categoryId },
                    bubbles: true,
                    composed: true
                }));
            });
        });
    }

    setActiveCategory(categoryId) {
        this.activeCategory = categoryId;

        // Update visual state
        const categoryItems = this.shadowRoot.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            if (item.dataset.category === categoryId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    getActiveCategory() {
        return this.activeCategory;
    }
}

// Register the component
customElements.define('aagam-category-bar', CategoryBarComponent);