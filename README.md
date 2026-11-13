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

1. This project intentionally does **not** scrape Meesho/Amazon/Flipkart. There is no universal, reliable, permitted public endpoint for arbitrary product-page scraping. Paste the product name, a permitted stable image URL, prices and affiliate URL manually for now. A platform-specific official API/feed can be integrated later if you have access and its terms permit the use.
2. Prices are admin-entered snapshots, not live price comparisons. Keep them updated and show a last-updated timestamp in a future enhancement if needed.
3. Images are referenced by URL. Do not hotlink or reuse retailer images unless the platform or rights holder permits it. Firebase Storage is not used because it requires a billing-enabled project for current Firebase Storage provisioning.
4. Popularity sorting uses the `popularityScore` field. Product views/outbound clicks are logged as lightweight events; the admin can also edit the score. Avoid high-frequency Firestore writes on a busy public site.
5. Firebase Spark quotas are finite. This app avoids Cloud Functions and paid server infrastructure. A Firebase project and a free-tier hosting/database quota are still subject to Firebase's current terms and limits.
6. Admin dashboard requires Firebase configuration and the exact admin UID in both `.env` and `firestore.rules`. Do not deploy with the placeholder UID in the rules.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Firebase configuration, the public storefront runs using demo products. Admin actions remain disabled.

## Firebase setup (Spark / no billing account)

1. Create a Firebase project and choose the no-cost Spark plan.
2. In Project settings, create a Web app and copy its `apiKey`, `authDomain`, `projectId` and `appId` into `.env.local`.
3. Enable **Authentication → Email/Password**.
4. Create your one admin user in Authentication → Users. Do not enable public sign-up.
5. Copy that user's UID into `VITE_ADMIN_UID` in `.env.local`.
6. Replace `REPLACE_WITH_ADMIN_UID` in `firestore.rules` with the same UID.
7. Create a Firestore database in production mode, then publish `firestore.rules`.
8. Create the initial categories from the admin panel or add documents to the `categories` collection. A category document should contain `name`, `icon`, `active`.

Example `.env.local`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_APP_ID=...
VITE_ADMIN_UID=your-admin-auth-uid
```

Never put Firebase Admin SDK private keys or service-account credentials in this frontend project.

## Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase use --add
npm run build
firebase deploy --only hosting,firestore:rules
```

Select the same Spark project. Hosting serves the built `dist` directory. The rewrite in `firebase.json` supports React Router URLs.

## Firestore collections

- `products`: `name`, `slug`, `description`, `images` (array), `categoryId`, `featured`, `published`, `popularityScore`, `createdAt`, `offers` (array)
- `categories`: `name`, `icon`, `active`
- `deals`: `name`, `slug`, `description`, `priceLimit`, `productIds` (array), `active`, `displayOrder`
- `clicks`: click events written by the public app

Each `offers[]` item contains `platform`, `affiliateUrl`, `price`, `originalPrice`, and `active`.

## GitHub

Create an empty GitHub repository named `amazecart`, then push this folder. Do not commit `.env.local` or real credentials.
