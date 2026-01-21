let ingestInProgress = false;
let summaryInProgress = false;
let analysisInProgress = false;

/* =========================
   TIME HELPERS
========================= */

function localToUTC(datetimeLocalValue) {
  if (!datetimeLocalValue) return null;
  return new Date(datetimeLocalValue).toISOString();
}

function utcToLocal(isoString) {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleString();
}

/* =========================
   TIMELINE SUMMARY
========================= */

async function runTimelineSummary(btn) {
  if (summaryInProgress || analysisInProgress) return;

  summaryInProgress = true;

  const analyzeBtn = document.querySelector(
    'button[onclick="runAnalysis()"]'
  );

  btn.disabled = true;
  btn.innerText = "⏳ Summarizing...";
  if (analyzeBtn) analyzeBtn.disabled = true;

  const ingestId = document.getElementById("ingestPatientId").value.trim();
  const analysisId = document.getElementById("patientId").value.trim();
  const patientId = ingestId || analysisId;

  const output = document.getElementById("output");

  function cleanup() {
    summaryInProgress = false;
    btn.disabled = false;
    btn.innerText = "Summarize Full Timeline";
    if (analyzeBtn) analyzeBtn.disabled = false;
  }

  if (!patientId) {
    output.innerHTML = '<p class="text-red-600">❌ Please enter Patient ID (Ingest or Analyze section)</p>';
    cleanup();
    return;
  }

  try {
    const res = await fetch("/timeline-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId })
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();

    if (data.error) {
      output.innerHTML = `<p class="text-red-600">❌ ${escapeHtml(data.error)}</p>`;
      cleanup();
      return;
    }

    const quality = data.data_quality;

    const qualityColor =
      quality.label === "Rich" ? "text-green-700" :
      quality.label === "Moderate" ? "text-yellow-700" :
      "text-red-700";

    /* ---------- Build Table ---------- */
    let tableHTML = `
      <div class="overflow-x-auto">
        <table class="min-w-full border border-gray-300 text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="border px-3 py-2 text-left">Time (Local)</th>
              <th class="border px-3 py-2 text-left">Event Type</th>
              <th class="border px-3 py-2 text-left">Content</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const row of data.timeline) {
      tableHTML += `
        <tr class="hover:bg-gray-50">
          <td class="border px-3 py-2">${escapeHtml(utcToLocal(row.timestamp))}</td>
          <td class="border px-3 py-2">${escapeHtml(row.event_type)}</td>
          <td class="border px-3 py-2">${escapeHtml(row.content)}</td>
        </tr>
      `;
    }

    tableHTML += `
          </tbody>
        </table>
      </div>
    `;

    const summaryText =
      data.overall_summary && data.overall_summary.trim().length > 0
        ? data.overall_summary
        : "The records show limited explicit textual differences over time.";

    output.innerHTML = `
      <h3 class="font-semibold mb-2">🗂 Patient Timeline</h3>
      ${tableHTML}

      <hr class="my-4">

      <h3 class="font-semibold mb-1">🧠 AI Patient Overview</h3>
      <p class="mb-2 whitespace-pre-wrap">${escapeHtml(summaryText)}</p>

      <p class="text-sm text-gray-600">
        Semantic Shift: <strong>${data.semantic_shift}</strong>
      </p>

      <div class="mb-3 p-2 border rounded bg-gray-50">
        <span class="font-semibold">Data Quality:</span>
        <span class="${qualityColor} font-bold">
          ${escapeHtml(quality.label)}
        </span>
        <p class="text-sm text-gray-600">
          ${escapeHtml(quality.description)}
        </p>
      </div>
    `;

  } catch (err) {
    output.innerHTML = `<p class="text-red-600">❌ Failed to summarize timeline: ${escapeHtml(err.message)}</p>`;
    console.error('Timeline summary error:', err);
  }

  cleanup();
}

/* =========================
   INGEST EVENT
========================= */

async function ingestEvent() {
  if (ingestInProgress) return;
  ingestInProgress = true;

  const button = event.target;
  const originalText = button.innerText;
  button.disabled = true;
  button.innerText = "⏳ Adding...";

  const patientId = document.getElementById("ingestPatientId").value.trim();
  const patientName = document.getElementById("patientName").value.trim();
  const doctorName = document.getElementById("doctorName").value.trim();
  const eventType = document.getElementById("eventType").value.trim();
  const content = document.getElementById("content").value.trim();
  const timestampInput = document.getElementById("eventTime").value;

  const safePatientName = patientName || "Unknown";
  const safeDoctorName = doctorName || "Self";

  if (!patientId || !eventType || !content) {
    showNotification("Please fill Patient ID, Event Type, and Content", "error");
    resetIngestButton(button, originalText);
    return;
  }

  const timestamp = localToUTC(timestampInput);

  try {
    const response = await fetch("/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: patientId,
        patient_name: safePatientName,
        doctor_name: safeDoctorName,
        event_type: eventType,
        content,
        timestamp
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    showNotification(`✅ Event added (ID: ${data.event_id.substring(0, 8)}...)`, "success");

    // Clear content field after successful submission
    document.getElementById("content").value = "";
    document.getElementById("eventTime").value = "";

  } catch (err) {
    showNotification(`❌ Failed to add event: ${err.message}`, "error");
    console.error('Ingest error:', err);
  }

  resetIngestButton(button, originalText);
}

function resetIngestButton(button, originalText = "Add Event") {
  ingestInProgress = false;
  button.disabled = false;
  button.innerText = originalText;
}

/* =========================
   ANALYSIS / EXPLAIN
========================= */

async function runAnalysis() {
  if (analysisInProgress || summaryInProgress) return;
  analysisInProgress = true;

  const button = event.target;
  const summaryBtn = document.querySelector(
    'button[onclick^="runTimelineSummary"]'
  );

  button.disabled = true;
  button.innerText = "⏳ Analyzing...";
  if (summaryBtn) summaryBtn.disabled = true;

  const patientId = document.getElementById("patientId").value.trim();
  const query = document.getElementById("query").value.trim();
  const output = document.getElementById("output");

  try {
    if (!patientId || !query) {
      output.innerHTML = '<p class="text-red-600">❌ Please enter Patient ID and query</p>';
      resetAnalysisButton(button);
      return;
    }

    const response = await fetch("/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, query })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      output.innerHTML = `<p class="text-red-600">❌ ${escapeHtml(data.error)}</p>`;
    } else {
      const explanation = data.explanation || "The records show limited explicit textual differences over time.";
      
      output.innerHTML = `
        <div class="space-y-3">
          <div class="p-3 bg-blue-50 rounded border border-blue-200">
            <p class="font-semibold text-blue-900">Change Level: ${escapeHtml(data.difference.change_level)}</p>
            <p class="text-sm text-blue-700">Semantic Shift: ${data.difference.semantic_shift}</p>
          </div>
          
          <div class="p-3 bg-gray-50 rounded border border-gray-200">
            <p class="text-sm"><strong>From:</strong> ${escapeHtml(utcToLocal(data.difference.time_range.from))}</p>
            <p class="text-sm"><strong>To:</strong> ${escapeHtml(utcToLocal(data.difference.time_range.to))}</p>
          </div>
          
          <div class="p-3 bg-green-50 rounded border border-green-200">
            <p class="font-semibold text-green-900 mb-2">AI Explanation:</p>
            <p class="text-sm whitespace-pre-wrap text-gray-800">${escapeHtml(explanation)}</p>
          </div>
        </div>
      `;
    }
  } catch (err) {
    output.innerHTML = `<p class="text-red-600">❌ Failed to run analysis: ${escapeHtml(err.message)}</p>`;
    console.error('Analysis error:', err);
  }

  resetAnalysisButton(button);
}

function resetAnalysisButton(button) {
  analysisInProgress = false;
  button.disabled = false;
  button.innerText = "Analyze";

  const summaryBtn = document.querySelector(
    'button[onclick^="runTimelineSummary"]'
  );
  if (summaryBtn) summaryBtn.disabled = false;
}

/* =========================
   UTILITY FUNCTIONS
========================= */

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Toast-style notification (optional enhancement)
function showNotification(message, type = "info") {
  // For now, using alert - could be replaced with a toast library
  alert(message);
}

/* =========================
   INITIALIZATION
========================= */

// Set default datetime to now when page loads
document.addEventListener('DOMContentLoaded', () => {
  const eventTimeInput = document.getElementById('eventTime');
  if (eventTimeInput && !eventTimeInput.value) {
    const now = new Date();
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    eventTimeInput.value = localDateTime;
  }
});