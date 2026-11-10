# 🌅 Jagriti – Smart Alarm & Reminder App

> **Wake. Remember. Grow.**

Jagriti is a full-stack smart alarm and reminder application designed to make waking up more engaging and productive.

Instead of simply dismissing an alarm, Jagriti allows users to complete different **wake-up challenges**, including mathematical problems, memory tasks, walking, dancing, speaking, custom activities, and camera-based physical exercises such as **Squats, Push-ups, and Jumping Jacks**.

The application combines **React, Node.js, Express.js, MongoDB, JWT authentication, and MediaPipe computer vision** to provide an interactive alarm experience.

---

## ✨ Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Password hashing
- Protected API routes
- User-specific alarms and reminders

### ⏰ Smart Alarms
- Create, edit, delete, and toggle alarms
- Repeating alarm schedules
- Custom alarm sound
- Snooze functionality
- Vibration support
- Configurable wake-up missions
- Alarm activity tracking

### 🧠 Wake-Up Challenges

Users can configure challenges that must be completed to finish an alarm:

- ➗ **Math** – Solve mathematical problems
- 🧩 **Memory** – Complete memory-based challenges
- 🚶 **Walk** – Complete a movement/step-based challenge
- 💃 **Dance** – Follow a dance activity
- 🎤 **Speaking** – Complete a speaking challenge
- 📝 **Custom** – User-defined activity
- 🏋️ **Squats** – Camera-based repetition counting
- 💪 **Push-ups** – Camera-based repetition counting
- 🤸 **Jumping Jacks** – Camera-based repetition counting

Physical activities have configurable targets, with **15 repetitions as the default target**.

---

## 🏋️ Computer Vision-Based Exercise Tracking

Jagriti uses **MediaPipe Pose Landmarker** to detect body landmarks directly in the browser.

The system analyzes body movements to count exercise repetitions.

### Squats
The application detects a transition from:

**Standing → Low Position → Standing**

using knee-angle changes.

### Push-ups
The application analyzes:

- Elbow bending
- Elbow extension
- Shoulder and hip alignment

to identify push-up repetitions.

### Jumping Jacks
The system detects the movement cycle:

**Arms & Legs Together → Arms & Legs Apart → Together**

to count repetitions.

Pose detection runs locally in the browser, and captured camera frames are **not uploaded by Jagriti**.

---

## 💃 Dance Challenge

The Dance challenge uses a built-in original procedural synth track.

Users cannot upload or select external songs.

The application uses:

- MediaPipe Pose Landmarker
- Browser camera
- Local pose processing
- Original Jagriti dance track

The dance track is available at:

```text
client/public/audio/jagriti-dance-track.wav
```

---

## 📊 Activity Tracking & Insights

Jagriti records completed challenge results and provides activity-based insights.

The system tracks information such as:

- Challenge type
- Target repetitions
- Completed repetitions
- Duration
- Score
- Detection method
- Alarm activity

Physical activity totals can be viewed through the **Insights** section.

---

## 📝 Reminders

Users can manage personal reminders through:

- Create reminder
- Edit reminder
- Delete reminder
- Mark reminder as completed
- Set priority

---

## 😴 Sleep Goal Calculator

Jagriti also provides a sleep goal calculator to help users plan their sleep and wake-up schedule.

---

## ⚙️ Settings

Users can manage:

- Account settings
- Profile information
- Appearance preferences
- Application settings
- User data

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- HTML5
- CSS
- MediaPipe Tasks Vision
- Browser APIs

### Backend
- Node.js
- Express.js
- JWT
- REST APIs
- bcrypt/password hashing

### Database
- MongoDB
- MongoDB Atlas

### Computer Vision
- MediaPipe Pose Landmarker
- MediaPipe Tasks Vision
- Browser Camera API

### Development Tools
- Git
- GitHub
- npm

---

## 🏗️ Project Structure

```text
Jagriti-Alaram-App/
│
├── client/
│   ├── public/
│   │   └── audio/
│   │       └── jagriti-dance-track.wav
│   │
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       │   └── poseRepetitions.js
│       └── ...
│
├── server/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   └── ...
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- **Node.js 20+**
- **MongoDB** or a MongoDB Atlas database
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/varshathammegowda/Jagriti-Alaram-App.git
```

Move into the project:

```bash
cd Jagriti-Alaram-App
```

---

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example server/.env
```

Then configure your MongoDB connection and JWT secret.

Example:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret
```

Do **not** commit your actual `.env` file to GitHub.

---

### 3. Install Dependencies

Install root dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
npm --prefix server install
```

Install frontend dependencies:

```bash
npm --prefix client install
```

---

### 4. Start the Application

From the project root:

```bash
npm run dev
```

The application will run with:

```text
Frontend: http://localhost:5173
Backend:  http://localhost
