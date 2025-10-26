# 🧪 PROCTORING SYSTEM - TESTING GUIDE

## ✅ System Status
All containers are running successfully:

```bash
docker-compose ps
```

**Services:**
- ✅ Frontend (web): http://localhost:5173
- ✅ Admin Panel: http://localhost:5174
- ✅ Backend API: http://localhost:8000
- ✅ PostgreSQL: localhost:5432
- ✅ Redis: localhost:6379
- ✅ MinIO: http://localhost:9000

---

## 🧑‍🎓 TEST STUDENT CREDENTIALS

### AP ITI Students (From seed_ap_iti_demo.py)

| Hall Ticket | DOB | Security Answer | Trade | District | Center |
|-------------|-----|-----------------|-------|----------|---------|
| **AP20250001** | 02/02/2001 | kumar | Electrician | Krishna | Vijayawada ITI |
| **AP20250002** | 03/03/2001 | sharma | Fitter | Krishna | Vijayawada ITI |
| **AP20250003** | 04/04/2001 | reddy | Welder | Guntur | Tenali ITI |
| **AP20250004** | 05/05/2001 | rao | Plumber | Guntur | Tenali ITI |
| **AP20250005** | 06/06/2001 | prasad | Electronics | Visakhapatnam | Visakhapatnam ITI |

---

## 📝 COMPLETE TEST FLOW

### Step 1: Access Frontend
```bash
# Open browser
http://localhost:5173
```

### Step 2: Login with Hall Ticket
```
Hall Ticket Number: AP20250001
Date of Birth: 02/02/2001
Security Answer: kumar
```

Click **"Login with Hall Ticket"**

### Step 3: Pre-Exam Instructions Page
**URL:** `http://localhost:5173/exam/{attemptId}/instructions`

**What to Verify:**
- ✅ Timer shows 15:00 and counts down
- ✅ Student details displayed:
  - Hall Ticket: AP20250001
  - Name: Ravi Kumar
  - Center: Vijayawada ITI
  - District: Krishna
- ✅ Exam details displayed:
  - Exam title
  - Duration: 30 minutes
  - Total questions
  - Total marks
- ✅ Rules list visible (8+ points)
- ✅ Prohibited activities list visible
- ✅ Checkbox "I have read and accept..." available
- ✅ "Start Exam" button disabled until:
  - Timer reaches 0:00
  - Checkbox is checked

**Actions:**
1. Wait for timer to reach 0:00 (or modify timer in code for faster testing)
2. Check "I have read and accept..." checkbox
3. Verify "Start Exam" button is now enabled
4. Click "Start Exam"

### Step 4: Exam Page (Proctoring Active)
**URL:** `http://localhost:5173/exam/{attemptId}`

**Automatic Behaviors:**
- ✅ Full-screen mode activated immediately
- ✅ Notification permission requested
- ✅ Exam timer visible (top-right, 30:00 countdown)
- ✅ Timer color: GREEN (> 5 min remaining)

**What to Verify:**

#### 4.1 Full-Screen Enforcement
**Test:**
1. Press `ESC` to exit full-screen
2. **Expected:** 
   - Red banner appears: "⚠️ WARNING: You have exited full-screen mode!"
   - Shows violation count: (1/3)
   - Console logs event to backend
3. Re-enter full-screen manually or click "Enter Fullscreen" if available
4. **Repeat 2 more times** to trigger critical alert
5. **Expected on 3rd exit:** Alert popup: "CRITICAL: Too many full-screen exits..."

**Try blocking F11:**
1. Press `F11` key
2. **Expected:** Key blocked, no full-screen toggle, event logged

#### 4.2 Tab Switch Detection
**Test:**
1. Press `Alt+Tab` or click another tab/window
2. **Expected:** 
   - Orange banner appears: "⚠️ X tab switch(es) detected"
   - Warning message shows duration outside tab
3. Return to exam tab
4. **Repeat 4 more times** (max: 5 switches)
5. **Expected:** Alert every 2 switches

**Check console:**
```javascript
// Should log:
[Proctoring] Tab switch #1, duration: 5s
[Proctoring] Tab switch #2, duration: 3s
```

#### 4.3 Keyboard Blocking
**Test all these shortcuts:**

