from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition, MatchValue
from dataclasses import dataclass
from datetime import datetime, timezone
import uuid
from fastembed import TextEmbedding
import numpy as np
from google import genai
import os
import logging

from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for API access

# Configuration
COLLECTION_NAME = "medical_events"
VECTOR_DIM = 384

# Initialize clients
try:
    qdrant_client = QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY")
    )
    logger.info("Qdrant client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Qdrant client: {e}")
    raise

try:
    embedding_model = TextEmbedding()
    logger.info("Embedding model initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize embedding model: {e}")
    raise

# Verify Gemini API key
if not os.getenv("GEMINI_API_KEY"):
    logger.warning("GEMINI_API_KEY not found in environment variables")

@dataclass
class MedicalEvent:
    event_id: str
    patient_id: str
    timestamp: str
    event_type: str
    modality: str
    content: str

# ==================== ROUTES ====================

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/test", methods=["POST"])
def test():
    return jsonify({"status": "test works"})

@app.route("/qdrant-test")
def qdrant_test():
    try:
        collections = qdrant_client.get_collections()
        return jsonify({
            "status": "connected",
            "collections": [c.name for c in collections.collections]
        })
    except Exception as e:
        logger.error(f"Qdrant test failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/ingest", methods=["POST"])
def ingest():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ["content", "patient_id", "event_type"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Sanitize inputs
        patient_name = data.get("patient_name", "").strip() or "Unknown"
        doctor_name = data.get("doctor_name", "").strip() or "Self"

        event = create_medical_event(
            content=data["content"],
            patient_id=data["patient_id"],
            event_type=data["event_type"],
            timestamp=data.get("timestamp")
        )

        # Generate embedding
        vector = list(embedding_model.embed(event.content))[0].tolist()

        # Store in Qdrant
        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                PointStruct(
                    id=event.event_id,
                    vector=vector,
                    payload={
                        "patient_id": event.patient_id,
                        "patient_name": patient_name,
                        "doctor_name": doctor_name,
                        "timestamp": event.timestamp,
                        "event_type": event.event_type,
                        "modality": "text",
                        "content": event.content
                    }
                )
            ]
        )

        logger.info(f"Event {event.event_id} ingested for patient {event.patient_id}")
        
        return jsonify({
            "status": "stored",
            "event_id": event.event_id
        })

    except Exception as e:
        logger.error(f"Ingest error: {e}")
        return jsonify({"error": "Failed to ingest event", "details": str(e)}), 500

@app.route("/search", methods=["POST"])
def search():
    try:
        data = request.json
        
        if not data.get("query") or not data.get("patient_id"):
            return jsonify({"error": "Missing query or patient_id"}), 400

        points = search_events(
            query_text=data["query"],
            patient_id=data["patient_id"],
            limit=data.get("limit", 5)
        )

        # Format results for frontend
        response = []
        for p in points:
            response.append({
                "event_id": p.id,
                "score": p.score,
                "content": p.payload["content"],
                "timestamp": p.payload["timestamp"],
                "event_type": p.payload["event_type"]
            })

        return jsonify(response)

    except Exception as e:
        logger.error(f"Search error: {e}")
        return jsonify({"error": "Search failed", "details": str(e)}), 500

@app.route("/timeline-summary", methods=["POST"])
def timeline_summary():
    try:
        data = request.json
        patient_id = data.get("patient_id")
        
        if not patient_id:
            return jsonify({"error": "Missing patient_id"}), 400

        points = fetch_timeline_events(patient_id)

        if len(points) < 1:
            return jsonify({"error": "No events found for this patient"}), 404

        if len(points) < 2:
            # Return simple timeline without semantic shift
            timeline = build_patient_timeline(points)
            data_quality = compute_data_quality(timeline)
            
            return jsonify({
                "timeline": timeline,
                "semantic_shift": 0.0,
                "overall_summary": "Only one event recorded. Timeline analysis requires multiple events.",
                "data_quality": data_quality
            })

        # Build timeline
        timeline = build_patient_timeline(points)
        data_quality = compute_data_quality(timeline)

        # Overall semantic comparison (first vs last)
        earliest = fetch_point_with_vector(points[0].id)
        latest = fetch_point_with_vector(points[-1].id)

        semantic_shift = cosine_distance(
            earliest.vector,
            latest.vector
        )

        # Generate AI overview
        prompt = build_overview_prompt(timeline)
        explanation = ai_explain(prompt)

        return jsonify({
            "timeline": timeline,
            "semantic_shift": round(float(semantic_shift), 3),
            "overall_summary": explanation,
            "data_quality": data_quality
        })

    except Exception as e:
        logger.error(f"Timeline summary error: {e}")
        return jsonify({"error": "Failed to generate timeline summary", "details": str(e)}), 500

