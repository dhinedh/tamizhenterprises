# Tamil Enterprises – Distribution & Dealer Management ERP

A full-stack, enterprise-grade Distribution and Dealer Management ERP web application built for **Tamil Enterprises**, a wholesale distributor business based in Tamil Nadu that purchases consumer products from principal manufacturers (e.g., ITC, HUL, Britannia, Parle, Godrej), stocks them in a central warehouse, and distributes them to retail stores and supermarkets.

---

## 🛠 Tech Stack

- **Frontend**: Vite + React 19, React Router v7, Tailwind CSS v4, Lucide Icons, Recharts for dynamic visual analytics, Axios
- **Backend**: Node.js + Express.js REST API
- **Database**: MongoDB with Mongoose ODM (Indexes, Schemas, Virtuals, Ledger audit trails)
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing and Role-Based Access Control (`Owner`, `Salesman`, `Store`)
- **Document Generation**: PDFKit for official GST Tax Invoices
- **Logistics & Communication**: Direct WhatsApp Billing share generator with prefilled customer ledger details

---

## 🏢 Business Flow

```
Manufacturers (Principals)
        │
        ▼ (Purchase Orders & Inward Verification)
Warehouse & Stock Control (Available, Reserved & Damaged Quarantine)
        │
        ▼ (Store Ordering & Credit Limit Check)
Order Approval & Stock Reservation
        │
        ▼ (Stock Outward Deduction & GST Invoice Generation)
Tax Invoices & Delivery Challans
        │
        ▼ (Vehicle & Driver Assignment)
Logistics & Proof of Delivery (POD)
        │
        ▼ (Payment Collection)
Financial Ledger & Outstandings Management
        │
        ▼
Executive Analytics & Reports (Fast/Slow/Dead Stock, Store AOV, Brand Margins)
```

---

## 📂 Project Structure

```
tamizh-enterprises/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── models/                   # 14 core Mongoose schemas
│   │   ├── User.js               # Role-based system users
│   │   ├── Manufacturer.js       # Principal suppliers & credit terms
│   │   ├── Product.js            # SKU catalog, HSN, multi-tier pricing
│   │   ├── Purchase.js           # POs, Goods Received Inspection
│   │   ├── Stock.js              # Physical, reserved & damaged stock
│   │   ├── StockLedger.js        # Immutable movement audit trail
│   │   ├── Store.js              # Retail dealer master, credit limits
│   │   ├── Order.js              # Store orders & approval states
│   │   ├── Invoice.js            # GST Tax Invoices with tax splits
│   │   ├── Salesman.js           # Sales force targets & quotas
│   │   ├── SalesmanVisit.js      # Field check-ins and orders booked
│   │   ├── Payment.js            # Store collections & manufacturer pays
│   │   ├── Return.js             # Damage/expiry returns & credit notes
│   │   ├── Delivery.js           # Fleet dispatch & proof of delivery
│   │   └── Scheme.js             # Buy-X-Get-Y & volume slab discounts
│   ├── controllers/              # Modular business logic controllers
│   ├── routes/                   # Protected Express API routers
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & role authorization
│   │   └── upload.js             # Multer upload configuration
│   ├── utils/
│   │   └── pdfGenerator.js       # PDFKit GST Tax Invoice generator
│   ├── scripts/
│   │   └── seed.js               # Database seeding script with realistic data
│   ├── server.js                 # Express server entry point
│   ├── .env                      # Database URI & JWT secret configuration
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js         # Axios client with JWT interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth provider & 1-click role switcher
│   │   ├── components/
│   │   │   ├── common/           # Badge, Card, Modal, Skeleton loaders
│   │   │   └── layout/           # Responsive Sidebar, Navbar & Layout
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Login page with demo credentials
│   │   │   ├── Dashboard.jsx     # Executive KPIs, Recharts, Alerts
│   │   │   ├── Manufacturers.jsx # Supplier master & 360 ledger
│   │   │   ├── Products.jsx      # SKU catalog & multi-tier pricing
│   │   │   ├── Purchases.jsx     # PO creation & Goods Inward inspection
│   │   │   ├── StockManagement.jsx # Live stock, ledger, valuation
│   │   │   ├── Stores.jsx        # Retailer directory & credit control
│   │   │   ├── Orders.jsx        # Order booking & approval workflow
│   │   │   ├── Invoices.jsx      # GST billing, PDF download & WhatsApp
│   │   │   ├── Salesmen.jsx      # Quota progress & field visit logs
│   │   │   ├── Payments.jsx      # Store collections & payables
│   │   │   ├── Deliveries.jsx    # Fleet dispatch & POD tracking
│   │   │   ├── Returns.jsx       # RMA intake & credit note issuance
│   │   │   ├── Schemes.jsx       # Trade discounts & promotion rules
│   │   │   └── Reports.jsx       # Velocity, Store growth & Margin analysis
│   │   ├── App.jsx               # Protected routing definitions
│   │   ├── index.css             # Tailwind CSS & custom scrollbars
│   │   └── main.jsx
│   ├── vite.config.js            # Vite config with API proxy
│   └── package.json
└── README.md
```

---

## 🔑 Role-Based Access & Test Credentials

The application includes a **1-Click Demo Login** bar at the top of the interface for immediate evaluation across roles without manually typing credentials:

| Role | Name | Email | Password | Access Scope |
|---|---|---|---|---|
| **Owner / Admin** | Muralitharan | `admin@tamilenterprises.com` | `admin123` | Full access to procurement, stock ledger, approval, financials & margin reports |
| **Salesman (Field)** | Murugan P | `murugan@tamilenterprises.com` | `sales123` | Mobile field view: book orders on the road, visit check-in, collect store dues |
| **Store (Retailer)** | Sri Krishna Supermarket | `store@srikrishnastores.com` | `store123` | Dealer portal: view wholesale catalog, order stock, track deliveries & view invoices |

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- MongoDB (running on `mongodb://127.0.0.1:27017`)

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed       # Seeds realistic FMCG products, manufacturers, stores & orders
npm run dev        # Runs Express API on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Runs Vite application on http://localhost:3000
```

Open `http://localhost:3000` in your web browser.
