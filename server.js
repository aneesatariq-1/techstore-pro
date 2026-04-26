const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// ========== IN-MEMORY DATA STORAGE ==========
let products = [
    { id: "1", name: "ASUS ROG Strix G16", price: 1499.99, originalPrice: 1799.99, stock: 12, category: "Laptops", brand: "ASUS", image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400", description: "Intel Core i9, RTX 4070, 32GB RAM", rating: 4.8 },
    { id: "2", name: "Sony WH-1000XM5", price: 349.99, originalPrice: 399.99, stock: 28, category: "Audio", brand: "Sony", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400", description: "Noise cancellation, 30-hour battery", rating: 4.9 },
    { id: "3", name: "Logitech MX Master 3S", price: 99.99, originalPrice: 129.99, stock: 45, category: "Peripherals", brand: "Logitech", image: "https://resource.logitech.com/w_800,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png", description: "8K DPI tracking", rating: 4.7 },
    { id: "4", name: "Apple MacBook Pro M3", price: 1999.00, originalPrice: 2299.00, stock: 8, category: "Laptops", brand: "Apple", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400", description: "M3 Pro chip", rating: 4.9 },
    { id: "5", name: "Keychron K2 Pro", price: 89.99, originalPrice: 109.99, stock: 32, category: "Keyboards", brand: "Keychron", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400", description: "Wireless mechanical keyboard", rating: 4.6 },
    { id: "6", name: "Dell UltraSharp 4K", price: 649.99, originalPrice: 749.99, stock: 15, category: "Monitors", brand: "Dell", image: "https://i.postimg.cc/Tw7YH9xm/dell.jpg", description: "27-inch 4K IPS", rating: 4.8 },
    { id: "7", name: "Razer BlackWidow V4", price: 229.99, originalPrice: 269.99, stock: 18, category: "Keyboards", brand: "Razer", image: "https://i.postimg.cc/hG3t2scX/razer.jpg", description: "Mechanical gaming keyboard", rating: 4.7 },
    { id: "8", name: "Samsung 990 Pro SSD", price: 159.99, originalPrice: 199.99, stock: 42, category: "Storage", brand: "Samsung", image: "https://i.postimg.cc/j5PYy4jg/ssd.jpg", description: "2TB NVMe SSD", rating: 4.9 }
];

let cart = {};

// Helper functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// Admin middleware
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'techstore2026';

function isAdmin(req, res, next) {
    const token = req.headers['admin-token'];
    if (token === 'admin-session-token') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}

// ========== PRODUCTS API ==========
app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/categories', (req, res) => {
    const categories = [...new Set(products.map(p => p.category))];
    res.json(categories);
});

// ========== CART API ==========
app.post('/api/cart/add', (req, res) => {
    const { productId, quantity } = req.body;
    const product = products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    if (!cart[productId]) {
        cart[productId] = { ...product, quantity: 0 };
    }
    cart[productId].quantity += quantity || 1;
    res.json({ success: true, cart: Object.values(cart) });
});

app.post('/api/cart/update', (req, res) => {
    const { productId, quantity } = req.body;
    if (quantity <= 0) {
        delete cart[productId];
    } else if (cart[productId]) {
        cart[productId].quantity = quantity;
    }
    res.json({ success: true, cart: Object.values(cart) });
});

app.delete('/api/cart/remove/:productId', (req, res) => {
    delete cart[req.params.productId];
    res.json({ success: true, cart: Object.values(cart) });
});

app.get('/api/cart', (req, res) => {
    res.json({ cart: Object.values(cart) });
});

// ========== ORDER API ==========
app.post('/api/order/place', (req, res) => {
    const { customerName, customerEmail, customerPhone, address, cart: cartItems } = req.body;
    
    if (!customerName || !customerEmail || !address || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const order = {
        id: generateId(),
        customer: { name: customerName, email: customerEmail, phone: customerPhone, address },
        items: cartItems,
        total: total,
        status: 'pending',
        date: new Date().toISOString()
    };
    
    console.log('Order placed:', order.id);
    cart = {};
    res.json({ success: true, orderId: order.id, message: 'Order placed successfully!' });
});

// ========== CONTACT API ==========
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    console.log(`Contact: ${name} (${email}): ${message}`);
    res.json({ success: true, message: 'Thank you! We will respond within 24 hours.' });
});

// ========== ADMIN API ==========
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.json({ success: true, token: 'admin-session-token' });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

app.post('/api/admin/products', isAdmin, (req, res) => {
    const { name, price, stock, category, brand, description, image } = req.body;
    const newProduct = {
        id: generateId(),
        name: name || 'New Product',
        price: parseFloat(price) || 0,
        originalPrice: (parseFloat(price) || 0) * 1.2,
        stock: parseInt(stock) || 0,
        category: category || 'General',
        brand: brand || 'Generic',
        image: image || 'https://via.placeholder.com/300',
        description: description || '',
        rating: 0
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.put('/api/admin/products/:id', isAdmin, (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    products[index] = { ...products[index], ...req.body, id: req.params.id };
    res.json(products[index]);
});

app.delete('/api/admin/products/:id', isAdmin, (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    products.splice(index, 1);
    delete cart[req.params.id];
    res.json({ success: true, message: 'Product deleted' });
});

// ========== SERVE FRONTEND ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════╗
    ║     🚀 TechStore Pro Server Running        ║
    ╠════════════════════════════════════════════╣
    ║  Local:   http://localhost:${PORT}         ║
    ║  Admin:   admin / techstore2026            ║
    ║  Status:  ✅ Ready to serve                ║
    ╚════════════════════════════════════════════╝
    `);
});