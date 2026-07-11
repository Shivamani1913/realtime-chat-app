# Real-Time Chat App

A real-time chat application built with **React (Vite)** on the frontend and
**Node.js + Express + Socket.io** on the backend, with **SQLite** for
persistence. Messages are delivered instantly to all connected clients and
survive a page refresh.
chat-app/
├── backend/            Express + Socket.io + SQLite API
│   ├── server.js        entrypoint
│   ├── src/
│   │   ├── config/db.js         SQLite connection + schema
│   │   ├── models/Message.js    data access layer
│   │   ├── controllers/         request handlers
│   │   ├── routes/              REST route definitions
│   │   └── socket/socketHandler.js  all Socket.io events
│   └── .env.example
└── frontend/           React (Vite) SPA
├── src/
│   ├── components/   Login, ChatHeader, MessageList, MessageBubble, MessageInput, ErrorBanner
│   ├── hooks/useChat.js   all chat state + socket wiring
│   ├── utils/         api.js (REST), socket.js (socket.io client)
│   └── App.jsx
└── .env.example

## 1. Setup and Run

### Requirements
- Node.js 18+
- npm

### Backend
cd backend
copy .env.example .env
npm install
npm run dev

The API and Socket.io server start on http://localhost:5000 by default.
An SQLite database file is created automatically at backend/data/chat.db
on first run.

### Frontend
cd frontend
copy .env.example .env
npm install
npm run dev

Open http://localhost:5173. Enter a username to join the chat. Open a
second browser tab (or an incognito window) with a different username to
see real-time delivery between two users.

### Environment variables

backend/.env
- PORT: Port the API/Socket.io server listens on. Default 5000.
- CLIENT_ORIGIN: Allowed CORS origin(s), comma-separated. Default http://localhost:5173
- DB_PATH: Path to the SQLite database file. Default ./data/chat.db

frontend/.env
- VITE_API_URL: Base URL of the backend API/socket. Default http://localhost:5000

## 2. API Reference

- GET /health - health check
- GET /api/messages?room=&limit=&offset= - fetch chat history
- POST /api/messages { username, text, room? } - send a message (also broadcasts)

### Socket.io events (client to server)
- user:join { username, room }
- message:send { text, room }
- typing:start { room }
- typing:stop { room }

### Socket.io events (server to client)
- message:new - new message broadcast
- users:online - list of online users in the room
- user:joined / user:left - presence notifications
- typing:update { username, isTyping }
- error:message - server-side validation error

## 3. Design Decisions

- React (web) instead of React Native, since a full mobile build toolchain
  (Android Studio / Xcode) was not practical to set up for this exercise.
  The architecture (REST + Socket.io + a single useChat hook) is UI-framework
  agnostic, so porting the screens to React Native would mainly involve
  swapping HTML elements for View/Text/TextInput components.
- SQLite via better-sqlite3 for persistence instead of an external database
  service. Requires no separate install, keeps setup to npm install, and
  is simple/synchronous which suits a small single-process chat server.
- Dual-write pattern: both POST /api/messages and the message:send socket
  event go through the same Message.create() function and both broadcast
  via Socket.io, so REST-only clients and socket clients stay in sync.
- Single global room (general). The schema already carries a room field
  for future multi-room support, but the UI only exposes one room.
- Dummy auth = username only, no password/session/JWT. Matches the bonus
  requirement for "username-based login (dummy authentication)."
- In-memory presence map (a JS Map keyed by socket id) tracks online users.
  Simple and sufficient for a single-instance server; a scaled deployment
  would use Redis instead.
- Client-side resilience: if the socket is disconnected when sending, the
  app falls back to the REST endpoint so the message still gets through.

## 4. Assumptions

- A single shared/public chat room is sufficient (no DMs or multiple rooms).
- "Username-based login" means no password and no persisted account; a
  fresh username per browser session is acceptable.
- Message history pagination (limit/offset) is implemented on the API, but
  the UI just loads the most recent 100 messages on load.
- Read/delivered receipts were treated as optional bonus scope and were
  not implemented, to keep the core requirements solid within the time
  available.

## 5. Bonus Features Implemented

- Username-based login (dummy authentication)
- Typing indicator
- Online/offline user status
- Messages persisted in SQLite
- Message read/delivered status - not implemented
- Deployment to Render/Railway - not performed; see below for steps

## 6. Deploying

Backend (Render/Railway, etc.):
1. Push backend/ to a GitHub repo.
2. Create a new Web Service pointing at that repo/subfolder.
3. Build command: npm install. Start command: npm start.
4. Set env vars PORT, CLIENT_ORIGIN (your deployed frontend URL), and DB_PATH.

Frontend (Vercel/Netlify, etc.):
1. Set VITE_API_URL to your deployed backend URL.
2. Build command: npm run build. Output directory: dist/.

## 7. Testing Performed

- Backend REST endpoints (GET/POST /api/messages, validation errors,
  /health) verified with curl and PowerShell Invoke-RestMethod.
- Full real-time flow verified manually across two browser tabs: join,
  typing indicator, message broadcast, and online-user list all confirmed
  working end-to-end.
- Message persistence confirmed by refreshing the browser and re-fetching
  history.
- Frontend production build (npm run build) compiles cleanly.
