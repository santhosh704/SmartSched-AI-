# SmartSched AI - Deployment Guide

## Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

## Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Database Setup & Seeding
The application will automatically create the SQLite database `smartsched.db` and seed it with Indian manufacturing demo data upon first startup. No manual seed command is required.

## Frontend Setup
```bash
cd frontend
npm install
```

## Running Localhost Server
**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`.

## Sample Login Credentials
- **Admin:** `admin` / `admin123`
- **Manager:** `prod_manager` / `manager123`
- **Planner:** `planner` / `planner123`

## Running Tests
```bash
cd backend
source venv/bin/activate
python3 -m pytest tests/ -v
```

## Troubleshooting
- **Port 8000 in use:** Run `lsof -ti:8000 | xargs kill -9` to clear the backend port.
- **Stale Data:** Delete `backend/smartsched.db` and restart the backend server to freshly re-seed all data.
