const path = require('path');
const fs = require('fs');
const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'lunia.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    price       REAL NOT NULL,
    unit        TEXT NOT NULL,
    image       TEXT,
    description TEXT,
    stock       INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id            TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    email         TEXT NOT NULL,
    phone         TEXT,
    address       TEXT NOT NULL,
    city          TEXT NOT NULL,
    postal_code   TEXT,
    notes         TEXT,
    subtotal      REAL NOT NULL,
    shipping      REAL NOT NULL,
    total         REAL NOT NULL,
    status        TEXT NOT NULL DEFAULT 'placed',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   TEXT NOT NULL,
    product_id TEXT NOT NULL,
    name       TEXT NOT NULL,
    price      REAL NOT NULL,
    quantity   INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
`);

// Seed products on first run if the table is empty.
function seedProducts() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  if (count > 0) return;
  const raw = fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf8');
  const products = JSON.parse(raw);
  const insert = db.prepare(`
    INSERT INTO products (id, name, category, price, unit, image, description, stock)
    VALUES (@id, @name, @category, @price, @unit, @image, @description, @stock)
  `);
  const upsert = db.transaction((items) => {
    for (const p of items) insert.run(p);
  });
  upsert(products);
}
seedProducts();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Products ---
app.get('/api/products', (req, res) => {
  const { category, q } = req.query;
  let rows = db.prepare('SELECT * FROM products WHERE stock > 0 ORDER BY name').all();
  if (category) rows = rows.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  if (q) {
    const needle = String(q).toLowerCase();
    rows = rows.filter((p) => p.name.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle));
  }
  res.json(rows);
});

app.get('/api/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  res.json(row);
});

// --- Orders ---
app.post('/api/orders', (req, res) => {
  const { customerName, email, phone, address, city, postalCode, notes, items, subtotal, shipping, total } = req.body || {};

  if (!customerName || !email || !address || !city) {
    return res.status(400).json({ error: 'Missing required fields (name, email, address, city).' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }

  const id = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

  const createOrder = db.transaction(() => {
    db.prepare(`
      INSERT INTO orders (id, customer_name, email, phone, address, city, postal_code, notes, subtotal, shipping, total)
      VALUES (@id, @customer_name, @email, @phone, @address, @city, @postal_code, @notes, @subtotal, @shipping, @total)
    `).run({
      id, customer_name: customerName, email, phone, address, city,
      postal_code: postalCode, notes, subtotal, shipping, total
    });

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, name, price, quantity)
      VALUES (@order_id, @product_id, @name, @price, @quantity)
    `);
    for (const it of items) {
      insertItem.run({
        order_id: id, product_id: it.id, name: it.name, price: it.price, quantity: it.quantity
      });
    }
  });

  createOrder();
  res.status(201).json({ id });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

app.listen(PORT, () => {
  console.log(`Lunia Foods running at http://localhost:${PORT}`);
});
