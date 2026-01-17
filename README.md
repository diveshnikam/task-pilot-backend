# TaskPilot – Backend (Express + MongoDB)

This is the backend API for the **TaskPilot Task Management App**. It provides JWT-based authentication, email OTP verification, secure password recovery, team/project/task management, tagging, advanced filters, and productivity reports.

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

Configure environment variables:

```
MONGODB=your_mongodb_uri
JWT_SECRET=your_secret_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
PORT=3000
```

Run the server:

```bash
node index.js
# or
npx nodemon index.js
```

---

## 🌍 Server URLs

### Local

```
http://localhost:3000
```

### Hosted (Production)

**Core APIs (Render):**

```
https://task-pilot-backend-5sb3.onrender.com
```

**OTP / Email APIs (Vercel):**

```
https://task-pilot-backend-sigma.vercel.app
```

---

## 🔐 Authentication Features

• Email OTP verification for signup
• JWT token generation on login
• Token-protected routes (`Authorization: Bearer <token>`)
• Forgot password with OTP email reset

---

## 🌐 API Endpoints

### 🔐 Authentication

| Method | Endpoint                       | Description                | Hosted On  |
| ------ | ------------------------------ | -------------------------- | ---------- |
| POST   | `/auth/signup`                 | Send signup OTP            | **Vercel** |
| POST   | `/auth/verify-signup`          | Verify signup OTP          | **Vercel** |
| POST   | `/auth/resend-signup-otp`      | Resend signup OTP          | **Vercel** |
| POST   | `/auth/forgot-password`        | Send forgot password OTP   | **Vercel** |
| POST   | `/auth/verify-forgot-password` | Verify forgot password OTP | **Vercel** |
| POST   | `/auth/reset-password`         | Reset password             | **Vercel** |
| POST   | `/auth/login`                  | Login (JWT token)          | **Render** |
| GET    | `/profile`                     | Get logged-in user profile | **Render** |

---

### 👥 Teams

| Method | Endpoint             | Description                 | Hosted On |
| ------ | -------------------- | --------------------------- | --------- |
| POST   | `/teams`             | Create team                 | Render    |
| GET    | `/teams`             | Get all teams               | Render    |
| POST   | `/teams/:id`         | Update team                 | Render    |
| DELETE | `/teams/:id`         | Delete team                 | Render    |
| GET    | `/teams/:id/details` | Get team details            | Render    |
| GET    | `/teams/:id/tasks`   | Get team tasks with filters | Render    |

---

### 🏷 Tags

| Method | Endpoint    | Description  | Hosted On |
| ------ | ----------- | ------------ | --------- |
| POST   | `/tags`     | Create tag   | Render    |
| GET    | `/tags`     | Get all tags | Render    |
| DELETE | `/tags/:id` | Delete tag   | Render    |

---

### 📁 Projects

| Method | Endpoint              | Description       | Hosted On |
| ------ | --------------------- | ----------------- | --------- |
| POST   | `/projects`           | Create project    | Render    |
| GET    | `/projects`           | Get all projects  | Render    |
| GET    | `/projects/:id`       | Get project by ID | Render    |
| POST   | `/projects/:id`       | Update project    | Render    |
| DELETE | `/projects/:id`       | Delete project    | Render    |
| GET    | `/projects/:id/tasks` | Get project tasks | Render    |

---

### 📝 Tasks

| Method | Endpoint     | Description                       | Hosted On |
| ------ | ------------ | --------------------------------- | --------- |
| POST   | `/tasks`     | Create task                       | Render    |
| GET    | `/tasks`     | Get all tasks (filters & sorting) | Render    |
| GET    | `/tasks/:id` | Get task by ID                    | Render    |
| POST   | `/tasks/:id` | Update task                       | Render    |
| DELETE | `/tasks/:id` | Delete task                       | Render    |

---

### 📊 Reports

| Method | Endpoint               | Description              | Hosted On |
| ------ | ---------------------- | ------------------------ | --------- |
| GET    | `/report/last-week`    | Completed last week      | Render    |
| GET    | `/report/pending`      | Pending work summary     | Render    |
| GET    | `/report/closed-tasks` | Closed task distribution | Render    |

---

## 🛠 Tech Stack

### Backend

* Node.js
* Express.js

### Database

* MongoDB (Mongoose)

### Authentication & Security

* JWT (JSON Web Token) Authentication
* Email OTP Verification System
* Bcrypt Password Hashing

### Email & Notifications

* Nodemailer (Gmail SMTP)

### Deployment

* **Render** – Core APIs (tasks, teams, projects, reports, login)
* **Vercel** – OTP-based email authentication APIs

---


