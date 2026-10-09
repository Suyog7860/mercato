# Mercato client (React + Vite + Tailwind v4)

## Run
1. Start the Express server on port 5000 (`npm run dev` in `server`).
2. In this folder, run `npm install` once and then `npm run dev`.
3. Open http://localhost:5173.

Vite proxies `/user` and `/api` to `http://localhost:5000` during development.

## Pages
- `/` — Storefront with search, category filters, sorting, featured collections, and product cards.
- `/product/:id` — Product details and related products.
- `/cart` — Shopping bag saved in local storage.
- `/checkout` — Delivery details, Razorpay online checkout, or cash on delivery.
- `/orders` — Signed-in user's order history.
- `/orders/:id` — Delivery and payment status history, with cancellation for eligible pending orders.
- `/wishlist` — Guest/local and signed-in/server-synced saved products.
- `/account` — Profile, saved delivery addresses, notification preferences, and password settings.
- `/login`, `/register` — Customer accounts.
- `/admin` — Admin-only store overview, paginated product management, fixed catalog categories, orders, and customer account management.

## Backend and payments
- Authenticated requests send a short-lived access token in the `Authorization` header; the refresh token is an HTTP-only cookie.
- Product/category mutations, image upload, and order routes require authentication; catalog management and image upload require an admin account.
- The server calculates order prices using the current product records. The client cannot set the amount paid.
- Copy `server/.env.example` to `server/.env` and configure MongoDB, JWT, Cloudinary, and Razorpay before starting the server. Keep the Razorpay key secret and webhook secret private.
- In the Razorpay dashboard, configure a webhook for `POST /api/payments/razorpay/webhook`, subscribe to `payment.captured` and `payment.failed`, and use the same secret for `RAZORPAY_WEBHOOK_SECRET`.
- The webhook also processes failed payment events. Online checkouts reserve inventory for 20 minutes; expired or failed checkouts release it.
- Product prices and Razorpay charges use INR. Online payment appears at checkout after Razorpay keys are configured; cash on delivery remains available without them.
- For production, set `VITE_API_URL` on the client and `CLIENT_ORIGIN` on the server to the exact client origin. Production Razorpay requires its webhook secret.

## Catalog setup
- The catalog supports six fixed categories (`Watches`, `Goggles`, `Hats`, `Shoes`, `Shirts`, and `Pants`) for Men and Women.
- Each product has exactly one unique image; the supplied catalog uses category-matched Pexels stock photos rather than random placeholder images.
- To initialize with the supplied 240-product sample catalog, configure `server/.env`, then run `$env:CONFIRM_REPLACE_PRODUCTS='YES'; npm run seed` from PowerShell in `server`. This replaces only products and categories; users and orders are preserved. Review the command carefully before running it against a production database.
