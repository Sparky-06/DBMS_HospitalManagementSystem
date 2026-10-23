# Hospital Patient Management System - TiDB Cloud Backend

This is a replicated backend implementation configured specifically for **TiDB Cloud** (Serverless or Dedicated).

It provides full drop-in parity with the original MySQL backend, requiring **zero modifications to the frontend**.

---

## 🌟 Key Features

* **TiDB Cloud Ready**: Pre-configured for TiDB Serverless & Dedicated clusters.
* **SSL/TLS by Default**: Meets TiDB Cloud's mandatory TLS v1.2+ encryption requirements.
* **Keep-Alive Optimized**: Configured with TCP KeepAlive (`10000ms`) to prevent cloud NAT / proxy connection drops during idle periods.
* **Zero Frontend Changes**:
  * Runs on port `5000` by default (matches `frontend/src/api/client.js` default `http://localhost:5000/api`).
  * Emits identical API envelopes (`{ success, data, message }`).
  * Supports seamless switching: simply run `backend` for local MySQL or `tidb_backend` for TiDB Cloud.
* **Automated Setup Scripts**: Includes `npm run db:init` and `npm run db:seed` to provision the schema and load sample records to TiDB Cloud in seconds.

---

## 🚀 Quick Start Guide

### 1. Create a Free TiDB Cloud Cluster (if you don't have one)
1. Sign up / Log in to [TiDB Cloud](https://tidbcloud.com/).
2. Click **Create Cluster** and select **TiDB Serverless** (Free Tier).
3. Choose your preferred region (e.g., `AWS / us-east-1`).
4. Once created, click **Connect**:
   * Select **Endpoint**: Public
   * Note down:
     * **Host** (e.g., `gateway01.us-east-1.prod.aws.tidbcloud.com`)
     * **Port** (usually `4000`)
     * **User** (e.g., `xxxxxx.root`)
     * **Password** (the generated root password)
     * **Database** (e.g., `hospital_pms` or `test`)

---

### 2. Configure Environment (`.env`)
Open `tidb_backend/.env` and replace the placeholder credentials with your TiDB Cloud cluster details:

```env
PORT=5000
NODE_ENV=development

# TiDB Cloud Cluster Credentials
DB_HOST=gateway01.us-east-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=your_cluster_prefix.root
DB_PASSWORD=your_tidb_password
DB_NAME=hospital_pms

# Mandatory SSL for TiDB Cloud
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

CLIENT_URL=http://localhost:5173
```

*(Alternatively, you can provide `DATABASE_URL=mysql://<user>:<password>@<host>:4000/hospital_pms?ssl={"rejectUnauthorized":true}`)*

---

### 3. Initialize Database Schema & Seed Data
Run the built-in migration script to automatically create all tables on TiDB Cloud:

```bash
# In the tidb_backend directory:
npm run db:init
```

Next, populate the database with sample hospital data:

```bash
npm run db:seed
```

---

### 4. Start the TiDB Cloud Backend Server

```bash
# Run in development mode with nodemon auto-reload:
npm run dev

# Or run standard node start:
npm start
```

You should see:
```text
====================================================
  Hospital PMS Server (TiDB Cloud Backend)          
====================================================
[DB] Successfully connected to TiDB Cloud database: hospital_pms
[DB] Endpoint: gateway01.us-east-1.prod.aws.tidbcloud.com:4000 | SSL: Enabled (TLS v1.2+)
[API] Server is running on: http://localhost:5000
[API] Health check:         http://localhost:5000/api/health
[API] Dashboard stats:      http://localhost:5000/api/dashboard/stats
[API] Compatible with:      Frontend on http://localhost:5173
====================================================
```

---

### 5. Start Frontend (Zero Changes Needed)
In a separate terminal:

```bash
cd ../frontend
npm run dev
```

Open `http://localhost:5173` in your browser. The frontend will communicate directly with your TiDB Cloud backend on `http://localhost:5000/api` without changing any code or environment variables!

---

## 🔄 Switching Between Backends

| Implementation | Location | Database | Start Command |
|---|---|---|---|
| **Local MySQL Backend** | `backend/` | Local MySQL (port 3306) | `cd backend && npm run dev` |
| **TiDB Cloud Backend** | `tidb_backend/` | TiDB Cloud (port 4000, SSL) | `cd tidb_backend && npm run dev` |

Since both backends serve on `http://localhost:5000` with identical API endpoints, simply run whichever backend you want to use. Stop one before starting the other.

---

## 🧪 Running Tests

To run the automated test suite:

```bash
npm test
```
