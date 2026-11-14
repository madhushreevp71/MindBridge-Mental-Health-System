# MindBridge – Mental Health Support System

### A web application to support student mental well-being

## About the Project

MindBridge is a web-based platform developed to make mental health support more accessible to students.

College life can sometimes bring academic pressure, stress, anxiety, and other emotional challenges. However, many students hesitate to seek help or do not know where to start. We developed MindBridge to bring different mental health support features together in one place.

Through this application, students can track their mood, complete well-being check-ins, explore helpful resources, interact with a companion, and book appointments with doctors when needed.

The platform also provides separate dashboards for students, doctors, and administrators.

## Features

### 1. Student Features

- **Student Registration and Login:** Students can create an account and securely log in.
- **Dashboard:** Provides an overview of the student's activities and well-being.
- **Daily Check-in:** Allows students to record their mood and answer questions about how they are feeling.
- **Mood Tracking:** Students can track their mood over time and view their progress.
- **Well-being Journey:** Displays mood history and progress through visual representations.
- **Mental Health Companion:** Provides an interactive space where students can share their thoughts and receive supportive responses.
- **Breathing Exercises:** Includes guided breathing activities to help students relax.
- **Mental Health Resources:** Provides access to helpful information and self-care support.
- **Doctor Appointment Booking:** Students can view available doctors and request appointments.
- **Reminders and Notifications:** Helps students keep track of important activities and updates.

### 2. Doctor Features

- **Doctor Login:** Approved doctors can access their dedicated dashboard.
- **Caseload Management:** Doctors can view and manage their assigned student cases.
- **Appointment Management:** Doctors can view appointment requests and manage their schedules.
- **Student Information:** Provides relevant information to help doctors follow up with students.

### 3. Admin Features

- **Admin Dashboard:** Displays an overview of platform activity.
- **Doctor Verification:** Administrators can review and verify doctor registrations.
- **User Management:** Allows administrators to view and manage student and doctor accounts.
- **Platform Management:** Provides a central place to monitor the application's users and activities.

## Technology Stack

| Area              | Technologies                    |
| ----------------- | ------------------------------- |
| Frontend          | HTML, CSS, JavaScript           |
| Backend           | Node.js, Express.js             |
| Database          | MySQL                           |
| Authentication    | JSON Web Token (JWT), bcryptjs  |
| API               | REST APIs                       |
| Development Tools | Visual Studio Code, Git, GitHub |

## How the Application Works

1. Students register or log in to the application.
2. After logging in, they can access their personal dashboard.
3. They can complete daily check-ins and record their moods.
4. Their well-being journey helps them review their mood history and progress.
5. Students can use the mental health companion and breathing exercises for additional support.
6. If they need professional assistance, they can explore doctor appointments and submit a request.
7. Doctors manage their caseloads and appointment requests through their dashboard.
8. Administrators manage users and verify doctor accounts.

## Installation and Setup

Follow these steps to run MindBridge on your local system.

### Prerequisites

- Node.js (version 18 or above)
- npm
- MySQL 8 or MariaDB 10.6 and above
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/madhushreevp71/MindBridge-Mental-Health-System.git
```

### 2. Open the Project Folder

```bash
cd MindBridge-Mental-Health-System
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file using the `.env.example` file as a reference.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update the database credentials and other required configuration values in the `.env` file.

Keep your passwords, API keys, and secret values private. Do not upload your `.env` file to GitHub.

### 5. Set Up the Database

```bash
npm run db:setup
```

### 6. Start the Application

```bash
npm start
```

Open the following address in your browser:

```text
http://localhost:4000
```

## Project Structure

```text
MindBridge-Mental-Health-System/
│
├── database/
├── public/
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── ...
│
├── scripts/
├── server/
├── docs/
├── .env.example
├── package.json
└── README.md
```

## Application Screenshots

The following screenshots showcase the user interface and major features of MindBridge.

### 1. Login Page
<img width="1507" height="686" alt="WhatsApp Image 2026-11-14 at 12 02 11 PM" src="https://github.com/user-attachments/assets/eb924f5c-e0f9-4aec-99cc-93399cec1fe0" />


### 2. Student Dashboard
<img width="1512" height="690" alt="WhatsApp Image 2026-11-14 at 12 09 04 PM" src="https://github.com/user-attachments/assets/def0ad71-5fe4-4b2f-967a-023299d06922" />


### 3. Mood Tracking and Well-being Journey
<img width="1519" height="685" alt="WhatsApp Image 2026-11-14 at 12 05 52 PM" src="https://github.com/user-attachments/assets/fb09d300-3ef7-409e-9384-0ef042c4760c" />


### 4. Daily Check-in
<img width="1502" height="685" alt="WhatsApp Image 2026-11-14 at 12 06 33 PM" src="https://github.com/user-attachments/assets/149c6551-2524-4f8d-9825-9131b338d918" />

### 5. Mental Health Assessment
<img width="1534" height="675" alt="WhatsApp Image 2026-11-14 at 12 07 00 PM" src="https://github.com/user-attachments/assets/0bcd6c91-7f12-4bfa-b395-bb5baed4f2ae" />


### 6. Mental Health AI Companion
<img width="1517" height="674" alt="WhatsApp Image 2026-11-14 at 12 07 59 PM" src="https://github.com/user-attachments/assets/2b0ffe11-21e8-4c74-8371-627b8d110dde" />


### 7. Guided Breathing Exercise
<img width="1530" height="646" alt="WhatsApp Image 2026-11-14 at 12 10 53 PM" src="https://github.com/user-attachments/assets/1a5786c9-d8ac-432d-a86a-b663c63724b7" />


### 8. Doctor Appointment Booking
<img width="1490" height="652" alt="image" src="https://github.com/user-attachments/assets/75ebe8b3-2485-4f1a-9baf-dfa1e6699075" />


### 9. Doctor Dashboard
<img width="1526" height="644" alt="WhatsApp Image 2026-11-14 at 12 12 32 PM" src="https://github.com/user-attachments/assets/7b96ad6a-afd0-4551-a4f9-1542a2941d2d" />


### 10. Appointment Management
<img width="1530" height="675" alt="WhatsApp Image 2026-11-14 at 12 13 01 PM" src="https://github.com/user-attachments/assets/3580fb93-6eec-4db8-a89e-81c19cb0b832" />

### 11. Admin accesssability
<img width="1534" height="662" alt="image" src="https://github.com/user-attachments/assets/40b04441-3ccd-479a-9c17-14324722cbbe" />

### 12. Verification and approval by admin
<img width="1507" height="678" alt="WhatsApp Image 2026-11-14 at 12 15 08 PM" src="https://github.com/user-attachments/assets/d2c074c4-0de8-49dd-bfae-557ce49da38d" />

## My Contribution

My main responsibilities included:

- Working on the frontend and application interface.
- Integrating APIs with the application.
- Debugging issues and checking whether the different features worked as expected.
- Coordinating with team members during development.
- Helping integrate and test the different parts of the application.

Working on this project gave me practical experience in developing a web application and connecting its frontend, backend, and database. It also helped me improve my leadership, communication, teamwork, and problem-solving skills.

## Future Enhancements

Some features that could be added in future versions are:

- Online video consultations with doctors.
- More personalized mental health recommendations.
- Additional language support.
- Improved progress reports and well-being insights.
- More accessibility features.
- Additional options for communication between students and doctors.

*Developed as an academic team project to make mental health support easier for students to access.*
