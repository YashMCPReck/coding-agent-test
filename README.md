# Lunia Foods

A small farm-to-table grocery e-commerce store. Built with **Express** and **SQLite** (better-sqlite3) with a vanilla HTML/CSS/JS frontend — no build step.

## Stack

- **Backend:** Node.js + Express, SQLite via `better-sqlite3`
- **Frontend:** static pages (`public/`), shared header/footer + cart state in `localStorage`
- **Seed data:** `data/products.json` (loaded into SQLite on first run)

## Run locally

```bash
npm install
npm start
# → http://localhost:3000
```

## Adding product images

Drop a real photo into **`public/img/products/`** (e.g. `heirloom-tomatoes.jpg`) and update its `image` field in **`data/products.json`** to `img/products/your-file.jpg`, then restart so the DB re-seeds (delete `data/lunia.db` first if it already seeded). Every product currently points at a shared placeholder SVG.

## API

| Method | Path                | Description                |
|--------|---------------------|----------------------------|
| GET    | `/api/products`     | List products (`?q=`, `?category=`) |
| GET    | `/api/products/:id` | One product                |
| POST   | `/api/orders`       | Create an order            |
| GET    | `/api/orders/:id`   | Fetch an order + its items |

## Notes

- Cart persists in `localStorage`; checkout clears it on successful order.
- This is a demo — no real payments are processed.
