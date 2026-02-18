# 🛡️ Suraksha — Women Safety Emergency Response System

**Suraksha** is a real-time emergency alert and dispatch backend system designed to ensure women's safety by connecting users in distress immediately with police stations, active duty officers, and emergency contacts.

It leverages high-performance asynchronous background processing (BullMQ + Redis) for real-time WhatsApp & SMS notifications, alongside Socket.io WebSockets for live officer location tracking and station dispatching.

---

## 🚀 Architecture & Tech Stack

### Core Technologies
- **Runtime & Language:** Node.js (v18+) with TypeScript (ES Modules)
- **Framework:** Express.js (v5)
- **Database:** MongoDB with Mongoose ODM
- **In-Memory Cache & Pub/Sub:** Redis with `@socket.io/redis-adapter` for multi-instance scaling
- **Queue & Background Jobs:** BullMQ for asynchronous alert handling
- **Real-Time Layer:** Socket.io (WebSockets)
- **Authentication:** JWT (Access & Refresh Tokens), bcrypt password hashing
- **Notifications:** Twilio API (WhatsApp alerts) & Nodemailer / Brevo (Email verification)

---

## ✨ Key Features

- **🚨 Instant SOS Dispatch System:** Females in distress can trigger live SOS alerts with location coordinates.
- **📍 Real-Time Police Station & Officer Alerting:** Automatically routes SOS events to the nearest police station room via WebSockets.
- **📱 Automated WhatsApp Alerts:** Background workers dispatch immediate WhatsApp emergency alerts with live GPS coordinates to trusted contacts and police officers.
- **🛡️ Role-Based Access Control (RBAC):**
  - `FEMALE_USER`: Trigger SOS, update emergency contacts, upload government ID proof.
  - `POLICE_OFFICER`: View live active station SOS calls, accept dispatches, toggle on/off duty status.
  - `STATION_ADMIN`: Register and manage police officers, issue OTPs, oversee station activity.
  - `SUPER_ADMIN`: Manage police stations, review pending user ID verifications, assign admins.
- **⚡ Horizontally Scalable WebSockets:** Socket.io paired with Redis Pub/Sub adapter to support high concurrent user loads across distributed instances.

---

## 📁 Repository Structure

```
suraksha/
├── client/                 # Frontend Application
└── server/                 # Express + TypeScript Backend API
    ├── src/
    │   ├── app.ts          # Application Entry Point
    │   ├── config/         # MongoDB & Redis configurations
    │   ├── middlewares/    # Auth & Role RBAC Middlewares
    │   ├── models/         # Mongoose Data Models (User, Officer, Station, SOS, etc.)
    │   ├── modules/        # Domain-driven Features (Auth, User, Officer, Station, SOS)
    │   ├── queues/         # BullMQ queue producers (SOS & WhatsApp queues)
    │   ├── socket/         # Socket.io connection & event handlers
    │   ├── utils/          # JWT, Hashing, Seed scripts
    │   └── workers/        # BullMQ queue consumers (Async job processors)
    ├── .env                # Environment variable configuration
    ├── package.json
    └── tsconfig.json
```

---

## ⚙️ Getting Started

