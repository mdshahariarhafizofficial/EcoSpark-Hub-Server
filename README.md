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

## 📸 API Interface Preview

<p align="center">
  <img src="https://i.postimg.cc/SQ74z86g/Screenshot-22.png" width="100%" alt="EcoSpark Hub API Welcome Page">
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

## 🛠️ Technologies Used

- **Node.js**: Scalable JavaScript runtime built on Chrome's V8 engine, powering the platform's core logic.
- **Express.js (v5)**: Minimal and flexible web application framework for building secure and scalable RESTful APIs.
- **PostgreSQL (Neon)**: Serverless relational database for highly available, efficient, and consistent data storage.
- **Prisma ORM**: Next-generation TypeScript ORM used for type-safe database access, automated migrations, and schema management.
- **JWT Authentication**: Industry-standard JSON Web Tokens for stateless and secure user session management.
- **BcryptJS**: Advanced password-based key derivation function for secure credential hashing.
- **Stripe API**: Global financial infrastructure supporting complex checkout sessions and real-time payment processing.
- **Multer**: High-performance Node.js middleware for handling file uploads (images and technical blueprints).
- **Nodemailer**: Comprehensive module for sending enterprise-level transactional emails and newsletters.
- **Zod**: TypeScript-first runtime schema validation to ensure the integrity of all incoming API payloads.

---

## 🔌 API Endpoints

### 🔐 Auth Routes
- `POST /api/auth/register`: Create a new user account with hashed credentials.
- `POST /api/auth/login`: Authenticate user and issue a secure, HTTP-only JWT cookie.

### 💡 Idea Routes
- `GET /api/ideas`: Fetch a paginated, filtered list of approved ecological blueprints.
- `GET /api/ideas/:id`: Retrieve detailed technical specifications for a single idea.
- `POST /api/ideas`: Submit a new ecological proposal (status: `DRAFT`).
- `PUT /api/ideas/:id`: Update an existing proposal (Author-only permissions).
- `DELETE /api/ideas/:id`: Permanently remove a blueprint (Author or Admin permissions).

### 🛠️ Admin Routes
- `PUT /api/ideas/:id/status`: Transition idea states (`APPROVED`, `REJECTED`) with moderation feedback.
- `GET /api/admin/stats`: High-level platform telemetry for performance tracking.

### 💳 Payment Routes
- `POST /api/payment/initiate/:id`: Generate a specialized Stripe Checkout Session for a paid blueprint.
- `POST /api/payment/webhook`: Handle real-time asynchronous payment confirmations from Stripe.
- `GET /api/payment/success`: Client-side polling endpoint for instant content unlocking.

### 📊 Dashboard Routes
- `GET /api/dashboard/stats`: Retrieve user-specific metrics for contributions, votes, and activities.

---

## 🔄 Data Flow

The EcoSpark Hub Backend follows a strict request-response lifecycle to ensure data integrity and security:

1. **Request**: Client initiates an HTTP request with an optional JWT.
2. **Middleware**: JWT is verified, role permissions are checked, and payloads are validated via **Zod**.
3. **Controller**: Business logic is executed, orchestrating interaction with external services (Stripe/AI).
4. **Prisma**: The ORM performs type-safe queries to the **PostgreSQL** database.
5. **DB**: Database state is updated or retrieved reliably.
6. **Response**: A structured JSON response is returned with appropriate HTTP status codes.

---

## 🔐 Authentication System

- **JWT Usage**: Sessions are stateless. A signed JWT is issued upon login and stored in an **HTTP-only cookie** for maximum security.
- **Middleware Protection**: Routes are wrapped in `authenticate` and `requireAdmin` wrappers to prevent unauthorized access.
- **Role-Based Access (RBAC)**: Supports `ADMIN` and `MEMBER` roles with distinct access layers for moderation vs. creation.

---

## 💳 Payment System

- **Stripe Checkout**: Generates unique sessions for every purchase, ensuring secure handling of financial data.
- **Webhook Verification**: Real-time listeners for `checkout.session.completed` ensure "at-least-once" delivery of purchase records.
- **Idea Unlocking**: Once a `Purchase` record is atomically created in the DB, the system grants the user persistent read-access to the blueprint.

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
