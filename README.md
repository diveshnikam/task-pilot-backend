
---

# TaskPilot – Backend (Express + MongoDB)

This is the backend API for the **TaskPilot Task Management App**.
It provides **JWT-based authentication**, **email OTP verification**, secure password recovery, team/project/task management, tagging, advanced filters, and productivity reports.

---

## 📦 Project Structure

```
backend/
├── db/
│   └── db.connect.js
├── models/
│   ├── users.js
│   ├── team.js
│   ├── project.js
│   ├── task.js
│   ├── tag.js
│   ├── signupVerificationSchema.js
│   └── forgotPasswordVerificationSchema.js
├── index.js
├── .env.example
└── README.md
```

---

## ⚙️ Setup Instructions

```bash
cd backend
npm install
cp .env.example .env
```

```
MONGODB=your_mongodb_uri
JWT_SECRET=your_secret_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
PORT=3000
```

```bash
node index.js
# or
npx nodemon index.js
```

Server:

```
http://localhost:3000
```

Hosted:

```
https://task-pilot-backend-sigma.vercel.app/
```

---

## 🔐 Authentication Features

• Email OTP verification for signup
• JWT token generation on login
• Token protected routes (Authorization: Bearer <token>)
• Forgot password with OTP email reset

---

## 🌐 API Endpoints

### 🔐 Authentication

Signup (send OTP) → POST /auth/signup
Verify signup OTP → POST /auth/verify-signup
Resend signup OTP → POST /auth/resend-signup-otp
Login (JWT) → POST /auth/login
Forgot password OTP → POST /auth/forgot-password
Verify forgot OTP → POST /auth/verify-forgot-password
Reset password → POST /auth/reset-password
Get profile (JWT protected) → GET /profile

---

### 👥 Teams

POST /teams
GET /teams
POST /teams/:id
DELETE /teams/:id
GET /teams/:id/details
GET /teams/:id/tasks

---

### 🏷 Tags

POST /tags
GET /tags
DELETE /tags/:id

---

### 📁 Projects

POST /projects
GET /projects
GET /projects/:id
POST /projects/:id
DELETE /projects/:id
GET /projects/:id/tasks

---

### 📝 Tasks

POST /tasks
GET /tasks
GET /tasks/:id
POST /tasks/:id
DELETE /tasks/:id

---

### 📊 Reports

GET /report/last-week
GET /report/pending
GET /report/closed-tasks

---

## 🛠 Tech Stack

Node.js
Express.js
MongoDB (Mongoose)
JWT Authentication
Email OTP Verification
Nodemailer
Bcrypt

---



