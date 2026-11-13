# AmazeCart

A mobile-first product discovery storefront with multi-store shopping offers, deal collections, search/sorting and a single-admin Firebase dashboard.

## Included
- React + Vite + React Router storefront
- Responsive home, category, search, deals and product-detail pages
- Multiple shopping offers per product (Meesho, Amazon, Flipkart, Myntra, Ajio or Other)
- Cheapest listed offer highlighted; individual offer prices shown
- Search, category/store/price filters and sorting (popularity, price, discount, newest)
- Admin sign-in using Firebase Authentication
- Admin product CRUD, image URL, categories, featured/published toggles and multiple offers
- Firestore rules and Firebase Hosting configuration
- Demo catalogue so the storefront can be previewed before Firebase setup

## Important scope notes
1. This project does **not** scrape Meesho/Amazon/Flipkart. Add product details, permitted image URLs, prices and affiliate URLs manually, or integrate an official platform feed/API where authorized.
2. Prices are admin-entered snapshots, not live price comparisons. Keep them updated.
3. Images are referenced by URL. Reuse retailer images only where permitted. Firebase Storage is not used.
4. Popularity sorting uses `popularityScore`; product clicks are logged as lightweight events.
5. Firebase Spark quotas are finite; hosting and database usage remain subject to Firebase limits and terms.
6. Admin dashboard requires Firebase configuration and the exact admin UID in both `.env.local` and `firestore.rules`. Never deploy with the placeholder UID.

## Run locally
Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Firebase configuration, the public storefront uses demo products. Admin actions remain disabled.

## Firebase setup
1. Create a Firebase project on the Spark plan.
2. Create a Web app and copy `apiKey`, `authDomain`, `projectId` and `appId` into `.env.local`.
3. Enable Authentication → Email/Password.
4. Create the admin user in Authentication → Users; do not enable public sign-up.
5. Copy its UID into `VITE_ADMIN_UID`.
6. Replace `REPLACE_WITH_ADMIN_UID` in `firestore.rules` with the same UID.
7. Create Firestore and publish `firestore.rules`.
8. Add categories with `name`, `icon`, and `active` fields.

Never put Firebase Admin SDK private keys or service-account credentials in this frontend project.

## Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase use --add
npm run build
firebase deploy --only hosting,firestore:rules
```

## Firestore collections
- `products`: `name`, `slug`, `description`, `images`, `categoryId`, `featured`, `published`, `popularityScore`, `createdAt`, `offers`
- `categories`: `name`, `icon`, `active`
- `deals`: `name`, `slug`, `description`, `priceLimit`, `productIds`, `active`, `displayOrder`
- `clicks`: outbound click events

Each `offers[]` item contains `platform`, `affiliateUrl`, `price`, `originalPrice`, and `active`.

Do not commit `.env.local` or real credentials.