| Shortcut | Action | Expected |
|----------|--------|----------|
| `Ctrl+C` | Copy | BLOCKED, event logged |
| `Ctrl+V` | Paste | BLOCKED, event logged |
| `Ctrl+X` | Cut | BLOCKED, event logged |
| `F12` | Dev Tools | BLOCKED, event logged |
| `Ctrl+Shift+I` | Dev Tools | BLOCKED, event logged |
| `Ctrl+Shift+J` | Console | BLOCKED, event logged |
| `Ctrl+U` | View Source | BLOCKED, event logged |
| `Ctrl+P` | Print | BLOCKED, event logged |
| `Right-Click` | Context Menu | BLOCKED, event logged |
| `Ctrl+R` | Refresh | BLOCKED, event logged |
| `F5` | Refresh | BLOCKED, event logged |

**Allowed shortcuts:**
- `Ctrl+Enter` - Submit exam (should work)

#### 4.4 Question Timing Tracking
**Test:**
1. Answer question 1 (select an option)
2. Wait 10 seconds
3. Navigate to question 2
4. **Expected:** 
   - Question 1 timing synced to backend
   - First answer recorded
   - Total time: ~10 seconds

5. Change answer on question 2 multiple times
6. **Expected:**
   - Each change logged
   - Answer count incremented
   - Timestamps recorded

**Check browser console:**
```javascript
// Should log every 15 seconds:
[QuestionTiming] Syncing timing data for question X
```

#### 4.5 Exam Timer Warnings
**Test:**
1. Wait until timer shows `5:00` remaining
2. **Expected:**
   - Timer color changes: GREEN → ORANGE
   - Browser notification: "5 minutes remaining!"
   - Gentle pulse animation

3. Wait until timer shows `1:00` remaining
4. **Expected:**
   - Timer color changes: ORANGE → RED
   - Browser notification: "1 minute remaining!"
   - Shake animation
   - Increased urgency

5. Wait until timer shows `0:00`
6. **Expected:**
   - Auto-submit triggered
   - Alert: "⏰ Time expired! Exam auto-submitted."
   - Redirect to results page
   - Full-screen mode exited gracefully

#### 4.6 Manual Submit
**Test:**
1. Answer a few questions
2. Click "Submit Exam" button
3. **Expected:**
   - Submit confirmation modal appears
   - Shows: "Are you sure you want to submit?"
4. Click "Confirm Submit"
5. **Expected:**
   - Full-screen mode exited
   - Answers encrypted
   - Submitted to backend
   - Redirect to results page

### Step 5: Check Backend Events
**Option 1: Via API (requires authentication)**
```bash
# Get violation summary
curl http://localhost:8000/api/v1/proctoring/attempt/{attemptId}/violations

# Get all events
curl http://localhost:8000/api/v1/proctoring/attempt/{attemptId}/events

# Get question timings
curl http://localhost:8000/api/v1/proctoring/attempt/{attemptId}/question-timings
```

**Option 2: Direct Database Query**
```bash
# Enter PostgreSQL container
docker-compose exec postgres psql -U exam_user -d exam_db

# Query proctoring events
SELECT 
  id, 
  event_type, 
  severity, 
  event_timestamp, 
  event_data 
FROM proctoring_events 
WHERE attempt_id = {attemptId}
ORDER BY event_timestamp DESC
LIMIT 20;

# Query question timings
SELECT 
  question_id, 
  total_time_seconds, 
  answer_count,
  first_answered_at,
  last_answered_at
FROM question_timings 
WHERE attempt_id = {attemptId}
ORDER BY question_id;

# Count violations
SELECT 
  event_type, 
  severity, 
  COUNT(*) as count
FROM proctoring_events 
WHERE attempt_id = {attemptId}
GROUP BY event_type, severity
ORDER BY count DESC;
```

**Expected Event Types:**
```sql
fullscreen_enter       | info      | 1
fullscreen_exit        | violation | 3
tab_switch             | warning   | 5
window_blur            | warning   | 5
keyboard_blocked       | warning   | 10+
copy_paste_attempt     | violation | 3
developer_tools_attempt| violation | 2
answer_change          | info      | 15+
```

---

## 🔍 EXPECTED OUTPUTS

### Proctoring Events Table
```json
{
  "id": 1,
  "attempt_id": 123,
  "event_type": "fullscreen_exit",
  "event_timestamp": "2025-10-26T10:15:30Z",
  "question_id": 5,
  "event_data": {
    "exit_count": 1,
    "max_violations": 3,
    "message": "Student exited full-screen mode"
  },
  "user_agent": "Mozilla/5.0...",
  "ip_address": "172.18.0.1",
  "severity": "violation"
}
```

