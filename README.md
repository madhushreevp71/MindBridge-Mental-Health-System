# 🌿 MindBridge – Mental Health Support System

### Bridging the Gap Between Students and Mental Health Support

**MindBridge** is a web-based mental wellness platform designed to make mental health support more accessible to students. It provides a centralized space where students can monitor their emotional well-being, track their moods, access self-care resources, interact with a mental health companion, and connect with professional doctors.

---

## 📌 About the Project

College life can sometimes bring academic pressure, stress, anxiety, and other emotional challenges. However, many students hesitate to seek help or do not know where to start.

To address this problem, we developed **MindBridge**, a web application that brings multiple mental health support features together in one platform.

The application encourages students to understand their emotions, maintain healthy habits, and seek professional assistance when required.

MindBridge provides three separate interfaces for:

- **Students:** To monitor their mental well-being and access support.
- **Doctors:** To manage student cases and appointment requests.
- **Administrators:** To manage users and verify doctor registrations.

Our goal is to make mental health support easier to access through a simple, user-friendly, and organized digital platform.

---

## ✨ Key Features

### 👩‍🎓 1. Student Module

- **Student Registration and Login:** Allows students to create accounts and securely access the platform.
- **Student Dashboard:** Provides an overview of activities and well-being information.
- **Daily Check-in:** Enables students to record their mood and answer questions about how they are feeling.
- **Mood Tracking:** Helps students monitor their emotional patterns over time.
- **Well-being Journey:** Displays mood history and progress through visual representations.
- **Mental Health Companion:** Provides an interactive space where students can share their thoughts and receive supportive responses.
- **Breathing Exercises:** Offers guided breathing activities to encourage relaxation.
- **Mental Health Resources:** Provides useful information and self-care resources.
- **Doctor Appointment Booking:** Allows students to explore available doctors and request appointments.
- **Reminders and Notifications:** Keeps students informed about important activities and updates.

### 🩺 2. Doctor Module

- **Doctor Login:** Approved doctors can access their dedicated dashboard.
- **Caseload Management:** Allows doctors to view and manage assigned student cases.
- **Appointment Management:** Enables doctors to review appointment requests and manage schedules.
- **Student Information:** Provides relevant student information for follow-up and support.

### 🛡️ 3. Admin Module

- **Admin Dashboard:** Displays an overview of platform activities.
- **Doctor Verification:** Allows administrators to review and verify doctor registrations.
- **User Management:** Enables administrators to view and manage student and doctor accounts.
- **Platform Management:** Provides centralized management of application users and activities.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JSON Web Token (JWT) |
| Password Security | bcryptjs |
| API Communication | REST APIs |
| Development Environment | Visual Studio Code |
| Version Control | Git and GitHub |

---

## 🏗️ System Architecture

MindBridge follows a three-tier web application architecture.

### 1. Presentation Layer
- Developed using HTML, CSS, and JavaScript.
- Provides interactive interfaces for students, doctors, and administrators.
- Communicates with the backend through API requests.

### 2. Application Layer
- Developed using Node.js and Express.js.
- Handles application logic and user requests.
- Manages authentication, authorization, and application operations.
- Provides REST APIs for communication between frontend and backend.

### 3. Database Layer
- Uses MySQL to store application data.
- Manages student information, doctor details, mood records, appointments, and other application data.

### Architecture Flow

```text
          USERS
            |
            |
   ---------------------
   |         |         |
 Student   Doctor    Admin
   |         |         |
   ---------------------
            |
            |
      FRONTEND LAYER
     HTML, CSS, JavaScript
            |
            |
        REST APIs
            |
            |
      BACKEND LAYER
       Node.js
      Express.js
            |
            |
    Authentication
       JWT
    Password Hashing
      bcryptjs
            |
            |
      DATABASE LAYER
          MySQL
```

---

## 🔄 How the Application Works

1. Students register or log in to the MindBridge application.
2. After successful authentication, students are redirected to their personal dashboard.
3. Students complete daily check-ins by recording their moods and answering well-being questions.
4. The application maintains mood records to help students review their emotional patterns.
5. Students can explore their well-being journey through visual representations.
