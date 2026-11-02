# 🎨 CrewBoard

<div align="center">

![CrewBoard Banner](frontend/public/logo.png)

### Real-time Collaborative Digital Whiteboard
*Ultra-low-latency vector whiteboard powered by React 19, Socket.IO, Redis in-memory caching, MongoDB Atlas, Docker, and Kubernetes.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://crewboard-app-beta.vercel.app)
[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-pranav1306%2Fcrewboard-blue?style=for-the-badge&logo=docker)](https://hub.docker.com/r/pranav1306/crewboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 🌐 Live Deployments

| Component | Platform | URL |
| :--- | :--- | :--- |
| **Frontend Web App** | Vercel (SPA) | [https://crewboard-app-beta.vercel.app](https://crewboard-app-beta.vercel.app) |
| **Backend API & WebSockets** | Render | [https://crewboard-api.onrender.com](https://crewboard-api.onrender.com) |
| **Docker Hub Registry** | Docker Hub | `pranav1306/crewboard:frontend`<br>`pranav1306/crewboard:backend` |

---

## ✨ Features

- **⚡ Real-time Multi-User Collaboration**: Live streaming strokes and cursor movements across all active participants via Socket.IO.
- **🚀 Sub-Millisecond Redis Caching**:
  - **Cache-Aside & Write-Through** caching for board strokes—loading 1,000+ stroke boards in `< 2ms` from RAM.
  - **Distributed User Presence**: Active users tracked via Redis Hashes (`HSET`, `HDEL`, `HVALS`) enabling horizontal multi-instance scaling.
- **🖌️ Full Vector Drawing Suite**:
  - Freehand pencil with pressure simulation.
  - Geometry tools: Lines, sharp arrows, rectangles, ellipses.
  - In-place text editor with live typing broadcast.
  - Laser eraser and stroke deletion.
  - Color palettes, stroke width adjustments, and canvas zoom/pan.
- **↩️ Multi-level Undo / Redo**: Robust command history stack synchronized with canvas state.
- **🖼️ High-Res PNG Export**: One-click custom-named canvas snapshot export.
- **🔒 Google OAuth 2.0 Authentication**: Seamless centered popup window authentication with `postMessage` auto-close and 7-day persistent session cookies.
- **👥 Room Access Control**: Private and public boards, instant shareable invite links, and role differentiation (**Owner** vs. **Member**).
- **🐳 Enterprise Containerization**: Docker multi-stage builds (React + Nginx) and full Kubernetes manifests with health probes and Nginx Ingress.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, HTML5 2D Canvas API, Lucide React, Vanilla CSS Modules
- **Backend**: Node.js, Express 5, Socket.IO
- **In-Memory Cache**: Redis Cloud / `node-redis`
- **Database**: MongoDB Atlas with Mongoose
- **DevOps & Orchestration**: Docker, Docker Compose, Kubernetes (K8s)
- **Deployment**: Vercel (Frontend), Render (Backend)

---

## 🚀 Getting Started

You can run CrewBoard in **3 different ways**:
1. [Kubernetes (Recommended for Production & Clusters)](#1-deploy-with-kubernetes-k8s)
2. [Docker Compose (Fastest Full-Stack Local Setup)](#2-run-with-docker-compose)
3. [Local Bare-Metal Development](#3-local-bare-metal-development)

---

### 1. Deploy with Kubernetes (`k8s/`)

CrewBoard images are pre-built and publicly hosted on Docker Hub. You can launch the entire stack on any Kubernetes cluster (Minikube, Kind, Docker Desktop, or Cloud K8s like AWS EKS, Google GKE, DigitalOcean).

#### Prerequisites:
- `kubectl` installed ([Install kubectl](https://kubernetes.io/docs/tasks/tools/))
- A running cluster (e.g. `minikube start`)

#### Deployment Steps:

1. **Configure Secrets**:
   Copy the example secrets file and add your credentials:
   ```bash
   cp k8s/secret.example.yml k8s/secret.yml
   ```
   Edit `k8s/secret.yml` with your MongoDB URI, Redis URL, and JWT Secret.

2. **Deploy the Entire Stack with One Command**:
   ```bash
   kubectl apply -f k8s/
   ```

   This automatically creates:
   - `ConfigMap` (`k8s/config.yml`) and `Secret` (`k8s/secret.yml`)
   - **Backend Deployment & Service** (`k8s/backend.yml` - 2 replicas, health checks on `/health`, port 5000)
   - **Frontend Deployment & Service** (`k8s/frontend.yml` - 2 replicas, Nginx, NodePort on port `30080`)

3. **Verify Pods are Running**:
   ```bash
   kubectl get pods -w
   ```

4. **Access the Application**:
   - **Minikube**: Run `minikube service crewboard-frontend-service`
   - **Local NodePort**: Open [http://localhost:30080](http://localhost:30080)
   - **Ingress / Cloud Domain**: Point your DNS to the Ingress LoadBalancer IP and open `https://your-domain.com`.

5. **Tear Down**:
   ```bash
   kubectl delete -f k8s/
   ```

---

### 2. Run with Docker Compose

To spin up the entire fullstack app locally with Docker:

1. Create `backend/.env` with your environment variables (see table below).
2. Start all services:
   ```bash
   docker compose up --build
   ```
3. Open [http://localhost](http://localhost) in your browser!

---

### 3. Local Bare-Metal Development

#### 1. Start Backend:
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:5000`.

#### 2. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment | `development` or `production` |
| `PORT` | Backend server port | `5000` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<user>:<pwd>@cluster0.xxx.mongodb.net/crewboard` |
| `REDIS_URL` | Redis server connection URI | `redis://default:<pwd>@<endpoint>:6379` |
| `JWT_SECRET` | Secret key for JWT signing | `any_strong_random_secret_string` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | `GOCSPX-xxxx` |
| `GOOGLE_REDIRECT_URI` | Google OAuth Authorized Redirect URI | `http://localhost:5000/auth/google/callback` |

---

## 📦 Project Architecture

```
crewBoard-app/
├── backend/
│   ├── src/
│   │   ├── config/        # Environment, DB & Redis configurations
│   │   ├── controllers/   # Auth & Room REST controllers
│   │   ├── models/        # Mongoose User & Room schemas
│   │   ├── routes/        # Express API endpoints
│   │   ├── services/      # Business logic & Redis cache-aside operations
│   │   ├── sockets/       # Socket.IO handlers & auth middleware
│   │   └── server.js      # Server entry point
│   ├── Dockerfile         # Backend production container
│   └── .dockerignore
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Whiteboard canvas, Dashboard, Toolbars
│   │   ├── context/       # AuthContext with popup OAuth sync
│   │   ├── hooks/         # Canvas drawing, Socket, History hooks
│   │   └── utils/         # Math & canvas export helpers
│   ├── nginx.conf         # Nginx SPA client-side routing & cache config
│   ├── Dockerfile         # Multi-stage production container (Vite -> Nginx)
│   └── .dockerignore
│
├── k8s/                   # Kubernetes Manifests
│   ├── config.yml         # Cluster environment configurations
│   ├── secret.example.yml # Template for cluster secrets
│   ├── backend.yml        # Backend Deployment & ClusterIP Service
│   └── frontend.yml       # Frontend Deployment & NodePort Service
│
├── docker-compose.yml     # Full-stack local orchestration
└── .gitignore             # Unified root ignore rules
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