@app.route("/difference", methods=["POST"])
def difference():
    try:
        data = request.json
        
        if not data.get("query") or not data.get("patient_id"):
            return jsonify({"error": "Missing query or patient_id"}), 400

        points = search_events(
            query_text=data["query"],
            patient_id=data["patient_id"]
        )

        diff = compute_difference(points)
        return jsonify(diff)

    except Exception as e:
        logger.error(f"Difference error: {e}")
        return jsonify({"error": "Failed to compute difference", "details": str(e)}), 500

@app.route("/explain", methods=["POST"])
def explain():
    try:
        data = request.json
        
        if not data.get("query") or not data.get("patient_id"):
            return jsonify({"error": "Missing query or patient_id"}), 400

        # Step 1: Get search results
        points = search_events(
            query_text=data["query"],
            patient_id=data["patient_id"]
        )

        # Step 2: Compute difference
        diff = compute_difference(points)

        if "error" in diff:
            return jsonify(diff), 400

        # Step 3: Fetch full records
        earliest = fetch_point_with_vector(diff["events_compared"]["earliest_id"])
        latest = fetch_point_with_vector(diff["events_compared"]["latest_id"])

        # Step 4: Build prompt
        prompt = build_explanation_prompt(
            earliest_text=earliest.payload["content"],
            latest_text=latest.payload["content"],
            diff_result=diff
        )

        # Step 5: Ask AI
        explanation = ai_explain(prompt)

        return jsonify({
            "difference": diff,
            "explanation": explanation
        })

    except Exception as e:
        logger.error(f"Explain error: {e}")
        return jsonify({"error": "Failed to generate explanation", "details": str(e)}), 500

# ==================== HELPER FUNCTIONS ====================

def create_medical_event(content, patient_id, event_type, timestamp=None):
    """Create a MedicalEvent object with validation"""
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()

    return MedicalEvent(
        event_id=str(uuid.uuid4()),
        patient_id=patient_id,
        timestamp=timestamp,
        event_type=event_type,
        modality="text",
        content=content
    )

def search_events(query_text: str, patient_id: str, limit: int = 5):
    """Search for events using semantic similarity"""
    # Convert query to vector
    query_vector = list(embedding_model.embed(query_text))[0].tolist()

    # Filter to only this patient
    search_filter = Filter(
        must=[
            FieldCondition(
                key="patient_id",
                match=MatchValue(value=patient_id)
            )
        ]
    )

    # Perform vector search
    results = qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=search_filter,
        limit=limit
    )

    return results.points

def fetch_timeline_events(patient_id: str):
    """Fetch all events for a patient, sorted by time"""
    results = qdrant_client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=Filter(
            must=[
                FieldCondition(
                    key="patient_id",
                    match=MatchValue(value=patient_id)
                )
            ]
        ),
        limit=100,
        with_payload=True
    )

    points = results[0]
    return sorted(
        points,
        key=lambda p: datetime.fromisoformat(p.payload["timestamp"])
    )

def fetch_point_with_vector(event_id: str):
    """Retrieve a single point with its vector"""
    return qdrant_client.retrieve(
        collection_name=COLLECTION_NAME,
        ids=[event_id],
        with_vectors=True
    )[0]

def cosine_distance(vec_a, vec_b):
    """Calculate cosine distance between two vectors"""
    a = np.array(vec_a)
    b = np.array(vec_b)
    return 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def sort_points_by_time(points):
    """Sort points chronologically"""
    return sorted(
        points,
        key=lambda p: datetime.fromisoformat(p.payload["timestamp"])
    )

def build_patient_timeline(points):
    """Build a timeline from points"""
    ordered = sort_points_by_time(points)
    timeline = []

    for p in ordered:
        timeline.append({
            "timestamp": p.payload["timestamp"],
            "event_type": p.payload["event_type"],
            "content": p.payload["content"]
        })

    return timeline

