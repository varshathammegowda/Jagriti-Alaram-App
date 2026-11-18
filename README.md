# 🌅 Jagriti – Smart Alarm & Reminder App

> **Wake. Remember. Grow.**

Jagriti is a full-stack smart alarm and reminder application designed to make waking up more engaging and productive.

Instead of simply dismissing an alarm, Jagriti allows users to complete different **wake-up challenges**, including mathematical problems, memory tasks, walking, dancing, speaking, custom activities, and camera-based physical exercises such as **Squats, Push-ups, and Jumping Jacks**.

The application combines **React, Node.js, Express.js, MongoDB, JWT authentication, and MediaPipe computer vision** to provide an interactive alarm experience.

<<<<<<< HEAD
---

## ✨ Features
=======
1. Copy `server/.env.example` to `server/.env` and set `MONGO_URI` and a strong `JWT_SECRET`.
2. Run `npm install` in the root, `server`, and `client` directories.
3. Run `npm run dev` from the project root. API is on port 5000; Vite is on 5173.

The frontend sends API requests through the shared Axios client in `client/src/services/api.js`. Set `VITE_API_URL` to the backend API base URL ending in `/api` (for example, `https://your-render-service.onrender.com/api`). `client/.env.example` shows a local value; copy it to `client/.env.local` for local use. Vite embeds this value in the frontend build, so configure it in Vercel before deploying or rebuilding.

`CLIENT_URL` controls allowed browser origins and accepts a comma-separated list. In production, set it to the exact Vercel frontend origin (for example, `https://your-app.vercel.app`, without a trailing slash). Local development allows Vite origins on ports 5173 and 5174. The server requires `MONGO_URI` and `JWT_SECRET` and exits with an error if required production configuration is missing.

## Production deployment

### Render backend

- Create a **Web Service** from this repository.
- Root Directory: `server`
- Runtime: **Node**
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Environment: `NODE_ENV=production`, `CLIENT_URL=https://your-app.vercel.app`, `MONGO_URI=<Atlas connection string>`, and `JWT_SECRET=<long random secret>`.
- Do not set `PORT`; Render supplies it. The app listens on `0.0.0.0` and uses `process.env.PORT` (with 5000 as its local default).

### Vercel frontend

- Import this repository as a Vercel project.
- Root Directory: `client`
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_API_URL=https://<your-render-service>.onrender.com/api` for Production (and Preview if preview deployments should reach the same API).

`client/vercel.json` rewrites browser route requests to the SPA entry point so React Router deep links work after refresh. After the first deployment, update Render's `CLIENT_URL` to the actual Vercel production origin. If using a custom domain, include that exact origin too (comma separated).

### MongoDB Atlas

Create a database user with a strong password, add Render's outbound IP access or use Atlas's network access option appropriate for the Render plan, and use the Atlas `mongodb+srv://` URI as `MONGO_URI`. Ensure the URI's database name is set (for example, `/jagriti`) and URL-encode special characters in the username or password. Never put this URI in a Vite variable or commit it.
>>>>>>> e396bdb (Changes)

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
