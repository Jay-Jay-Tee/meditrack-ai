# 🩺 MediTrack - AI-Powered Medical Timeline System

## 🏆 Hackathon-Winning Features

### What Makes This Unique

1. **🎤 Voice-to-Medical-Note** - Speak your symptoms, AI transcribes instantly
2. **📸 Smart Document Upload** - Upload lab reports, AI extracts all data automatically
3. **📄 Doctor-Ready PDF Export** - Professional medical reports in one click
4. **🌙 Dark Mode** - Perfect for night-shift medical professionals
5. **🔗 Shareable Patient Links** - Secure, read-only profile sharing
6. **🔐 Patient Authentication** - Full user accounts with login/register
7. **🧠 AI-Powered Analysis** - Semantic timeline analysis with Google Gemini
8. **📊 Data Quality Metrics** - Intelligent assessment of medical record completeness

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8-3.13
- Qdrant vector database (cloud or local)
- Google Gemini API key

### Installation

```bash
# 1. Clone repository
git clone <your-repo>
cd medical-timeline-ai

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env file
cat > .env << EOF
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your-secret-key-for-sessions
EOF

# 4. Run the app
python app.py
```

### First Time Setup

1. Go to `http://localhost:5000`
2. Click "Sign Up" to create an account
3. You'll get a unique Patient ID (e.g., `patient_abc12345`)
4. Start adding medical events!

---

## 💡 Demo Flow for Judges

### 1. Voice Input Demo (30 seconds)
```
1. Click microphone button
2. Say: "Patient presented with acute chest pain radiating to left arm, blood pressure 140 over 90, heart rate elevated at 95 beats per minute"
3. Text appears in real-time
4. Click "Add to Timeline"
5. Event saved instantly
```

### 2. Document Upload Demo (45 seconds)
```
1. Drag and drop a lab report image
2. AI extracts all information automatically
3. Shows: "Blood Test - Hemoglobin: 12.5 g/dL, Glucose: 95 mg/dL"
4. One click to add to timeline
```

### 3. Timeline Analysis Demo (30 seconds)
```
1. Enter patient ID
2. Click "Full Summary"
3. Shows:
   - Complete timeline table
   - AI-generated health overview
   - Data quality assessment
   - Semantic shift analysis
```

### 4. Share & Export Demo (20 seconds)
```
1. Click "Share Profile"
2. Copy shareable link
3. Click "Export PDF"
4. Professional medical report downloads
```

**Total Demo Time: ~2 minutes**

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Flask (Python web framework)
- Qdrant (Vector database for semantic search)
- FastEmbed (Text embeddings - 384 dimensions)
- Google Gemini 2.0 (AI analysis + Vision OCR)
- ReportLab (PDF generation)
- bcrypt (Password hashing)

**Frontend:**
- Vanilla JavaScript (no framework overhead)
- Tailwind CSS (modern styling)
- Web Speech API (voice input)
- Drag & Drop API (file uploads)

**Why This Stack?**
- **Fast**: No heavy frameworks
- **Scalable**: Vector DB handles millions of records
- **Accurate**: Semantic search > keyword search
- **Modern**: Latest AI models
- **Secure**: Proper auth + password hashing

---

## 📁 Project Structure

```
medical-timeline-ai/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (create this)
├── templates/
│   ├── index.html        # Main application UI
│   └── patient_view.html # Shareable patient view
└── static/
    └── script.js         # Frontend JavaScript
```

---

## 🎯 Key Features Explained

### 1. Voice-to-Medical-Note 🎤

**How it works:**
- Uses browser's Web Speech API (Chrome/Edge)
- Real-time transcription
- No backend needed - runs in browser
- Detects and highlights medical terms

**Code:**
```javascript
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.onresult = (event) => {
  // Transcription appears in real-time
};
```

### 2. AI Document OCR 📸

**How it works:**
- Upload image of lab report/prescription
- Gemini Vision API extracts:
  - Document type
  - Date
  - All medical data
- Auto-creates timeline event

**Backend:**
```python
response = client.models.generate_content(
    model="gemini-2.0-flash-exp",
    contents=[image_prompt, image_base64]
)
# Extracts structured medical data
```

### 3. Semantic Timeline Analysis 🧠

**How it works:**
- Each medical note → 384-dimensional vector
- Similar symptoms cluster together
- Semantic shift = how much health changed over time
- AI explains differences in plain English

