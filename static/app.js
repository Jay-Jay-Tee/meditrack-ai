// Global state
let currentUser = null;
let voiceRecognition = null;
let isRecording = false;
let selectedFile = null;

// ==================== AUTH ====================

function showAuthModal() {
  document.getElementById('authModal').classList.add('active');
}

function hideAuthModal() {
  document.getElementById('authModal').classList.remove('active');
}

function showLogin() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('authTitle').textContent = 'Sign In';
}

function showRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('authTitle').textContent = 'Create Account';
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      currentUser = data;
      updateUIForLoggedInUser();
      hideAuthModal();
      
      document.getElementById('ingestPatientId').value = data.patient_id;
      document.getElementById('patientId').value = data.patient_id;
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
}

async function handleRegister() {
  const username = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      currentUser = data;
      updateUIForLoggedInUser();
      hideAuthModal();
      
      document.getElementById('ingestPatientId').value = data.patient_id;
      document.getElementById('patientId').value = data.patient_id;
      
      alert(`Welcome ${data.username}! Your Patient ID: ${data.patient_id}`);
    } else {
      alert(data.error || 'Registration failed');
    }
  } catch (err) {
    alert('Registration failed: ' + err.message);
  }
}

async function handleLogout() {
  try {
    await fetch('/logout', { method: 'POST' });
    currentUser = null;
    updateUIForLoggedOutUser();
  } catch (err) {
    console.error('Logout failed:', err);
  }
}

function updateUIForLoggedInUser() {
  document.getElementById('welcomeText').textContent = `Welcome back, ${currentUser.username}!`;
  document.getElementById('authButton').textContent = 'Sign Out';
  document.getElementById('authButton').onclick = handleLogout;
}

function updateUIForLoggedOutUser() {
  document.getElementById('welcomeText').textContent = 'Your Personal Health Timeline';
  document.getElementById('authButton').textContent = 'Sign In';
  document.getElementById('authButton').onclick = showAuthModal;
  document.getElementById('ingestPatientId').value = '';
  document.getElementById('patientId').value = '';
}

// ==================== DARK MODE ====================

function toggleDarkMode() {
  const html = document.documentElement;
  const icon = document.getElementById('darkModeIcon');
  
  if (html.getAttribute('data-theme') === 'dark') {
    html.removeAttribute('data-theme');
    icon.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  } else {
    html.setAttribute('data-theme', 'dark');
    icon.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  }
}

// Load saved theme
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('darkModeIcon').textContent = '☀️';
  }

  initVoiceRecognition();

  const dropZone = document.getElementById('dropZone');
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#3b82f6';
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '';
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  });
});

// ==================== VOICE INPUT ====================

function initVoiceRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceRecognition = new SpeechRecognition();
    voiceRecognition.continuous = true;
    voiceRecognition.interimResults = true;

    voiceRecognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      document.getElementById('content').value = transcript;
    };

    voiceRecognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      stopVoice();
    };

    voiceRecognition.onend = () => {
      if (isRecording) {
        voiceRecognition.start();
      }
    };
  }
}

function toggleVoice() {
  if (!voiceRecognition) {
    alert('Voice recognition not supported in this browser');
    return;
  }

  if (isRecording) {
    stopVoice();
  } else {
    startVoice();
  }
}

function startVoice() {
  isRecording = true;
  voiceRecognition.start();
  
  const btn = document.getElementById('voiceButton');
  btn.classList.add('pulse-recording');
  btn.style.backgroundColor = '#ef4444';
  document.getElementById('voiceIcon').textContent = '⏹️';
}

function stopVoice() {
  isRecording = false;
  voiceRecognition.stop();
  
  const btn = document.getElementById('voiceButton');
  btn.classList.remove('pulse-recording');
  btn.style.backgroundColor = '#3b82f6';
  document.getElementById('voiceIcon').textContent = '🎤';
}

// ==================== FILE UPLOAD ====================

function handleFileSelect(event) {
  const file = event.target.files[0];
  handleFile(file);
}

