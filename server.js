const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (Vercel pe kaam karega)
let products = [
    { id: "1", name: "ASUS ROG Strix G16", price: 1499.99, stock: 12, category: "Laptops", image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400", description: "Gaming Laptop" },
    { id: "2", name: "Sony WH-1000XM5", price: 349.99, stock: 28, category: "Audio", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400", description: "Noise Cancelling Headphones" },
    { id: "3", name: "Logitech MX Master 3S", price: 99.99, stock: 45, category: "Peripherals", image: "https://resource.logitech.com/w_800,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png", description: "Wireless Mouse" },
    { id: "4", name: "Apple MacBook Pro M3", price: 1999.00, stock: 8, category: "Laptops", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400", description: "Apple Laptop" },
    { id: "5", name: "Keychron K2 Pro", price: 89.99, stock: 32, category: "Keyboards", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400", description: "Mechanical Keyboard" },
    { id: "6", name: "Dell UltraSharp 4K", price: 649.99, stock: 15, category: "Monitors", image: "https://i.postimg.cc/Tw7YH9xm/dell.jpg", description: "4K Monitor" },
    { id: "7", name: "Razer BlackWidow V4", price: 229.99, stock: 18, category: "Keyboards", image: "https://i.postimg.cc/hG3t2scX/razer.jpg", description: "Gaming Keyboard" },
    { id: "8", name: "Samsung 990 Pro SSD", price: 159.99, stock: 42, category: "Storage", image: "https://i.postimg.cc/j5PYy4jg/ssd.jpg", description: "2TB NVMe SSD" }
];

let cart = {};
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'techstore2026';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
}

function isAdmin(req, res, next) {
    const token = req.headers['admin-token'];
    if (token === 'admin-session-token') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}

// ========== API ROUTES ==========

// Products
app.get('/api/products', (req, res) => {
    try {
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Categories
app.get('/api/categories', (req, res) => {
    try {
        const categories = [...new Set(products.map(p => p.category))];
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Contact
app.post('/api/contact', (req, res) => {
    try {
        const { name, email, message } = req.body;
        console.log(`Contact: ${name} - ${message}`);
        res.json({ success: true, message: 'Thank you for contacting us!' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Cart - Add
app.post('/api/cart/add', (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const product = products.find(p => p.id === productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (!cart[productId]) {
            cart[productId] = { ...product, quantity: 0 };
        }
        cart[productId].quantity += quantity || 1;
        res.json({ success: true, cart: Object.values(cart) });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Cart - Update
app.post('/api/cart/update', (req, res) => {
    try {
        const { productId, quantity } = req.body;
        if (quantity <= 0) {
            delete cart[productId];
        } else if (cart[productId]) {
            cart[productId].quantity = quantity;
        }
        res.json({ success: true, cart: Object.values(cart) });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Cart - Remove
app.delete('/api/cart/remove/:productId', (req, res) => {
    try {
        delete cart[req.params.productId];
        res.json({ success: true, cart: Object.values(cart) });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Cart - Get
app.get('/api/cart', (req, res) => {
    try {
        res.json({ cart: Object.values(cart) });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Order - Place
app.post('/api/order/place', (req, res) => {
    try {
        const { customerName, customerEmail, address, cart: cartItems } = req.body;
        if (!customerName || !customerEmail || !address || !cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const order = {
            id: generateId(),
            customer: { name: customerName, email: customerEmail, address },
            items: cartItems,
            total: total,
            date: new Date().toISOString()
        };
        console.log('Order placed:', order.id);
        cart = {};
        res.json({ success: true, orderId: order.id });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin - Login
app.post('/api/admin/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            res.json({ success: true, token: 'admin-session-token' });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin - Create Product
app.post('/api/admin/products', isAdmin, (req, res) => {
    try {
        const { name, price, stock, category, image, description } = req.body;
        const newProduct = {
            id: generateId(),
            name: name || 'New Product',
            price: parseFloat(price) || 0,
            originalPrice: (parseFloat(price) || 0) * 1.2,
            stock: parseInt(stock) || 0,
            category: category || 'General',
            image: image || 'https://via.placeholder.com/300',
            description: description || '',
            rating: 0
        };
        products.push(newProduct);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// Admin - Update Product
app.put('/api/admin/products/:id', isAdmin, (req, res) => {
    try {
        const index = products.findIndex(p => p.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        products[index] = { ...products[index], ...req.body, id: req.params.id };
        res.json(products[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Admin - Delete Product
app.delete('/api/admin/products/:id', isAdmin, (req, res) => {
    try {
        const index = products.findIndex(p => p.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        products.splice(index, 1);
        delete cart[req.params.id];
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Frontend - Serve HTML
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`Admin: admin / techstore2026`);
});