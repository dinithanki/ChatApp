# Chat Mania()

Chat Mania is a full-stack real-time chat application built with a Vite + React frontend and an Express + MongoDB backend. It supports account creation, authentication, profile updates, contact management, friend requests, one-to-one messaging, online presence, and live updates with Socket.IO.

## Features

- Secure sign up, login, logout, and session restoration with HTTP-only JWT cookies.
- Profile image upload through Cloudinary.
- Friend request workflow with pending, sent, accept, reject, block, unblock, and delete contact actions.
- Contact-based conversations, including recent conversation ordering.
- Real-time messaging with Socket.IO.
- Online user presence updates.
- Protected routes on both the frontend and backend.
- Theme support and toast notifications in the UI.

## Tech Stack

- Frontend: React 19, Vite, React Router, Zustand, Axios, Tailwind CSS, DaisyUI, React Hot Toast, Socket.IO Client.
- Backend: Node.js, Express 5, MongoDB, Mongoose, Socket.IO, JWT, bcrypt, Cloudinary, CORS, cookie-parser, dotenv.

## Project Structure

```text
Chat Mania/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── constants/
    │   ├── lib/
    │   ├── pages/
    │   └── store/
    ├── public/
    └── package.json
```

## How It Works

The backend exposes REST endpoints for authentication, messages, and friend management. It also hosts the Socket.IO server used for real-time events such as new messages, online user updates, and friend request notifications.

The frontend reads the authenticated user from the backend, connects to Socket.IO after login, and keeps chat and friend data synchronized through Zustand stores.

## Prerequisites

- Node.js 18 or newer.
- MongoDB database connection string.
- Cloudinary account for profile picture uploads and message image uploads.

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd chat-mania
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

## Environment Variables

Create `.env` files in each folder with the following variables.

### Backend: backend/.env

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:5173
PORT=5001
NODE_ENV=development
```

### Frontend: frontend/.env

```env
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
VITE_API_TIMEOUT=30000
VITE_DEBUG_MODE=false
VITE_SOCKET_RECONNECT_DELAY=1000
VITE_SOCKET_RECONNECT_DELAY_MAX=5000
VITE_SOCKET_RECONNECT_ATTEMPTS=5
VITE_TOAST_DURATION=3000
```

For deployment, set `VITE_API_URL` to the backend origin only, for example `https://your-backend.onrender.com`. Do not append `/api`; the app adds that path automatically. If the frontend is hosted on Vercel, make sure Render's `FRONTEND_URL` matches the exact live frontend origin, or add it to `CORS_ORIGINS`.

Note: the frontend proxies API and Socket.IO traffic to the backend URL configured in `VITE_API_URL` and `VITE_SOCKET_URL`. Keep those values aligned with the backend port you actually run.

## Running Chat Mania

Open two terminals.

### Backend

```bash
cd backend
npm run dev
```

By default, the backend listens on `http://localhost:5001` unless `PORT` is set.

### Frontend

```bash
cd frontend
npm run dev
```

Vite usually starts on `http://localhost:5173`.

## Available Scripts

### Backend

- `npm run dev` - start the API server with Nodemon.

### Frontend

- `npm run dev` - start the Vite development server.
- `npm run build` - build the production frontend bundle.
- `npm run lint` - run ESLint checks.
- `npm run preview` - preview the production build locally.

## API Overview

### Authentication

- `POST /api/auth/signup` - create an account.
- `POST /api/auth/login` - log in.
- `POST /api/auth/logout` - log out.
- `PUT /api/auth/update-profile` - update the profile picture.
- `GET /api/auth/check` - validate the current session.

### Messages

- `GET /api/messages/users` - fetch users available in the sidebar.
- `GET /api/messages/conversations/recent` - fetch recent conversations.
- `GET /api/messages/:id` - fetch messages for a contact.
- `POST /api/messages/send/:id` - send a message to a contact.

### Friends

- `GET /api/friends/status/:userId` - fetch friendship status.
- `POST /api/friends/send/:receiverId` - send a friend request.
- `GET /api/friends/pending` - list pending requests received.
- `GET /api/friends/sent` - list pending requests sent.
- `POST /api/friends/accept/:requestId` - accept a request.
- `DELETE /api/friends/reject/:requestId` - reject a request.
- `GET /api/friends/contacts` - list contacts.
- `GET /api/friends/blocked` - list blocked users.
- `DELETE /api/friends/delete/:contactId` - delete a contact.
- `POST /api/friends/block/:contactId` - block a contact.
- `POST /api/friends/unblock/:contactId` - unblock a contact.

## Frontend Routes

- `/` - chat home page for authenticated users.
- `/signup` - registration page.
- `/login` - login page.
- `/settings` - Chat Mania settings.
- `/profile` - user profile.
- `/users` - all users view.
- `/contacts` - contacts and friend management.

## Real-Time Events

Chat Mania uses Socket.IO for:

- online user presence tracking,
- new message delivery,
- friend request received/sent/accepted/rejected notifications,
- contact unblock updates.

## Notes

- Messages are restricted to contacts only.
- Friend relationships are required before messaging.
- Profile and message images are uploaded to Cloudinary.
- Authentication relies on a cookie named `jwt`.

## Contributing

If you extend Chat Mania, keep the README in sync with new routes, environment variables, and scripts so deployment and local setup stay reproducible.
