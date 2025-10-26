# Proctoring Hooks Implementation Guide

## ✅ COMPLETED HOOKS

### 1. useFullScreen Hook
**File:** `/web/src/hooks/useFullScreen.ts`

**Features:**
- ✅ Requests full-screen mode on exam start
- ✅ Detects full-screen exits using `fullscreenchange` event
- ✅ Logs violations to backend with severity "violation"
- ✅ Shows warning alerts on each exit
- ✅ Counts violations (default max: 3)
- ✅ Blocks F11 key to prevent manual full-screen toggle
- ✅ Cross-browser support (Chrome, Firefox, Safari, Edge)
- ✅ Returns `shouldBlockSubmit` if max violations exceeded

**Usage:**
```tsx
import { useFullScreen } from '../hooks/useFullScreen';

function ExamPage() {
  const { 
    isFullScreen, 
    exitCount, 
    enterFullScreen, 
    exitFullScreen,
    shouldBlockSubmit 
  } = useFullScreen({
    attemptId: 123,
    maxViolations: 3,
    onViolation: (count) => {
      console.log(`Full-screen violation #${count}`);
    }
  });

  // Call on exam start
  useEffect(() => {
    enterFullScreen();
  }, []);

  return (
    <div>
      {!isFullScreen && <p>⚠️ Please stay in full-screen mode!</p>}
      {shouldBlockSubmit && <p>🚫 Too many violations - submission blocked</p>}
    </div>
  );
}
```

---

### 2. useVisibilityDetection Hook
**File:** `/web/src/hooks/useVisibilityDetection.ts`

**Features:**
- ✅ Detects tab switches using Page Visibility API
- ✅ Tracks window blur/focus events
- ✅ Measures duration of each tab switch
- ✅ Counts total switch attempts
- ✅ Logs warnings to backend
- ✅ Shows alerts (every 2 switches to avoid spam)
- ✅ Tracks total time hidden
- ✅ Returns warning messages for UI display

**Usage:**
```tsx
import { useVisibilityDetection } from '../hooks/useVisibilityDetection';

function ExamPage() {
  const { 
    isVisible, 
    switchCount, 
    totalHiddenTime,
    shouldBlockSubmit,
    warningMessage 
  } = useVisibilityDetection({
    attemptId: 123,
    questionId: 5, // Optional - current question
    maxSwitches: 5,
    onTabSwitch: (count, duration) => {
      console.log(`Tab switch #${count}, duration: ${duration}s`);
    }
  });

  return (
    <div>
      {!isVisible && <div className="tab-warning">⚠️ Return to exam tab!</div>}
      {warningMessage && <p>{warningMessage}</p>}
      <p>Tab switches: {switchCount} | Time away: {Math.floor(totalHiddenTime)}s</p>
    </div>
  );
}
```

---

### 3. useKeyboardBlocking Hook
**File:** `/web/src/hooks/useKeyboardBlocking.ts`

**Features:**
- ✅ Blocks Ctrl+C, Ctrl+V, Ctrl+X (copy/paste/cut)
- ✅ Blocks Ctrl+P (print)
- ✅ Blocks Ctrl+U (view source)
- ✅ Blocks F12, Ctrl+Shift+I/J/C (developer tools)
- ✅ Blocks Ctrl+R, F5 (refresh)
- ✅ Blocks Ctrl+T, Ctrl+N (new tab/window)
- ✅ Blocks Ctrl+W (close tab)
- ✅ Blocks Alt+Tab (window switching - logged but can't prevent)
- ✅ Blocks right-click context menu
- ✅ Logs all blocking attempts to backend
- ✅ Uses capture phase to intercept early
- ✅ Allows Ctrl+Enter for submit (configurable)

**Blocked Keys:**
| Shortcut | Action | Severity |
|----------|--------|----------|
| Ctrl+C/V/X | Copy/Paste/Cut | violation |
| Ctrl+P | Print | violation |
| Ctrl+U | View Source | violation |
| F12, Ctrl+Shift+I/J/C/K | Developer Tools | violation |
| Ctrl+R, F5 | Refresh | warning |
| Ctrl+T, Ctrl+N | New Tab/Window | warning |
| Ctrl+W | Close Tab | warning |
| Alt+Tab | Window Switch | warning |
| Right-click | Context Menu | warning |

**Usage:**
```tsx
import { useKeyboardBlocking } from '../hooks/useKeyboardBlocking';

