
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

| Method | Endpoint                       | Description                |
| ------ | ------------------------------ | -------------------------- |
| POST   | `/auth/signup`                 | Send signup OTP            |
| POST   | `/auth/verify-signup`          | Verify signup OTP          |
| POST   | `/auth/resend-signup-otp`      | Resend signup OTP          |
| POST   | `/auth/login`                  | Login (JWT token)          |
| POST   | `/auth/forgot-password`        | Send forgot password OTP   |
| POST   | `/auth/verify-forgot-password` | Verify forgot password OTP |
| POST   | `/auth/reset-password`         | Reset password             |
| GET    | `/profile`                     | Get logged-in user profile |


---

### 👥 Teams

| Method | Endpoint             | Description                 |
| ------ | -------------------- | --------------------------- |
| POST   | `/teams`             | Create team                 |
| GET    | `/teams`             | Get all teams               |
| POST   | `/teams/:id`         | Update team                 |
| DELETE | `/teams/:id`         | Delete team                 |
| GET    | `/teams/:id/details` | Get team details            |
| GET    | `/teams/:id/tasks`   | Get team tasks with filters |


---

### 🏷 Tags

| Method | Endpoint    | Description  |
| ------ | ----------- | ------------ |
| POST   | `/tags`     | Create tag   |
| GET    | `/tags`     | Get all tags |
| DELETE | `/tags/:id` | Delete tag   |


---

### 📁 Projects

| Method | Endpoint              | Description       |
| ------ | --------------------- | ----------------- |
| POST   | `/projects`           | Create project    |
| GET    | `/projects`           | Get all projects  |
| GET    | `/projects/:id`       | Get project by ID |
| POST   | `/projects/:id`       | Update project    |
| DELETE | `/projects/:id`       | Delete project    |
| GET    | `/projects/:id/tasks` | Get project tasks |


---

### 📝 Tasks

| Method | Endpoint     | Description                       |
| ------ | ------------ | --------------------------------- |
| POST   | `/tasks`     | Create task                       |
| GET    | `/tasks`     | Get all tasks (filters & sorting) |
| GET    | `/tasks/:id` | Get task by ID                    |
| POST   | `/tasks/:id` | Update task                       |
| DELETE | `/tasks/:id` | Delete task                       |


---

### 📊 Reports

| Method | Endpoint               | Description              |
| ------ | ---------------------- | ------------------------ |
| GET    | `/report/last-week`    | Completed last week      |
| GET    | `/report/pending`      | Pending work summary     |
| GET    | `/report/closed-tasks` | Closed task distribution |


---

## 🛠 Tech Stack

### Backend
- Node.js  
- Express.js  

### Database
- MongoDB (Mongoose)

### Authentication & Security
- JWT (JSON Web Token) Authentication  
- Email OTP Verification System  
- Bcrypt Password Hashing  

### Email & Notifications
- Nodemailer (Gmail SMTP)

### Deployment
- Vercel (Backend Hosting)

---



