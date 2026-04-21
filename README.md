# 🚀 Gradious Career Portal

## 📌 Project Overview

Gradious Career Portal is a **full-stack recruitment management system** designed to streamline the hiring process within an organization.
It enables **Admins, Recruiters, and Users (Job Seekers)** to interact through a structured workflow for job posting, application, and tracking.

---

## 👥 User Roles & Features

### 🔹 Admin

* Manage users and recruiters
* Invite recruiters via email (secure token-based signup)
* View and manage all jobs and applications
* Dashboard with system statistics
* Receive notifications for activities

### 🔹 Recruiter

* Signup via admin invitation
* Post and manage job openings
* View applications for their jobs
* Shortlist or reject candidates
* Dashboard with job and application insights

### 🔹 User (Job Seeker)

* Register and login
* Browse available jobs
* View job details
* Apply for jobs with resume upload
* Track application status (Pending / Shortlisted / Rejected)

---

## 🛠️ Tech Stack

### Frontend

* HTML
* CSS
* JavaScript
* React JS

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Tools & Libraries

* JWT (Authentication)
* Multer (File Upload - Resume)
* Nodemailer (Email Invitations)
* Postman (API Testing)
* Git & GitHub (Version Control)

---

## 🔐 Key Features

* 🔑 Role-Based Authentication & Authorization (JWT)
* 📩 Recruiter Invitation System (Email-based signup)
* 📄 Resume Upload using Multer
* 🚫 Duplicate Job Application Prevention
* 📊 Dashboard Analytics (Admin & Recruiter)
* 🔔 Notification System
* 📁 Structured Backend with Controllers & Middleware

---

## 🔄 Project Flow

1. User visits portal and registers/logs in
2. Admin invites recruiters via email
3. Recruiters post jobs
4. Users browse and apply for jobs
5. Recruiters review applications and update status
6. Users track their application status
7. Admin monitors complete system

---

## 🗂️ Project Structure

```
gradious-career-portal
│
├── career-portal-backend
├── career-portal-frontend
├── career-portal-react
├── README.md
└── .gitignore
```

---

## ▶️ How to Run the Project

### Backend

```
cd career-portal-backend
npm install
npm start
```

### Frontend (React)

```
cd career-portal-react
npm install
npm start
```

---

## ⚙️ Environment Setup

Create a `.env` file in backend folder and add:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=career_portal
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 💡 Challenges Faced

* Authentication and JWT handling issues
* API integration and testing errors
* Database relationships and foreign key constraints
* Duplicate data handling
* Improving UI and user experience

---

## 👩‍💻 My Contribution

I developed the complete project including:

* Frontend UI design
* Backend API development
* Database integration
* Authentication & Authorization
* Recruiter invitation system
* Job and application modules
* Resume upload functionality
* Dashboard and notification features

---

## 🔗 GitHub Repository

👉 https://github.com/swathichinnu151004-dotcom/gradious-career-portal-final

---

## 📌 Future Enhancements

* Deploy project (AWS / Render / Vercel)
* Add search & filter for jobs
* Improve UI with advanced React features
* Add real-time notifications
* Implement pagination

---

## ⭐ Conclusion

This project demonstrates my ability to build a **full-stack application** with real-world features like authentication, role-based access, file uploads, and email integration.

---

