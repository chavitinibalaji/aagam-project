// Admin Product Management

let products = [];
let currentProductId = null;

// Load products from API
async function loadProducts() {
    try {
        // In a real app, this would be an API call
        // For now, load from local data
        const response = await fetch('../../data/products.json');
        const data = await response.json();
        products = data.products || [];
        renderProductsTable();
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to empty array
        products = [];
        renderProductsTable();
    }
}

// Render products table
function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id || 'N/A'}</td>
            <td>${product.name}</td>
            <td>${product.cat || 'N/A'}</td>
            <td>₹${product.price}</td>
            <td>${product.stock || 0}</td>
            <td><span class="status-badge status-active">Active</span></td>
            <td>
                <button class="btn-secondary" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Add new product
function addProduct() {
    currentProductId = null;
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productModal').style.display = 'block';
}

// Edit product
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentProductId = productId;
    document.getElementById('productModalTitle').textContent = 'Edit Product';

    // Fill form with product data
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.cat;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productMrp').value = product.mrp || '';
    document.getElementById('productWeight').value = product.weight;
    document.getElementById('productImage').value = product.img;
    document.getElementById('productStock').value = product.stock || 0;
    document.getElementById('productDescription').value = product.description || '';

    document.getElementById('productModal').style.display = 'block';
}

// Delete product
function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== productId);
        renderProductsTable();
        // In real app, make API call to delete
    }
}

// Save product
function saveProduct(event) {
    event.preventDefault();

    const productData = {
        name: document.getElementById('productName').value,
        cat: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        mrp: document.getElementById('productMrp').value ? parseFloat(document.getElementById('productMrp').value) : null,
        weight: document.getElementById('productWeight').value,
        img: document.getElementById('productImage').value,
        stock: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value
    };

    if (currentProductId) {
        // Update existing product
        const index = products.findIndex(p => p.id === currentProductId);
        if (index !== -1) {
            products[index] = { ...products[index], ...productData };
        }
    } else {
        // Add new product
        const newId = Math.max(...products.map(p => p.id || 0), 0) + 1;
        products.push({ id: newId, ...productData });
    }

    renderProductsTable();
    closeProductModal();

    // In real app, make API call to save
}

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('productForm').reset();
}

// Initialize product management
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();

    // Event listeners
    document.getElementById('addProductBtn').addEventListener('click', addProduct);
    document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
    document.getElementById('productForm').addEventListener('submit', saveProduct);

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('productModal');
        if (event.target === modal) {
            closeProductModal();
        }
    });
});