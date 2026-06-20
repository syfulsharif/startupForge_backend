# StartupForge Backend — API Server

StartupForge is a robust, full-stack platform where startup founders can publish ideas, hire collaborators, and manage team vacancies. Developers, designers, and marketers can explore opportunities, apply to teams, and track their application statuses.

This repository hosts the backend Express.js server, powered by MongoDB, JSON Web Token (JWT) cookies, and Stripe.

---

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Distinct routes and permissions for **Founder**, **Collaborator**, and **Admin** roles.
*   **JWT Cookie Authentication:** Secure credentials login, Google SSO simulations, and session tracking stored in secure `HttpOnly` cookies.
*   **Startup Profile Management:** Founders can manage their startup registration profile (pending moderation by Admins).
*   **Vacancy Posting & Management:** Founders can add, edit, and remove team opportunities.
*   **Stripe Payment Integration:** Monetization feature requiring founders to upgrade to **Premium** to post more than 3 opportunities. Includes automatic Stripe Checkout session verification and mock payment fallback.
*   **Collaborator Applications:** Collaborators can apply with their portfolio and motivation letters, which founders can accept or reject in real time.
*   **Admin Dashboard Telemetry:** Admins can view platform stats (Total Users, Startups, Vacancies, Revenue), approve/remove startups, block/unblock users, and audit Stripe payment histories.
*   **Advanced MongoDB Querying:** Robust server-side pagination, regular expression searches (`$regex`), and industry/work-type matching (`$in`).
*   **Global Error Handling & Security:** Helmet-guarded headers, CORS origin configurations, rate-limiting protection, and centralized error-handling middlewares.

---

## 🛠️ Tech Stack

*   **Runtime:** Node.js (ES Modules)
*   **Web Framework:** Express.js
*   **Database ORM:** Mongoose / MongoDB Atlas
*   **Authentication:** JWT (jsonwebtoken) & Cookie-Parser
*   **Payments:** Stripe Node SDK
*   **File Uploads:** Multer (local `/tmp/uploads` for serverless production compatibility)
*   **Security:** Helmet, CORS, Express-Rate-Limit, BcryptJS

---

## ⚙️ Local Development Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Local or Atlas URI)
*   Stripe Account (Optional for keys)

### 1. Clone the repository and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory based on the `.env.example` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:3000
IMAGEBB_API_KEY=your_imagebb_api_key
```

### 3. Run Database Seeds
When you run the development server for the first time, if the database has 0 users, it will **automatically seed** default accounts, an approved startup, and a starting vacancy opportunity.

### 4. Start the server
*   **Development mode (auto-reload):**
    ```bash
    npm run dev
    ```
*   **Production start:**
    ```bash
    npm start
    ```

---

## 🔑 Default Credentials for Testing

The automatic database seeder creates the following accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@startupforge.com` | `password123A` | System moderator (can block users, approve startups, audit payments) |
| **Founder** | `sarah@ecosphere.com` | `password123A` | EcoSphere AI Founder (premium upgraded, has 1 seeded opportunity) |
| **Collaborator** | `marcus@dev.io` | `password123A` | Collaborator profile with pre-configured React/JavaScript skills |

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
*   `POST /register` — Register a new account. Expects multipart-form data for avatar uploads or JSON.
*   `POST /login` — Log in credentials. Returns JWT token and stores it in HttpOnly cookies.
*   `POST /google` — Google OAuth SSO simulation callback.
*   `POST /logout` — Clear auth cookie session.
*   `GET /me` — [Private] Check current user session and return role profile details.
*   `PUT /profile` — [Private] Update collaborator skills, bio, name, or experience fields.

### 🚀 Startups (`/api/startups`)
*   `POST /` — [Private: Founder/Admin] Submit a new Startup Profile. Defaults status to `pending`.
*   `GET /` — Fetch all `approved` startups. Admin can pass `?all=true` to get pending ones too.
*   `GET /:id` — Get single startup profile details.
*   `PUT /:id` — [Private: Owner/Admin] Edit startup details.
*   `DELETE /:id` — [Private: Owner/Admin] Delete startup and all its opportunities.

### 💼 Opportunities (`/api/opportunities`)
*   `POST /` — [Private: Founder/Admin] Post a new opportunity. Verifies Premium status if post count > 3.
*   `GET /` — Fetch paginated, sorted, and filtered vacancies.
    *   *Query Parameters:* `page`, `limit`, `search` (matches role title/skills), `workType` (cleared with `$in`), `industry` (cleared with `$in`), `commitment`, `sort` (`newest`/`oldest`).
*   `GET /:id` — Fetch single vacancy details.
*   `PUT /:id` — [Private: Owner/Admin] Update vacancy information.
*   `DELETE /:id` — [Private: Owner/Admin] Delete vacancy and associated applications.

### 📝 Applications (`/api/applications`)
*   `POST /` — [Private: Collaborator] Submit application to join a team.
*   `GET /` — [Private] Retrieve applications. (Founders get incoming applications, Collaborators get their submitted applications, Admins get all).
*   `PUT /:id/status` — [Private: Owner/Admin] Update application decision status (`Pending`, `Accepted`, `Rejected`).

### 💳 Stripe Payments (`/api/payments`)
*   `POST /create-checkout-session` — [Private: Founder] Create Stripe Session. Simulates Checkout URL if Stripe is unconfigured or mocked.
*   `POST /verify-session` — [Private: Founder] Verify payment status and upgrade user profile to `isPremium = true`.
*   `GET /` — [Private: Admin Only] Audit transaction history.

### 🛡️ Admin Controls (`/api/admin`)
*   `GET /stats` — [Private: Admin] Returns counts of users, startups, opportunities, and total platform revenue.
*   `GET /users` — [Private: Admin] Fetch all registered users.
*   `PUT /users/:id/block` — [Private: Admin] Suspend or reactivate a user account.
*   `PUT /users/:id/premium` — [Private: Admin] Manually toggle user Premium status.
*   `PUT /startups/:id/approve` — [Private: Admin] Approve a startup profile to make it visible to the public.

---

## ⚡ Deployment on Vercel

This project is configured for Vercel out-of-the-box using the Vercel Serverless Functions API configuration (`vercel.json` pointing to `api/index.js`).

1. Install the Vercel CLI: `npm i -g vercel`
2. Link project and configure environment variables on Vercel Dashboard.
3. Deploy: `vercel --prod`