function ExamPage() {
  const { isBlocking } = useKeyboardBlocking({
    attemptId: 123,
    enabled: true,
    allowSubmit: true // Allow Ctrl+Enter for submit
  });

  return (
    <div>
      {isBlocking && (
        <div className="keyboard-warning">
          ⌨️ Keyboard shortcuts are blocked during exam
        </div>
      )}
    </div>
  );
}
```

---

### 4. ExamTimer Component
**File:** `/web/src/components/ExamTimer.tsx`

**Features:**
- ✅ Countdown timer from specified duration
- ✅ Displays time as MM:SS format
- ✅ Color changes based on time remaining:
  - Green (normal): > 5 minutes
  - Orange (warning): 1-5 minutes
  - Red (critical): < 1 minute
- ✅ Animated pulse effect when < 5 minutes
- ✅ 5-minute warning alert
- ✅ 1-minute warning alert
- ✅ Browser notifications (if permission granted)
- ✅ Calls `onTimeExpired` callback at 0:00
- ✅ Fixed position (top-right corner)
- ✅ Responsive design for mobile

**Usage:**
```tsx
import { ExamTimer } from '../components/ExamTimer';

function ExamPage() {
  const handleTimeExpired = () => {
    // Auto-submit exam
    submitExam();
    navigate('/exam/completed');
  };

  const handleWarning = (minutesRemaining: number) => {
    console.log(`⚠️ ${minutesRemaining} minutes remaining!`);
  };

  return (
    <div>
      <ExamTimer
        durationMinutes={30}
        onTimeExpired={handleTimeExpired}
        onWarning={handleWarning}
        autoStart={true}
      />
      {/* Rest of exam UI */}
    </div>
  );
}
```

**CSS Styling:**
- Fixed top-right position
- Gradient backgrounds (green → orange → red)
- Pulse animations
- Rotating icon
- Shake animation in critical mode
- Mobile responsive

---

### 5. useQuestionTiming Hook
**File:** `/web/src/hooks/useQuestionTiming.ts`

**Features:**
- ✅ Tracks time spent on current question
- ✅ Counts answer changes
- ✅ Records first answer timestamp
- ✅ Syncs to backend every 15 seconds (configurable)
- ✅ Immediate sync on answer change
- ✅ Final sync when leaving question
- ✅ Logs answer change events
- ✅ Provides formatted time display
- ✅ Tracks total seconds per question
- ✅ Auto-resets on question change

**Usage:**
```tsx
import { useQuestionTiming } from '../hooks/useQuestionTiming';

function QuestionDisplay({ attemptId, questionId }) {
  const { 
    timeSpent, 
    answerCount, 
    recordAnswerChange,
    formatTime 
  } = useQuestionTiming({
    attemptId,
    questionId,
    enabled: true,
    syncInterval: 15 // Sync every 15 seconds
  });

  const handleAnswerChange = (newAnswer: string) => {
    recordAnswerChange(newAnswer);
    // Also save answer to exam state
    saveAnswer(questionId, newAnswer);
  };

  return (
    <div>
      <p>Time on this question: {formatTime(timeSpent)}</p>
      <p>Answer changes: {answerCount}</p>
      <textarea onChange={(e) => handleAnswerChange(e.target.value)} />
    </div>
  );
}
```

**Backend Sync:**
- Syncs every 15 seconds (configurable)
- Immediate sync when answer changes
- Final sync when unmounting (leaving question)
- Creates/updates `question_timings` table entry
- Logs `answer_change` proctoring event

---

## 🔧 INTEGRATION STEPS

### Step 1: Update ExamPage.tsx
Integrate all hooks into the exam page:

```tsx
import { useFullScreen } from '../hooks/useFullScreen';
import { useVisibilityDetection } from '../hooks/useVisibilityDetection';
import { useKeyboardBlocking } from '../hooks/useKeyboardBlocking';
import { useQuestionTiming } from '../hooks/useQuestionTiming';
import { ExamTimer } from '../components/ExamTimer';