function handleFile(file) {
  if (!file) return;
  
  selectedFile = file;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('previewImage').src = e.target.result;
    document.getElementById('uploadPreview').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

async function uploadDocument() {
  if (!selectedFile) {
    alert('Please select a file first');
    return;
  }

  const patientId = document.getElementById('ingestPatientId').value || 
                    document.getElementById('patientId').value;
  
  if (!patientId) {
    alert('Please enter a Patient ID');
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('patient_id', patientId);
  
  // Add notes if provided
  const notes = document.getElementById('documentNotes').value.trim();
  if (notes) {
    formData.append('notes', notes);
  }
  
  const output = document.getElementById('output');
  output.innerHTML = '<p class="text-center">📤 Uploading document...</p>';

  try {
    const res = await fetch('/upload-document', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      output.innerHTML = `
        <div class="space-y-3">
          <div class="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <p class="font-bold text-green-800 dark:text-green-200">✅ Document Uploaded!</p>
            <p class="text-sm text-green-700 dark:text-green-300 mt-1">Filename: ${selectedFile.name}</p>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="font-semibold mb-2">Stored Information:</p>
            <p class="text-sm">${escapeHtml(data.extracted_text)}</p>
            ${data.note ? `<p class="text-xs text-yellow-600 mt-2">ℹ️ ${data.note}</p>` : ''}
          </div>
        </div>
      `;
      
      // Reset
      document.getElementById('uploadPreview').classList.add('hidden');
      document.getElementById('fileInput').value = '';
      document.getElementById('documentNotes').value = '';
      selectedFile = null;
      
      updateStats();
    } else {
      output.innerHTML = `<p class="text-red-500">❌ ${data.error}</p>`;
    }
  } catch (err) {
    output.innerHTML = `<p class="text-red-500">❌ Upload failed: ${err.message}</p>`;
  }
}

// ==================== INGEST EVENT ====================

async function ingestEvent() {
  const patientId = document.getElementById('ingestPatientId').value.trim();
  const eventType = document.getElementById('eventType').value;
  const content = document.getElementById('content').value.trim();

  if (!patientId || !content) {
    alert('Please fill Patient ID and content');
    return;
  }

  try {
    const res = await fetch('/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        patient_name: currentUser?.username || 'Unknown',
        doctor_name: 'Self',
        event_type: eventType,
        content: content,
        timestamp: null
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert(`✅ Event added! ID: ${data.event_id.substring(0, 8)}...`);
      document.getElementById('content').value = '';
      updateStats();
    } else {
      alert(`❌ ${data.error}`);
    }
  } catch (err) {
    alert(`❌ Failed: ${err.message}`);
  }
}

// ==================== TIMELINE SUMMARY ====================

async function runTimelineSummary(btn) {
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Loading...';

  const ingestId = document.getElementById('ingestPatientId').value.trim();
  const analysisId = document.getElementById('patientId').value.trim();
  const patientId = ingestId || analysisId;

  const output = document.getElementById('output');

  if (!patientId) {
    output.innerHTML = '<p class="text-red-500">❌ Please enter Patient ID</p>';
    btn.disabled = false;
    btn.textContent = originalText;
    return;
  }

  try {
    const res = await fetch('/timeline-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId })
    });

    const data = await res.json();

    if (data.error) {
      output.innerHTML = `<p class="text-red-500">❌ ${escapeHtml(data.error)}</p>`;
    } else {
      const qualityColor = 
        data.data_quality.label === 'Rich' ? 'text-green-600' :
        data.data_quality.label === 'Moderate' ? 'text-yellow-600' :
        'text-red-600';

      let tableHTML = `
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm border rounded-lg">
            <thead class="bg-blue-100 dark:bg-blue-900">
              <tr>
                <th class="border px-3 py-2 text-left">Time</th>
                <th class="border px-3 py-2 text-left">Type</th>
                <th class="border px-3 py-2 text-left">Content</th>
              </tr>
            </thead>
            <tbody>
      `;

      for (const row of data.timeline) {
        const date = new Date(row.timestamp).toLocaleString();
        tableHTML += `
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td class="border px-3 py-2 text-xs">${escapeHtml(date)}</td>
            <td class="border px-3 py-2">${escapeHtml(row.event_type)}</td>
            <td class="border px-3 py-2">${escapeHtml(row.content)}</td>
          </tr>
        `;
      }

      tableHTML += '</tbody></table></div>';

      output.innerHTML = `
        <h3 class="font-bold mb-3">🗂 Patient Timeline</h3>
        ${tableHTML}
        <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p class="font-semibold mb-2">🤖 AI Overview (Powered by Groq):</p>
          <p class="text-sm">${escapeHtml(data.overall_summary)}</p>
          <p class="text-xs mt-3" style="color: var(--text-muted);">
            Semantic Shift: <strong>${data.semantic_shift}</strong>
          </p>
        </div>
        <div class="mt-3 p-3 border rounded-lg">
          <span class="font-semibold">Data Quality: </span>
          <span class="${qualityColor} font-bold">${data.data_quality.label}</span>
          <p class="text-xs mt-1" style="color: var(--text-muted);">
            ${data.data_quality.description}
          </p>
        </div>
      `;

      updateStats();
    }
  } catch (err) {
    output.innerHTML = `<p class="text-red-500">❌ Failed: ${err.message}</p>`;
  }

  btn.disabled = false;
  btn.textContent = originalText;
}

// ==================== PDF EXPORT ====================

async function exportPDF() {
  const patientId = document.getElementById('ingestPatientId').value.trim() ||
                    document.getElementById('patientId').value.trim();

  if (!patientId) {
    alert('Please enter Patient ID');
    return;
  }

  try {
    const res = await fetch('/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId })
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical_timeline_${patientId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      alert('✅ PDF downloaded!');
    } else {
      const data = await res.json();
      alert(`❌ ${data.error}`);
    }
  } catch (err) {
    alert(`❌ Export failed: ${err.message}`);
  }
}

// ==================== SHARE PATIENT LINK ====================

function sharePatientLink() {
  const patientId = document.getElementById('ingestPatientId').value.trim() ||
                    document.getElementById('patientId').value.trim();

  if (!patientId) {
    alert('Please enter Patient ID first');
    return;
  }

  const link = `${window.location.origin}/patient/${patientId}`;
  
  navigator.clipboard.writeText(link).then(() => {
    alert(`✅ Shareable link copied!\n\n${link}\n\nShare this with your healthcare providers.`);
  }).catch(() => {
    prompt('Copy this link:', link);
  });
}

// ==================== UTILS ====================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateStats() {
  const patientId = document.getElementById('ingestPatientId').value.trim() ||
                    document.getElementById('patientId').value.trim();
  
  if (!patientId) return;

  fetch('/timeline-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id: patientId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.timeline) {
      document.getElementById('statEvents').textContent = data.timeline.length;
      if (data.timeline.length > 0) {
        const lastDate = new Date(data.timeline[data.timeline.length - 1].timestamp);
        document.getElementById('statLastUpdate').textContent = lastDate.toLocaleDateString();
      }
    }
  })
  .catch(() => {});
}