<div align="center">

```
╔╦╗╔═╗╔╦╗╦╔╦╗╦═╗╔═╗╔═╗╦╔═     ╔═╗╦
║║║║╣  ║║║ ║ ╠╦╝╠═╣║  ╠╩╗  ─  ╠═╣║
╩ ╩╚═╝═╩╝╩ ╩ ╩╚═╩ ╩╚═╝╩ ╩     ╩ ╩╩
```

**AI-Powered Medical Timeline System**

[![Python](https://img.shields.io/badge/Python-3.8–3.13-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC244C?style=flat-square)](https://qdrant.tech)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=flat-square)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Render-46E3B7?style=flat-square)](https://medical-timeline-ai.onrender.com/)

*Healthcare records that actually follow the patient — not the hospital.*

</div>

---

## What is MediTrack-AI?

MediTrack-AI is a full-stack, AI-powered medical timeline system that lets patients own their health history across every hospital, clinic, and specialist they visit. Every event gets semantically embedded into a vector database, so when you ask about your care history, the system *understands* what you mean — not just what you typed.

One patient. One ID. Every record. Everywhere.

---

## The Problem It Solves

Healthcare is fragmented. You visit City Hospital, then County Emergency, then your specialist across town. Each institution has its own siloed records. You, the patient, are left carrying printed PDFs in a folder.

MediTrack-AI fixes this with a **globally unique Patient ID** (`MED-XXXXXXXX`) that travels with you. All events — voice-dictated notes, uploaded lab reports, typed summaries — are stored in a single semantic timeline that any authorized provider can view through a shareable read-only link.

---

## Core Features

### 🎙️ Voice-to-Medical-Note
Dictate clinical notes hands-free using the browser's Web Speech API. Real-time transcription. Zero backend processing. Works in Chrome and Edge today.

### 🔍 Semantic Timeline Search
Built on Qdrant with 384-dimensional FastEmbed vectors and cosine similarity. Searching "heart problem" will surface entries for "myocardial infarction," "MI," and "cardiac event" — because it understands meaning, not just keywords.

### 🤖 AI-Powered Analysis
Groq's Llama 3.3 70B (fastest inference available at ~500 tokens/sec) reads your entire timeline and produces a professional clinical summary — patterns, gaps, visit frequency — without ever making a diagnosis or treatment suggestion.

### 📄 Professional PDF Export
ReportLab-generated reports styled with hospital letterhead formatting. Includes a complete event table with dates, types, and content. Print-ready for specialist referrals, insurance claims, or legal documentation.

### 🔗 Shareable Patient Links
Every patient gets a public read-only URL (`/patient/MED-XXXXXXXX`). Share with your cardiologist before your appointment. No login required to view. No ability to edit.

### 📁 Document Upload & Download
Drag-and-drop lab reports, imaging results, or discharge summaries. Files persist on disk with UUID-named storage. Full download access from the timeline at any time.

### 🌙 Dark Mode
Eye-friendly interface with full dark/light toggle. Designed for late-night ER nurses and 6 AM rounds.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Vanilla JS + Tailwind)       │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │  index.html  │  │patient_view  │  │     app.js       │  │
│   │  (main UI)   │  │  (read-only) │  │  (API client)    │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP/REST
┌─────────────────────────────▼───────────────────────────────┐
│                        Flask Backend (app.py)                │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │  Auth Layer  │  │  API Routes  │  │  PDF Generator   │  │
│   │  (bcrypt +   │  │  (ingest,    │  │  (ReportLab)     │  │
│   │  Flask-Login)│  │  timeline,   │  │                  │  │
│   └──────────────┘  │  export)     │  └──────────────────┘  │
│                     └──────┬───────┘                         │
└────────────────────────────┼────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐  ┌───────▼───────┐  ┌───────▼────────┐
│     Qdrant      │  │   FastEmbed   │  │  Groq Llama    │
│  (Vector DB)    │  │  (Embeddings  │  │  3.3 70B       │
│  384-dim cosine │  │  384-dim CPU) │  │  (AI Analysis) │
└─────────────────┘  └───────────────┘  └────────────────┘
```

---

## Tech Stack

**Backend**
- [Flask](https://flask.palletsprojects.com) — Python web framework
- [Qdrant](https://qdrant.tech) — Vector database (cloud or local)
- [FastEmbed](https://github.com/qdrant/fastembed) — CPU-only 384-dim text embeddings
- [Groq](https://groq.com) — LLM inference (Llama 3.3 70B)
- [ReportLab](https://www.reportlab.com) — PDF generation
- [bcrypt](https://pypi.org/project/bcrypt/) + [Flask-Login](https://flask-login.readthedocs.io) — Auth

**Frontend**
- Vanilla JavaScript — no framework overhead
- [Tailwind CSS](https://tailwindcss.com) — utility-first styling
- Web Speech API — browser-native voice input
- Drag & Drop API — native file handling

---

## Project Structure

```
medical-timeline-ai/
├── app.py                    # Flask backend — all routes and business logic
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (never commit this)
├── static/
│   ├── index.html            # Main application UI
│   ├── patient_view.html     # Public patient timeline (read-only)
│   └── app.js                # Frontend JavaScript
├── uploads/                  # Uploaded documents (auto-created on first run)
├── README.md                 # This file
├── CONTRIBUTING.md           # How to contribute
├── SECURITY.md               # Vulnerability disclosure policy
└── TROUBLESHOOTING.md        # Debug guide
```

---

## Quick Start

### Prerequisites

- Python 3.8–3.13 (3.11 recommended)
- A [Qdrant](https://cloud.qdrant.io) account (free tier works)
- A [Groq](https://console.groq.com/keys) API key (free tier: 14,400 req/day)

### Installation

```bash
# 1. Clone
git clone https://github.com/your-org/medical-timeline-ai.git
cd medical-timeline-ai

# 2. Virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Dependencies
pip install -r requirements.txt

# 4. Environment variables
cp .env.example .env
# Edit .env with your credentials (see below)

# 5. Run
python app.py
# → http://localhost:5000
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Qdrant Vector Database
QDRANT_URL=https://your-cluster.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key

# Groq AI
GROQ_API_KEY=gsk_your_groq_api_key

# Flask session security (generate once, keep secret)
SECRET_KEY=run: python -c "import secrets; print(secrets.token_hex(32))"
```

> ⚠️ **Never commit your `.env` file.** It's already in `.gitignore`.

### First Run

1. Open `http://localhost:5000`
2. Click **Sign In → Create Account**
3. Enter your name, hospital, email, and password
4. You'll receive a **Patient ID** like `MED-A1B2C3D4`
5. Start adding events — voice, text, or file upload

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Create a new patient account |
| `POST` | `/login` | Authenticate and start session |
| `POST` | `/logout` | End session |
| `GET` | `/me` | Get current user info |
| `POST` | `/update-profile` | Update patient profile fields |

### Medical Records

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ingest` | Add a text-based medical event |
| `POST` | `/upload-document` | Upload a file with optional notes |
| `GET` | `/download-document/<filename>` | Download an uploaded document |
| `POST` | `/timeline-summary` | Fetch full timeline + AI analysis |
| `POST` | `/export-pdf` | Generate and download PDF report |

### Public & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/patient/<id>` | Read-only public timeline view |
| `GET` | `/health` | Component health check |
| `GET` | `/api/status` | Detailed system status |

---

## How the AI Works

MediTrack-AI uses **two layers of AI**:

**Layer 1 — Semantic Embeddings (FastEmbed)**
When you save a medical event, the text is converted into a 384-dimensional vector and stored in Qdrant. This enables semantic search — queries find *conceptually related* records, not just exact keyword matches.

**Layer 2 — LLM Summary (Groq Llama 3.3 70B)**
When you request a timeline analysis, all your events are assembled into a structured prompt and sent to Llama 3.3 70B. The model produces a professional clinical narrative describing patterns, visit frequency, and temporal gaps.

**What the AI explicitly does NOT do:**
- Diagnose conditions
- Suggest treatments or medications
- Perform clinical inference between events
- Replace healthcare professionals

All outputs are clearly labeled as *information summaries*, not clinical recommendations.

---

## Deployment

### Local Dev

```bash
python app.py
# → http://localhost:5000 with debug mode enabled
```

### Production (Gunicorn + nginx)

```bash
pip install gunicorn
gunicorn app:app --bind 0.0.0.0:8000 --workers 4 --timeout 120
```

nginx config:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120"]
```

```bash
docker build -t meditrack-ai .
docker run -p 5000:5000 --env-file .env meditrack-ai
```

### Render (as deployed)

1. Connect repo to [Render](https://render.com)
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `gunicorn app:app`
4. Add environment variables in Render's dashboard
5. Done — live at your Render URL

---

## Browser Compatibility

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| Core app | ✅ | ✅ | ✅ | ✅ |
| Voice input | ✅ | ✅ | ⚠️ Partial | ❌ |
| File upload | ✅ | ✅ | ✅ | ✅ |
| PDF export | ✅ | ✅ | ✅ | ✅ |
| Dark mode | ✅ | ✅ | ✅ | ✅ |

Voice input requires HTTPS in production. Works on `localhost` without HTTPS for development.

---

## Known Limitations

The following are intentionally out of scope for the current version:

- Causal inference between events (e.g., "medication X caused lab result Y")
- Role-based access control (RBAC) and audit logging
- HIPAA/GDPR compliance layers
- Image or audio semantic embeddings (text and documents only)
- Persistent sessions across server restarts (in-memory user store)
- Patient ID revocation / link invalidation

See [CONTRIBUTING.md](CONTRIBUTING.md) if you want to help build any of these.

---

## Medical Disclaimer

MediTrack-AI is an **information retrieval and summarization system**, not a diagnostic or clinical decision-support tool. All AI-generated outputs are derived strictly from stored patient events and are intended to assist human understanding, not replace professional medical judgment.

Always consult a licensed healthcare provider for medical decisions.

---

## License

MIT — free to use, modify, and distribute. See [LICENSE](LICENSE).

---

<div align="center">

Built for patients to own their own story.

**[Live Demo](https://medical-timeline-ai.onrender.com) · [Report a Bug](../../issues) · [Request a Feature](../../issues) · [Security Policy](SECURITY.md)**

</div>