function ExamPage() {
  const attemptId = 123; // From route params or state
  const currentQuestionId = 5; // Current question being displayed
  const examDuration = 30; // 30 minutes

  // Full-screen enforcement
  const fullScreen = useFullScreen({
    attemptId,
    maxViolations: 3,
    onViolation: (count) => {
      if (count >= 3) {
        alert('Too many full-screen exits. Exam flagged for review.');
      }
    }
  });

  // Tab switch detection
  const visibility = useVisibilityDetection({
    attemptId,
    questionId: currentQuestionId,
    maxSwitches: 5,
    onTabSwitch: (count) => {
      console.log(`Tab switch detected: ${count}`);
    }
  });

  // Keyboard blocking
  useKeyboardBlocking({
    attemptId,
    enabled: true,
    allowSubmit: true
  });

  // Question timing
  const timing = useQuestionTiming({
    attemptId,
    questionId: currentQuestionId,
    syncInterval: 15
  });

  // Enter full-screen on mount
  useEffect(() => {
    fullScreen.enterFullScreen();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Handle timer expiry (auto-submit)
  const handleTimeExpired = async () => {
    await submitExam();
    navigate('/exam/completed');
  };

  return (
    <div className="exam-container">
      <ExamTimer
        durationMinutes={examDuration}
        onTimeExpired={handleTimeExpired}
        onWarning={(mins) => console.log(`${mins} minutes remaining`)}
      />

      {/* Violation warnings */}
      {!fullScreen.isFullScreen && (
        <div className="violation-banner">
          ⚠️ Please return to full-screen mode immediately!
        </div>
      )}

      {visibility.warningMessage && (
        <div className="violation-banner">
          ⚠️ {visibility.warningMessage}
        </div>
      )}

      {/* Question display */}
      <div className="question-section">
        <h2>Question {currentQuestionId}</h2>
        <p>Time on question: {timing.formatTime(timing.timeSpent)}</p>
        <p>Changes: {timing.answerCount}</p>
        {/* Question content */}
      </div>

      {/* Block submit if violations */}
      <button
        onClick={handleSubmit}
        disabled={fullScreen.shouldBlockSubmit || visibility.shouldBlockSubmit}
      >
        Submit Exam
      </button>
    </div>
  );
}
```

### Step 2: Update App.tsx Router
Add exam flow routing:

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import PreExamInstructions from './pages/PreExamInstructions';
import ExamPage from './pages/ExamPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Pre-exam instructions (15 min wait) */}
      <Route 
        path="/exam/:attemptId/instructions" 
        element={<PreExamInstructions />} 
      />
      
      {/* Actual exam */}
      <Route 
        path="/exam/:attemptId/take" 
        element={<ExamPage />} 
      />
      
      {/* Results */}
      <Route 
        path="/exam/:attemptId/completed" 
        element={<ExamCompletedPage />} 
      />
    </Routes>
  );
}
```

### Step 3: Connect PreExamInstructions to ExamPage
Update the instructions page to fetch exam data:

```tsx
import { useParams } from 'react-router-dom';
import { PreExamInstructions } from '../pages/PreExamInstructions';

function InstructionsPageContainer() {
  const { attemptId } = useParams();
  const [examData, setExamData] = useState(null);
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    // Fetch exam and student details
    fetchExamDetails(attemptId).then(setExamData);
    fetchStudentDetails().then(setStudentData);
  }, [attemptId]);

  if (!examData || !studentData) return <div>Loading...</div>;

  return (
    <PreExamInstructions
      examDetails={{
        exam_title: examData.exam.title,
        duration_minutes: examData.exam.duration_minutes,
        total_questions: examData.exam.total_questions,
        total_marks: examData.exam.total_marks,
        passing_marks: examData.exam.passing_marks,
        trade_name: examData.exam.trade.name
      }}
      studentDetails={{
        hall_ticket_number: studentData.hall_ticket_number,
        full_name: studentData.full_name,
        center_name: studentData.center.name,
        district: studentData.center.district
      }}
      attemptId={parseInt(attemptId)}
    />
  );
}
```

---

## 📊 EVENT LOGGING SUMMARY

All hooks automatically log events to backend via `/api/v1/proctoring/events`:

| Hook | Event Types | Severity | Data Logged |
|------|-------------|----------|-------------|
| useFullScreen | `fullscreen_exit`, `fullscreen_enter` | violation, info | exit_count, screen dimensions |
| useVisibilityDetection | `tab_switch`, `window_blur`, `window_focus` | warning, info | duration, switch_count |
| useKeyboardBlocking | `keyboard_blocked`, `copy_paste_attempt`, `developer_tools_attempt`, `context_menu_blocked` | violation, warning | key, combo, reason |
| useQuestionTiming | `answer_change` | info | previous/new answer, change_count, time_spent |

---

## 🎯 NEXT STEPS

### Remaining Tasks:
1. ✅ All hooks created
2. ✅ Timer component created  
3. ⏳ **Integrate hooks into ExamPage.tsx** (Step 1 above)
4. ⏳ **Update App.tsx router** (Step 2 above)
5. ⏳ **Implement auto-submit on timer expiry**
6. ⏳ **Build Admin Proctoring Dashboard**
7. ⏳ **Testing and validation**

### Auto-Submit Implementation:
Add to ExamPage.tsx:
```tsx
const handleTimeExpired = async () => {
  try {
    // Disable all inputs
    setIsSubmitting(true);
    
    // Call submit API
    await fetch(`/api/v1/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Exit full-screen
    await fullScreen.exitFullScreen();
    
    // Show completion message
    alert('⏰ Time expired! Your exam has been auto-submitted.');
    
    // Navigate to results
    navigate(`/exam/${attemptId}/completed`);
  } catch (error) {
    console.error('Auto-submit failed:', error);
    alert('Error submitting exam. Please contact administrator.');
  }
};
```

---

## ✅ SUCCESS CRITERIA

- [x] Full-screen mode enforced
- [x] Tab switches detected and logged
- [x] Keyboard shortcuts blocked
- [x] Timer displays and counts down
- [x] Question timing tracked
- [x] All events logged to backend
- [ ] Auto-submit on timer expiry
- [ ] Violation warnings displayed
- [ ] Admin can view proctoring data
- [ ] Complete exam flow works

**Estimated Completion:** 2-3 hours remaining for integration and testing
