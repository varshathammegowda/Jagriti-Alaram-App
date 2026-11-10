# Jagriti

Smart alarm and reminder application. Wake. Remember. Grow.

## Features
- JWT registration and login with hashed passwords
- User-owned alarms with repeating schedules, sound, snooze, vibration and mission settings
- Sequential wake-up challenges: Math, Memory, Walk, Dance, Speaking, Custom, plus camera-counted Squats, Push-ups, and Jumping Jacks
- Per-alarm physical activity targets (15 reps by default) and challenge completion records in MongoDB
- Reminder CRUD, completion and priority
- Alarm activity tracking and insights based on real activity data
- Sleep goal calculator, account settings and appearance preferences
- Responsive React interface with browser notifications when permitted

Web alarms can only run while the app is open in a browser tab. Browser/device shutdown cannot guarantee alarm delivery. A future native Android client can use platform alarm APIs against the same API.

## Requirements and setup
Node.js 20+ and MongoDB (local or Atlas).

1. Copy `.env.example` to `server/.env` and set `MONGO_URI` and a strong `JWT_SECRET`.
2. Run `npm install`, `npm --prefix server install`, and `npm --prefix client install`.
3. Run `npm run dev` from the project root. API is on port 5000; Vite is on 5173.

`CLIENT_URL` controls the allowed browser origin and accepts a comma-separated list. During local development, private-network frontend origins on Vite ports 5173 and 5174 are allowed so the app can be opened from another device on the same Wi-Fi. The client uses the current page's hostname for the API by default; set `VITE_API_URL` when frontend and API use different hosts in production. No database or production JWT secret is included in this repository.

## Dance challenge and music rights
The Dance challenge always plays `client/public/audio/jagriti-dance-track.wav`; users cannot choose, upload, or link songs. This short loop is an original procedural synth track generated specifically for Jagriti, with no third-party samples or recordings. Its source and authorship note are in `client/public/audio/README.md`.

Dance uses the Apache-2.0 `@mediapipe/tasks-vision` package and the MediaPipe Pose Landmarker Lite model. Pose inference runs on the user's device. The web app downloads the MediaPipe WASM runtime from jsDelivr and the model from Google's MediaPipe model storage when the challenge starts, so an internet connection is required for the first load. Camera permission is required; captured frames are not uploaded by Jagriti. MediaPipe may send product usage metrics as described by its privacy notice.

Physical activity challenges use MediaPipe body landmarks locally in the browser. Squats count a visible knee-angle transition from standing to a low position and back; Push-ups count elbow bend/extension while the shoulders and hips remain aligned; Jumping Jacks count the arms-and-legs-apart cycle back to a together position. Visibility, angle, and cycle-duration thresholds are adjustable in `client/src/utils/poseRepetitions.js`. The browser sends only a challenge result (type, target, count, duration, score, and detection method) to the authenticated API. Result records are stored in the existing `AlarmActivity` collection and physical totals appear in Insights. The backend checks that each result matches the alarm's configured challenge and target and will reject completion of an alarm session until every configured challenge has a result.

Walk uses device motion data where the browser exposes it; the step count is a lightweight sensor heuristic, not a medical-grade pedometer. Speaking uses the browser SpeechRecognition API where available; support varies by browser, and speech recognition may use the browser provider's service. Jagriti stores speaking duration, not the transcript. Custom activities use a user-named timer and are self-guided.

Pose thresholds and browser sensor behavior still need hands-on testing with a real camera and representative mobile devices. Camera challenges require camera permission and a secure context (localhost or HTTPS). Users should keep their whole body visible and use a clear, well-lit space.

## API
`/api/auth` register, login, me; `/api/alarms` alarm CRUD and toggle, alarm activity, and authenticated challenge-result recording; `/api/reminders` reminder CRUD and complete; `/api/insights` activity-backed statistics; `/api/users` profile/settings and data clear operations. All resource routes require `Authorization: Bearer <token>`.
