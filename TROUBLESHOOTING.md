# 🔧 Troubleshooting Guide

## Common Errors & Solutions

### Error: "Failed to load timeline: Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

**Problem:** Backend is returning HTML error page instead of JSON.

**Solution:**

1. **First time setup - Collection doesn't exist:**
   ```bash
   # Run the setup script
   python setup.py
   
   # OR visit in browser:
   http://localhost:5000/setup-collection
   ```

2. **Check if server is running:**
   ```bash
   # You should see:
   # * Running on http://0.0.0.0:5000
   ```

3. **Check environment variables:**
   ```bash
   # Make sure .env exists with:
   QDRANT_URL=your_qdrant_url
   QDRANT_API_KEY=your_api_key
   GEMINI_API_KEY=your_gemini_key
   ```

4. **Check Qdrant connection:**
   ```bash
   # Visit: http://localhost:5000/qdrant-test
   # Should return: {"status": "connected", "collections": [...]}
   ```

---

### Error: "No module named 'qdrant_client'"

**Problem:** Dependencies not installed.

**Solution:**
```bash
pip install -r requirements.txt

# If on Python 3.13+, make sure you have latest versions:
pip install --upgrade qdrant-client fastembed google-genai
```

---

### Error: "Could not find a version that satisfies the requirement"

**Problem:** Python version incompatibility.

**Solution:**
```bash
# Check Python version
python --version

# Supported: Python 3.8 - 3.13
# If you have 3.14+, downgrade to 3.11:
pyenv install 3.11.7
pyenv local 3.11.7
```

---

### Error: Voice input not working

**Problem:** Browser compatibility or permissions.

**Solution:**

1. **Use Chrome or Edge** (Firefox doesn't support Web Speech API)
2. **Allow microphone permissions** when prompted
3. **Use HTTPS** in production (required for microphone access)
4. **Check browser console** for specific errors

---

### Error: "GEMINI_API_KEY not found"

**Problem:** API key not set.

**Solution:**
```bash
# Get API key from: https://aistudio.google.com/apikey

# Add to .env:
echo "GEMINI_API_KEY=your_key_here" >> .env

# Restart server
python app.py
```

---

### Error: "Failed to upload document"

**Problem:** File size or format issue.

**Solution:**

1. **Supported formats:** JPG, PNG, PDF
2. **Max file size:** 5MB recommended
3. **Check file permissions:** Make sure file is readable
4. **Try smaller image:** Resize if > 5MB

---

### Error: "No events found for this patient"

**Problem:** Patient ID doesn't exist or has no events.

**Solution:**

1. **Check patient ID spelling:** Case-sensitive!
2. **Add an event first:**
   ```
   Patient ID: test_patient_1
   Content: "Test event"
   Click "Add to Timeline"
   ```
3. **Then search with same ID:** `test_patient_1`

---

### Error: PDF export fails

**Problem:** ReportLab not installed or data issue.

**Solution:**
```bash
# Reinstall reportlab
pip install --upgrade reportlab

# Make sure patient has events:
# 1. Add events
# 2. Then export PDF
```

---

### Error: "Login failed" or "Invalid credentials"

**Problem:** User doesn't exist or wrong password.

**Solution:**

1. **For first time:** Click "Sign up" not "Sign in"
2. **Forgot password:** No reset yet - create new account
3. **Check console logs:** Look for specific error

---

### Error: Dark mode not persisting

**Problem:** localStorage not available.

**Solution:**

1. **Check browser settings:** Enable localStorage
2. **Not in incognito mode:** Some browsers disable localStorage
3. **Clear browser cache:** Then try again

---

## Setup Checklist

Before running the app, ensure:

- [ ] Python 3.8-3.13 installed
- [ ] `requirements.txt` dependencies installed
- [ ] `.env` file created with all keys
- [ ] Qdrant instance running and accessible
- [ ] Collection created (run `python setup.py`)
- [ ] Port 5000 is available

---

## Testing Steps

### 1. Test Backend
```bash
# Start server
python app.py

# Visit in browser:
http://localhost:5000/qdrant-test

# Should see:
{
  "status": "connected",
  "collections": ["medical_events"]
}
```

### 2. Test Frontend
```bash
# Visit:
http://localhost:5000

# Should see:
# - Modern UI with dark mode toggle
# - "Sign In" button
# - All forms visible
```

### 3. Test Registration
```
1. Click "Sign In" → "Sign up"
2. Fill: username, email, password
3. Click "Create Account"
4. Should see: "Welcome [username]!"
5. Patient ID auto-filled
```

### 4. Test Event Creation
```
1. Enter Patient ID (or use auto-filled)
2. Select event type
3. Type some content
4. Click "Add to Timeline"
5. Should see: "✅ Event added!"
```

### 5. Test Timeline
```
1. Enter same Patient ID
2. Click "Full Summary"
3. Should see:
   - Timeline table
   - AI summary
   - Data quality
```

### 6. Test Voice (Chrome/Edge only)
```
1. Click microphone button
2. Allow permissions
3. Speak clearly
4. See text appear
5. Click "Add to Timeline"
```

### 7. Test Document Upload
```
1. Drag image to drop zone
2. See preview
3. Click "Extract & Add"
4. See extracted text
```

---

## Debug Mode

Enable detailed logging:

```python
# In app.py, change:
logging.basicConfig(level=logging.DEBUG)

# Then check console for detailed logs
```

---

## Getting Help

1. **Check logs:** Look at terminal where `python app.py` is running
2. **Browser console:** Press F12, check Console tab
3. **Network tab:** Check if requests are reaching backend
4. **Test each endpoint:** Use Postman or curl

Example curl test:
```bash
curl -X POST http://localhost:5000/test \
  -H "Content-Type: application/json"

# Should return:
{"status":"test works"}
```

---

## Production Deployment Issues

### Issue: App works locally but not on server

**Solutions:**

1. **Check firewall:** Port 5000 must be open
2. **Use 0.0.0.0:** Not localhost
   ```python
   app.run(host='0.0.0.0', port=5000)
   ```
3. **Set environment variables:** On server
4. **Use gunicorn:**
   ```bash
   gunicorn app:app --bind 0.0.0.0:5000 --workers 4
   ```

### Issue: Voice doesn't work in production

**Solution:**
- Voice requires HTTPS
- Get SSL certificate (Let's Encrypt free)
- Configure nginx with SSL

---

## Still Having Issues?

1. **Delete and recreate collection:**
   ```python
   # In Python console:
   from qdrant_client import QdrantClient
   client = QdrantClient(url=..., api_key=...)
   client.delete_collection("medical_events")
   # Then run: python setup.py
   ```

2. **Fresh install:**
   ```bash
   rm -rf venv
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python setup.py
   python app.py
   ```

3. **Check versions:**
   ```bash
   pip list | grep -E 'qdrant|flask|genai|fastembed'
   ```

4. **Minimal test:**
   ```python
   # test_minimal.py
   from qdrant_client import QdrantClient
   from google import genai
   
   # Test Qdrant
   client = QdrantClient(url="...", api_key="...")
   print(client.get_collections())
   
   # Test Gemini
   ai = genai.Client(api_key="...")
   resp = ai.models.generate_content(model="gemini-2.0-flash-exp", contents="hi")
   print(resp.text)
   ```

If all else fails, check the GitHub issues or create a new one with:
- Error message
- Python version
- Full traceback
- Steps to reproduce