### 1. Prerequisites
Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)
- [Redis](https://redis.io/) (Running on `127.0.0.1:6379`)

---

### 2. Installation & Setup

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `server` directory:
   ```env
   PORT=3002
   NODE_ENV=development

   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/suraksha

   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379

   JWT_ACCESS_SECRET=your_access_secret_here
   JWT_REFRESH_SECRET=your_refresh_secret_here
   JWT_ACCESS_EXPIRES=15m
   JWT_REFRESH_EXPIRES=7d

   EMAIL_HOST=smtp-relay.brevo.com
   EMAIL_PORT=587
   EMAIL_USER=your_email_user
   EMAIL_PASS=your_email_password
   EMAIL_FROM=noreply@womensafety.com

   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_WHATSAPP_FROM=+14155238886

   CLIENT_URL=http://localhost:3000
   ```

---

### 3. Seed Super Admin Account

To create the initial Super Admin account:
```bash
npm run seed
```
*Default Super Admin Credentials:*
- **Email:** `superadmin@womensafety.com`
- **Password:** `SuperAdmin@123`

---

### 4. Running the Development Server

Start the Node.js server with live reloading:
```bash
npm run dev
```

The server will initialize connections to MongoDB, Redis, WebSockets, and launch BullMQ workers:
- **API Server:** `http://localhost:3002`
- **Health Check:** `http://localhost:3002/health`

---

## 📡 API Endpoints Overview

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Login user & receive JWT token pair | No |
| `GET` | `/api/auth/verify-email/:token` | Verify user email address | No |
| `POST` | `/api/auth/refresh` | Refresh access token | No |
| `POST` | `/api/auth/logout` | Revoke refresh token & logout | Yes |

### 🆘 Emergency SOS (`/api/sos`)
| Method | Endpoint | Description | Allowed Roles |
| --- | --- | --- | --- |
| `POST` | `/api/sos/trigger` | Trigger live emergency SOS with GPS coordinates | `FEMALE_USER` |
| `GET` | `/api/sos/history` | Get personal SOS trigger history | `FEMALE_USER` |
| `GET` | `/api/sos/station/active` | Get active SOS calls assigned to station | `POLICE_OFFICER`, `STATION_ADMIN` |
| `PATCH` | `/api/sos/:id/accept` | Accept an emergency SOS dispatch | `POLICE_OFFICER` |
| `PATCH` | `/api/sos/:id/status` | Update SOS alert status (RESOLVED, IN_PROGRESS, etc.) | `POLICE_OFFICER` |

### 👤 User Management & Contacts (`/api/users`)
| Method | Endpoint | Description | Allowed Roles |
| --- | --- | --- | --- |
| `GET` | `/api/users/profile` | View user profile | `FEMALE_USER` |
| `PUT` | `/api/users/profile` | Update profile information | `FEMALE_USER` |
| `POST` | `/api/users/id-proof` | Upload Government ID proof | `FEMALE_USER` |
| `POST` | `/api/users/emergency-contacts` | Add emergency contact | `FEMALE_USER` |
| `GET` | `/api/users/emergency-contacts` | List emergency contacts | `FEMALE_USER` |
| `DELETE` | `/api/users/emergency-contacts/:id` | Remove emergency contact | `FEMALE_USER` |
| `GET` | `/api/users/pending-verifications` | View pending ID verifications | `SUPER_ADMIN` |
| `PATCH` | `/api/users/:userId/review-id` | Approve/Reject user ID verification | `SUPER_ADMIN` |

### 👮 Officer Management (`/api/officers`)
| Method | Endpoint | Description | Allowed Roles |
| --- | --- | --- | --- |
| `POST` | `/api/officers` | Register new police officer | `STATION_ADMIN` |
| `POST` | `/api/officers/verify-otp` | Verify officer login OTP | Officers |
| `GET` | `/api/officers` | List officers for a police station | `STATION_ADMIN`, `SUPER_ADMIN` |
| `PATCH` | `/api/officers/:id/duty` | Toggle officer duty status | `STATION_ADMIN` |
| `PATCH` | `/api/officers/:id/transfer` | Transfer officer to another station | `SUPER_ADMIN` |

### 🏢 Police Station Management (`/api/stations`)
| Method | Endpoint | Description | Allowed Roles |
| --- | --- | --- | --- |
| `POST` | `/api/stations` | Create new police station | `SUPER_ADMIN` |
| `GET` | `/api/stations` | List all police stations | `SUPER_ADMIN` |
| `POST` | `/api/stations/create-admin` | Assign station admin account | `SUPER_ADMIN` |

---

## 🔌 WebSockets (Socket.io) Events

When connecting to WebSockets (`ws://localhost:3002`), pass the JWT access token in authorization:
```javascript
const socket = io('http://localhost:3002', {
  auth: { token: 'YOUR_JWT_ACCESS_TOKEN' }
});
```

### Emitted & Handled Events:
- **`station:<stationId>` (Room):** Police officers automatically join their assigned station channel upon connection.
- **`officer_online` / `officer_offline`:** Broadcasted to station rooms when an officer connects or disconnects.
- **`toggle_duty` (Client -> Server):** Allows police officers to switch on-duty / off-duty status in real-time.
- **`officer_duty_changed` (Server -> Client):** Broadcasts duty updates to station dashboard.

---

## 🛠️ Scripts Reference

In `server/package.json`:
- `npm run dev`: Starts the server in development mode using `nodemon` and `ts-node`.
- `npm run build`: Compiles TypeScript files into JavaScript in the `dist` directory.
- `npm run start`: Launches compiled production server (`node dist/app.js`).
- `npm run seed`: Seeds the database with default Super Admin credentials.

---

## 👨‍💻 Author

**Kartvik Singh**
- GitHub: [@kartvik](https://github.com/kartvik)
- Email: [kartviksingh@gmail.com](mailto:kartviksingh@gmail.com)

---

## 📄 License

This project is licensed under the ISC License.
