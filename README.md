# PRINT OPTION - Stock Management & Cash Balancing Software

> Professional POS, Inventory Stock Management, Daily Cash Balancing, and Automated Receipt/Bill Generation Software built for **PRINT OPTION**.

---

## 📞 Business Hotline & Contact
- **Hotline / WhatsApp:** `+94 71 723 7290`
- **Direct WhatsApp Chat:** [https://wa.me/94717237290](https://wa.me/94717237290)

---

## 🌟 Key Features

1. **Item & Inventory Management (`ITNO, ITEM NAME, AVAILABLE QTY, ONE PIECE PRICE, REASON`):**
   - Add stock items with unique item numbers, available quantities, unit prices, and notes/reasons.
   - Bulk upload items using Excel files (`.xlsx`, `.xls`, `.csv`). Includes sample template download.
   - Real-time stock search and low-stock warning indicators.
   - Edit, delete, and export full stock inventory to Excel.

2. **Automatic Stock Deduction (Mark OUT / POS):**
   - Select date, pick an item from stock, and enter OUT quantity.
   - Instantly calculates and updates **New Available Quantity** (`Current Available - Out QTY`).
   - Supports single quick OUT or multi-item cart bill generation.
   - Validates that out quantity does not exceed available stock.

3. **Daily Cash Balancing:**
   - Record **Opening Cash** in the morning.
   - Auto-calculates **Cash Sales** from daily stock-out transactions.
   - Log **Daily Shop Expenses** (petty cash, refreshments, paper, transport, utilities).
   - Computes **Expected Cash in Drawer** = `Opening Cash + Cash Sales - Expenses`.
   - Admin counts physical drawer cash at the end of the day to detect any **Surplus / Shortage**.

4. **Automated Bill / Receipt Generator:**
   - Generates thermal receipt (80mm) and A4 invoice format.
   - Includes PRINT OPTION branding, contact number `+94 71 723 7290`, invoice number, itemized totals, discount, cash tendered, and change.
   - One-click print / save as PDF.

5. **Admin Security & Authentication:**
   - Single admin access protected by JWT and bcrypt encryption.
   - Default login: `admin` / `admin123`.

---

## 🚀 Deployment on Vercel

1. Push this repository to GitHub: `https://github.com/dilankasltl/print-option.git`
2. Go to [Vercel](https://vercel.com) and import the repository.
3. In Vercel **Project Settings > Environment Variables**, add:
   - `MONGODB_URI`: `mongodb+srv://savindudilanka9793_db_user:EE6lVtaO43Lnlinh@cluster0.m61fegg.mongodb.net/print_option_db?retryWrites=true&w=majority`
   - `JWT_SECRET`: `print_option_jwt_secret_production_key_2026`
   - `ADMIN_DEFAULT_USERNAME`: `admin`
   - `ADMIN_DEFAULT_PASSWORD`: `admin123`
   - `NEXT_PUBLIC_APP_NAME`: `PRINT OPTION`
   - `NEXT_PUBLIC_PHONE_NUMBER`: `+94 71 723 7290`
   - `NEXT_PUBLIC_PHONE_RAW`: `94717237290`
4. Click **Deploy**. Vercel will deploy the application seamlessly!

---

## 💻 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
Default login credentials:
- **Username:** `admin`
- **Password:** `admin123`