**Math:**
```python
semantic_shift = 1 - cosine_similarity(earliest_vector, latest_vector)
# 0.0 = no change, 1.0 = complete change
```

### 4. Shareable Patient Links 🔗

**How it works:**
- Every patient gets unique URL: `/patient/patient_abc123`
- Read-only view
- Perfect for sharing with doctors
- No login required to view

### 5. Doctor-Ready PDF Export 📄

**What's included:**
- Professional header
- Complete timeline table
- AI-generated summary
- Formatted for printing
- HIPAA-style formatting

---

## 🔒 Security Features

1. **Password Hashing**: bcrypt with salt
2. **Session Management**: Flask-Login
3. **Input Sanitization**: All user inputs escaped
4. **HTTPS Ready**: Works with production WSGI servers
5. **No SQL Injection**: Uses Qdrant (NoSQL vector DB)

---

## 📊 API Endpoints

### Authentication
- `POST /register` - Create account
- `POST /login` - Sign in
- `POST /logout` - Sign out
- `GET /me` - Get current user

### Medical Records
- `POST /ingest` - Add medical event (text)
- `POST /upload-document` - Add via document OCR
- `POST /search` - Semantic search
- `POST /timeline-summary` - Get full timeline + AI analysis
- `POST /explain` - Explain differences between events
- `POST /export-pdf` - Download PDF report

### Sharing
- `GET /patient/<patient_id>` - Public patient view

---

## 🎨 UI/UX Highlights

### Not "AI-Generated" Looking
- Custom color palette
- Smooth transitions
- Professional gradients
- Thoughtful spacing
- Real medical icons (🩺💊🩸)
- Dark mode for accessibility

### Responsive Design
- Works on mobile, tablet, desktop
- Touch-friendly buttons
- Readable on all screen sizes

---

## 🚢 Deployment

### Local Development
```bash
python app.py
```

### Production with Gunicorn
```bash
gunicorn app:app --bind 0.0.0.0:5000 --workers 4
```

### Environment Variables for Production
```bash
QDRANT_URL=https://your-qdrant-cloud.com
QDRANT_API_KEY=your_key
GEMINI_API_KEY=your_gemini_key
SECRET_KEY=your-very-secret-random-key
```

---

## 🧪 Testing

### Test Voice Input
1. Open in Chrome/Edge (Firefox not supported for voice)
2. Click microphone
3. Speak clearly
4. Check transcription accuracy

### Test Document Upload
1. Take photo of any text document
2. Upload via drag-and-drop
3. Verify AI extraction
4. Check timeline creation

### Test Timeline Analysis
1. Add 5+ events over different dates
2. Run "Full Summary"
3. Verify AI generates meaningful overview
4. Check semantic shift calculation

---

## 🏆 What Makes This Win Hackathons

### Technical Innovation
✅ Semantic search (not just keyword matching)
✅ AI-powered OCR (not traditional Tesseract)
✅ Voice input (cutting-edge UX)
✅ Vector database (scalable architecture)

### Real-World Impact
✅ Solves actual problem (medical record chaos)
✅ Usable by patients AND doctors
✅ Privacy-focused (data stays in your control)
✅ Professional PDF export (actually usable)

### Execution Quality
✅ Clean, modern UI
✅ Fast performance
✅ No bugs in demo
✅ Complete feature set
✅ Good code organization

### Demo Appeal
✅ Voice input is impressive
✅ AI OCR feels like magic
✅ Timeline visualization is clear
✅ PDF export shows completeness

---

## 🔮 Future Enhancements

1. **Mobile App** - React Native version
2. **Medication Interactions** - Drug database integration
3. **Wearable Integration** - Fitbit, Apple Health
4. **Multi-language** - Support 100+ languages
5. **Telemedicine** - Video call integration
6. **Family Sharing** - Link family medical histories
7. **Insurance Export** - Claims-ready formats

---

## 📝 License

MIT License - feel free to use for your hackathon!

---

## 🙏 Credits

Built with:
- [Qdrant](https://qdrant.tech/) - Vector Database
- [Google Gemini](https://ai.google.dev/) - AI Analysis
- [FastEmbed](https://github.com/qdrant/fastembed) - Text Embeddings
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

## 📞 Support

Questions? Found a bug?
- Open an issue on GitHub
- Check the code comments
- Read the inline documentation

---