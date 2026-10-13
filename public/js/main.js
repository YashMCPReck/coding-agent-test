// Shared header/footer injection + cart state (localStorage).
const CART_KEY = 'lunia_cart';
const DELIVERY_FEE = 49;

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function cartCount() {
  return getCart().reduce((n, it) => n + it.quantity, 0);
}

function updateCartBadge() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = cartCount();
}

function addToCart(id, name, price, unit) {
  const cart = getCart();
  const existing = cart.find((it) => it.id === id);
  if (existing) existing.quantity += 1;
  else cart.push({ id, name, price, unit, quantity: 1 });
  saveCart(cart);
  flash(`Added ${name} to cart`);
}

function changeQuantity(id, delta) {
  let cart = getCart();
  const it = cart.find((x) => x.id === id);
  if (!it) return;
  it.quantity += delta;
  if (it.quantity <= 0) cart = cart.filter((x) => x.id !== id);
  saveCart(cart);
  renderCart();
}

function removeFromCart(id) {
  saveCart(getCart().filter((x) => x.id !== id));
  renderCart();
}

function cartSubtotal() {
  return getCart().reduce((s, it) => s + it.price * it.quantity, 0);
}

function flash(msg) {
  let el = document.getElementById('flash-msg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'flash-msg';
    el.className = 'alert';
    el.style.position = 'fixed';
    el.style.bottom = '1.5rem';
    el.style.right = '1.5rem';
    el.style.zIndex = '50';
    el.style.margin = '0';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.transition = 'opacity 0.4s';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 2500);
}

function money(n) {
  return '₹' + Number(n).toFixed(2);
}

// Shared cart renderer (used by cart.html; safe to call on any page).
function renderCart() {
  const box = document.getElementById('cart');
  if (!box) return;
  const cart = getCart();
  if (!cart.length) {
    box.innerHTML = '<p class="alert">Your cart is empty. <a href="shop.html">Browse products</a>.</p>';
    return;
  }
  const subtotal = cartSubtotal();
  box.innerHTML = `
    ${cart.map(it => `
      <div class="line">
        <div class="info">
          <div class="name">${it.name}</div>
          <div class="muted">${money(it.price)} / ${it.unit}</div>
        </div>
        <div class="qty">
          <button onclick="changeQuantity('${it.id}', -1)">−</button>
          <span>${it.quantity}</span>
          <button onclick="changeQuantity('${it.id}', 1)">+</button>
        </div>
        <div class="line-total">${money(it.price * it.quantity)}</div>
        <button class="add-btn" style="margin:0" onclick="removeFromCart('${it.id}')">Remove</button>
      </div>`).join('')}
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
      <div class="row"><span>Delivery</span><span>${money(DELIVERY_FEE)}</span></div>
      <div class="row grand"><span>Total</span><span>${money(subtotal + DELIVERY_FEE)}</span></div>
    </div>
    <div style="margin-top:1.5rem; text-align:right;">
      <a class="btn" href="checkout.html">Proceed to checkout</a>
    </div>`;
}

function injectShell(active) {
  const header = document.getElementById('site-header');
  if (header) {
    header.innerHTML = `
      <div class="container bar">
        <a class="brand" href="index.html">Lunia Foods</a>
        <nav class="site-nav">
          <a href="index.html"${active === 'home' ? ' style="color:var(--green)"' : ''}>Home</a>
          <a href="shop.html"${active === 'shop' ? ' style="color:var(--green)"' : ''}>Shop</a>
          <a href="about.html"${active === 'about' ? ' style="color:var(--green)"' : ''}>About</a>
          <a href="contact.html"${active === 'contact' ? ' style="color:var(--green)"' : ''}>Contact</a>
        </nav>
        <a class="cart-link" href="cart.html">Cart <span id="cart-count">0</span></a>
      </div>`;
  }
  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.innerHTML = `
      <div class="container">
        <div class="cols">
          <div><h4>Lunia Foods</h4><p>Farm-to-table groceries, delivered fresh.</p></div>
          <div><h4>Shop</h4><ul>
            <li><a href="shop.html">All products</a></li>
            <li><a href="cart.html">Cart</a></li>
            <li><a href="checkout.html">Checkout</a></li>
          </ul></div>
          <div><h4>Help</h4><ul>
            <li><a href="shipping.html">Shipping</a></li>
            <li><a href="returns.html">Returns</a></li>
            <li><a href="privacy.html">Privacy</a></li>
            <li><a href="terms.html">Terms</a></li>
          </ul></div>
        </div>
        <p class="copyright">&copy; ${new Date().getFullYear()} Lunia Foods. All rights reserved.</p>
      </div>`;
  }
  updateCartBadge();
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || '';
  injectShell(page);
});