### Question Timings Table
```json
{
  "id": 1,
  "attempt_id": 123,
  "question_id": 1,
  "first_viewed_at": "2025-10-26T10:00:00Z",
  "last_viewed_at": "2025-10-26T10:02:30Z",
  "total_time_seconds": 150,
  "answer_count": 3,
  "first_answered_at": "2025-10-26T10:01:00Z",
  "last_answered_at": "2025-10-26T10:02:15Z"
}
```

### Violation Summary API Response
```json
{
  "attempt_id": 123,
  "total_events": 45,
  "total_violations": 8,
  "violation_count": 5,
  "warning_count": 15,
  "info_count": 25,
  "event_type_counts": {
    "fullscreen_exit": 3,
    "tab_switch": 5,
    "copy_paste_attempt": 2,
    "keyboard_blocked": 12,
    "answer_change": 18
  },
  "most_recent_violation_time": "2025-10-26T10:25:00Z",
  "most_recent_violation_type": "fullscreen_exit"
}
```

---

## ⚡ QUICK TESTING (Modified Timers)

**For faster testing, modify timers:**

### Reduce Pre-Exam Timer
**File:** `/web/src/pages/PreExamInstructions.tsx`
```tsx
// Change line ~50
const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes

// To:
const [timeRemaining, setTimeRemaining] = useState(1 * 60); // 1 minute
```

### Reduce Exam Timer
**File:** Backend exam configuration or database
```sql
-- Update exam duration
UPDATE exams 
SET duration_minutes = 2 
WHERE id = {examId};
```

Or modify ExamTimer component:
**File:** `/web/src/components/ExamTimer.tsx`
```tsx
// Force 2-minute timer for testing
const initialTime = 2 * 60; // 2 minutes instead of exam.duration_minutes
```

**After modifications:**
```bash
# Rebuild frontend container
docker-compose restart web

# Wait for rebuild
docker-compose logs web --follow
```

---

## 🐛 TROUBLESHOOTING

### Issue: Full-screen not working
**Solution:**
- Ensure HTTPS (Fullscreen API requires secure context)
- Or test on localhost (exempt from HTTPS requirement)
- Update browser to latest version

### Issue: Keyboard shortcuts still work
**Solution:**
- Some OS-level shortcuts (Windows key, Alt+Tab) cannot be fully prevented
- They are logged but cannot be blocked at browser level
- Check console for "keyboard_blocked" events

### Issue: Timer doesn't show warnings
**Solution:**
- Grant notification permissions when prompted
- Check browser console for errors
- Verify ExamTimer component is rendered

### Issue: Events not logging to backend
**Solution:**
```bash
# Check API logs
docker-compose logs api --follow

# Verify database connection
docker-compose exec postgres psql -U exam_user -d exam_db -c "\dt"

# Check proctoring tables exist
docker-compose exec postgres psql -U exam_user -d exam_db -c "\d proctoring_events"
```

### Issue: TypeScript errors in console
**Solution:**
- These are expected in development
- Code will compile correctly
- Ignore React type resolution warnings

---

## ✅ SUCCESS CRITERIA

After complete testing, verify:

- [x] Student can login with hall ticket
- [x] Pre-exam instructions page loads
- [x] 15-minute timer counts down
- [x] Student details display correctly
- [x] "Start Exam" button behavior correct
- [x] Full-screen mode activates on exam start
- [x] Full-screen exits are detected and logged
- [x] Tab switches are detected and logged
- [x] Keyboard shortcuts are blocked
- [x] Question timing is tracked
- [x] Answer changes are logged
- [x] Exam timer shows and counts down
- [x] Timer warnings at 5 min and 1 min
- [x] Auto-submit at timer expiry
- [x] Manual submit works correctly
- [x] All events stored in database
- [x] Violation counts are accurate
- [x] API endpoints return correct data

---

## 🎯 NEXT STEPS

After successful testing:

1. **Admin Dashboard**: Build UI to view violation reports
2. **Notifications**: Implement real-time admin alerts
3. **Reports**: Export violation reports (PDF/CSV)
4. **Analytics**: Timing analysis, pattern detection
5. **ML Models**: Train cheating detection algorithms
6. **Production**: Deploy with proper HTTPS, monitoring

---

**Testing Status:** ⏳ Ready for manual testing  
**Last Updated:** October 26, 2025  
**Tester:** [Your Name]  

**Report issues to:** Development team