def compute_difference(points):
    """Compute semantic and metadata differences"""
    if len(points) < 2:
        return {"error": "Not enough events to compute differences"}

    ordered = sort_points_by_time(points)

    earliest_meta = ordered[0]
    latest_meta = ordered[-1]

    earliest = fetch_point_with_vector(earliest_meta.id)
    latest = fetch_point_with_vector(latest_meta.id)

    semantic_shift = cosine_distance(
        earliest.vector,
        latest.vector
    )

    metadata_changes = {}
    for key in ["event_type", "modality"]:
        if earliest.payload.get(key) != latest.payload.get(key):
            metadata_changes[key] = (
                earliest.payload.get(key),
                latest.payload.get(key)
            )

    # Human-readable change label
    if semantic_shift < 0.2:
        change_level = "Low"
    elif semantic_shift < 0.5:
        change_level = "Moderate"
    else:
        change_level = "High"

    return {
        "time_range": {
            "from": earliest.payload["timestamp"],
            "to": latest.payload["timestamp"]
        },
        "events_compared": {
            "earliest_id": earliest.id,
            "latest_id": latest.id
        },
        "semantic_shift": round(float(semantic_shift), 3),
        "change_level": change_level,
        "metadata_changes": metadata_changes
    }

def compute_data_quality(timeline):
    """Calculate data quality metrics"""
    count = len(timeline)

    if count == 0:
        return {
            "label": "No Data",
            "description": "No medical records available."
        }

    times = [
        datetime.fromisoformat(e["timestamp"])
        for e in timeline
    ]

    span_days = (max(times) - min(times)).days + 1
    avg_length = sum(len(e["content"]) for e in timeline) / count

    # Heuristic thresholds
    if count >= 6 and span_days >= 7 and avg_length >= 40:
        return {
            "label": "Rich",
            "description": "Sufficient records over time to infer meaningful patterns."
        }

    if count >= 3 and span_days >= 2:
        return {
            "label": "Moderate",
            "description": "Some continuity present, but insights may be limited."
        }

    return {
        "label": "Sparse",
        "description": "Records are few or vague; interpretation is limited."
    }

def build_explanation_prompt(earliest_text: str, latest_text: str, diff_result: dict):
    """Build prompt for AI explanation of differences"""
    return f"""
You are a medical record comparison assistant.

Your task is to describe how two medical records differ over time.
You must follow these rules strictly:

- Do NOT diagnose any condition.
- Do NOT infer causes.
- Do NOT suggest treatments.
- Only describe differences that are explicit or strongly implied by the text.
- If differences are unclear, say so.

Context:
Time range: {diff_result["time_range"]["from"]} to {diff_result["time_range"]["to"]}
Semantic change score: {diff_result["semantic_shift"]}
Change level: {diff_result["change_level"]}

Earlier record:
\"\"\"
{earliest_text}
\"\"\"

Later record:
\"\"\"
{latest_text}
\"\"\"

Now write a short, neutral explanation of how the content changed over time.
If no clear differences are explicitly stated, say:
"The records show limited explicit textual differences over time."
"""

def build_overview_prompt(timeline):
    """Build prompt for AI timeline overview"""
    timeline_text = "\n".join([
        f"- {e['timestamp']}: {e['event_type']} → {e['content']}"
        for e in timeline
    ])

    return f"""
You are a medical timeline summarization assistant.

Your task is to give an overall overview of a patient's medical records.

Strict rules:
- Do NOT diagnose any disease.
- Do NOT guess disease names.
- Do NOT suggest treatment.
- Do NOT infer causes.
- Only describe observable patterns over time.

Focus on:
- Frequency of visits or records
- Changes in monitoring or follow-ups
- Whether records suggest stability, escalation, or continuity
- Gaps or clustering in time

Timeline:
{timeline_text}

Write a concise, neutral overview of the patient's medical history.
If records are vague, say so explicitly.
Also, mention timestamps only if they are important to describing change.
"""

def ai_explain(prompt: str):
    """Get AI explanation using Gemini"""
    try:
        client = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY")
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",  # Updated to latest model
            contents=prompt
        )

        text = getattr(response, "text", None)

        if not text or not text.strip():
            return "The records show limited explicit textual differences over time."

        return text

    except Exception as e:
        logger.error(f"AI explanation error: {e}")
        return "Unable to generate AI explanation at this time."

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500

# ==================== MAIN ====================

if __name__ == "__main__":
    logger.info("Starting Medical Timeline AI server...")
    logger.info(f"Available routes: {[str(rule) for rule in app.url_map.iter_rules()]}")
    app.run(debug=True, host='0.0.0.0', port=5000)