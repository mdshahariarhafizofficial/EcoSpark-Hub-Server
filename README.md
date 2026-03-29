<p align="center">
  <img src="https://raw.githubusercontent.com/mdshahariarhafizofficial/EcoSpark-Hub/main/public/favicon.png" width="128" height="128" alt="EcoSpark Hub Logo">
</p>

<h1 align="center">EcoSpark Hub | Backend</h1>

<p align="center">
  <strong>The high-performance, secure core of the EcoSpark sustainability ecosystem.</strong>
</p>

<p align="center">
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js" alt="Node.js">
  </a>
  <a href="https://expressjs.com/">
    <img src="https://img.shields.io/badge/Express.js-5.x-black?style=for-the-badge&logo=express" alt="Express.js">
  </a>
  <a href="https://www.prisma.io/">
    <img src="https://img.shields.io/badge/Prisma-5.14-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  </a>
  <a href="https://www.postgresql.org/">
    <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  </a>
</p>

---

## 🏗️ Architectural Vision

**EcoSpark Hub Backend** is engineered for scalability, security, and developer productivity. It leverages a modern **TypeScript**-first approach with **Express 5** and **Prisma ORM**, providing a type-safe foundation for managing the global sustainability marketplace.

---

## ✨ Enterprise Features

### 🔐 Advanced Security & RBAC
*   **Encrypted Identity**: Secure password hashing with `bcryptjs`.
*   **Stateless Authentication**: JWT-driven session management with cross-origin security.
*   **Granular Permissions**: Strict Role-Based Access Control (RBAC) ensuring `ADMIN` and `MEMBER` isolation.
*   **Request Protection**: Integrated **Helmet**, **CORS**, and **Rate Limiting** to prevent exploitation.

### 💡 Lifecycle Management
*   **State-Driven Ideas**: Automated transitions from `DRAFT` to `APPROVED` with built-in sanity checks.
*   **Moderation Engine**: Specialized administrator tools for project vetting and feedback.
*   **Rich Interactions**: Real-time counters for views and votes, with a nested comment hierarchy.

### 💳 Financial Infrastructure
*   **Stripe Ecosystem**: Verified checkout sessions with robust webhook synchronization.
*   **Content Unlocking**: Atomic database transactions to ensure paid content access upon successful payment.
*   **Purchase Integrity**: Unique constraint-based purchase logs to prevent duplicate transactions.

### 🤖 Intelligent Integrations
*   **Gemini AI**: Native support for Google's Generative AI to assist in project discovery and user support.
*   **Automated Communication**: Integrated mail services for newsletters and community outreach.

---

## 🛠️ Technical Excellence

| Component | Description |
| :--- | :--- |
| **Runtime** | Node.js 18+ / 20+ (LTS) |
| **Type Safety** | TypeScript 5.x with Strict-Mode |
| **API Framework** | Express.js 5 / REST Architecture |
| **Database** | PostgreSQL 16 (Relational DB) |
| **ORM** | Prisma 5.14 Client & Migrations |
| **Validation** | Zod (Runtime Data Verification) |
| **Security** | JWT, bcrypt, Helmet, CORS, Rate-Limit |

---

## 🏗️ Interactive Flow: Request Life-Cycle

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware (Auth/RBAC)
    participant R as Router
    participant CO as Controller
    participant S as Service (Stripe/Gemini)
    participant D as Database (Prisma)

    C->>M: HTTP Request (JWT)
    M-->>C: 401 Unauthorized (Failure)
    M->>R: Authorized
    R->>CO: Route Handler
    CO->>S: Business Logic
    CO->>D: Store/Retrieve
    D->>CO: Query Result
    CO-->>C: JSON Response (Success)
```

---

## 📂 System Architecture

```text
src/
├── controllers/    # Specialized logic for every API domain
├── routes/         # Standardized endpoint definitions
├── middleware/     # Security, Auth, and Request validation layers
├── services/      # Abstraction for Stripe, Gemini, and Mail utilities
├── lib/            # Centralized DB and Constant singletons
├── utils/          # Formatting, Hashing, and Structured Logging
└── index.ts        # Server entry point with security hooks
```

---

## 🚀 Deployment & Operations

### 1. Requirements
- Node.js 18.x / 20.x
- PostgreSQL 15+

### 2. Rapid Deployment
```bash
# Initialize infrastructure
npm install
npx prisma generate
npx prisma migrate dev

# Seed mandatory data
npm run db:setup

# Launch Production
npm run build && npm start
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://user:pass@host:port/db?schema=public"
# Security
JWT_SECRET="your_high_entropy_secret"
# Payments
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 👨‍💻 Engineering Team
**The EcoSpark Backend Team**  
*Building the backbone for global sustainability.*

---

<p align="center">
  Licensed under the MIT License. &copy; 2026 EcoSpark Hub Platform.
</p>
