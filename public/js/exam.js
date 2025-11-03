// Connect to admin server for real-time alerts (optional - graceful fallback)
let socket;
try {
    socket = io('http://localhost:3001', {
        reconnection: true,
        reconnectionAttempts: 3,
        timeout: 5000
    });
    socket.on('connect_error', (error) => {
        console.warn('Socket.io connection failed, continuing without real-time alerts');
    });
} catch (error) {
    console.warn('Socket.io not available, continuing without real-time alerts');
}

let studentData = null;
let examData = null;
let sessionId = null;
let questions = [];
let currentQuestionIndex = 0;
let answers = {};
let warnings = 0;
let examTimer = null;
let remainingSeconds = 0;
let isExamActive = true;

// Initialize exam
async function initExam() {
    // Get data from sessionStorage
    studentData = JSON.parse(sessionStorage.getItem('studentData'));
    examData = JSON.parse(sessionStorage.getItem('examData'));
    
    if (!studentData || !examData) {
        alert('Session expired. Please login again.');
        window.location.href = '/student';
        return;
    }
    
    // Display student info
    document.getElementById('studentNameDisplay').textContent = studentData.name;
    document.getElementById('examTitleDisplay').textContent = examData.title;
    
    // Start exam session
    try {
        const response = await fetch('/api/student/start-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: studentData.id,
                exam_id: examData.id
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            sessionId = data.sessionId;
            questions = data.questions;
            
            // Initialize exam
            remainingSeconds = examData.duration * 60;
            
            // Setup proctoring first
            setupProctoring();
            
            // Request fullscreen immediately with user interaction
            requestFullscreenStart();
            
            // Start exam after fullscreen
            startTimer();
            renderQuestionPalette();
            showQuestion(0);
        } else {
            alert('Failed to start exam: ' + data.error);
            window.location.href = '/student';
        }
    } catch (error) {
        alert('Network error. Please check your connection.');
        window.location.href = '/student';
    }
}

function startTimer() {
    updateTimerDisplay();
    
    examTimer = setInterval(() => {
        remainingSeconds--;
        updateTimerDisplay();
        
        if (remainingSeconds <= 0) {
            autoSubmitExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    document.getElementById('timer').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function renderQuestionPalette() {
    const palette = document.getElementById('questionPalette');
    palette.innerHTML = '';
    
    questions.forEach((q, index) => {
        const btn = document.createElement('button');
        btn.className = 'palette-btn';
        btn.textContent = index + 1;
        
        if (answers[q.id]) {
            btn.classList.add('answered');
        }
        if (index === currentQuestionIndex) {
            btn.classList.add('current');
        }
        
        btn.addEventListener('click', () => showQuestion(index));
        palette.appendChild(btn);
    });
    
    document.getElementById('totalQuestions').textContent = questions.length;
}

function showQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    
    currentQuestionIndex = index;
    const question = questions[index];
    
    document.getElementById('currentQuestionNum').textContent = index + 1;
    document.getElementById('questionText').textContent = question.question_text;
    document.getElementById('currentMarks').textContent = question.marks;
    
    // Render options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    const options = ['A', 'B', 'C', 'D'];
    options.forEach(opt => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item';
        
        // Create option label (A, B, C, D circle)
        const optionLabel = document.createElement('div');
        optionLabel.className = 'option-label';
        optionLabel.textContent = opt;
        
        // Create option text
        const optionText = document.createElement('div');
        optionText.className = 'option-text';
        optionText.textContent = question['option_' + opt.toLowerCase()];
        
        // Hidden radio input
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'answer';
        radio.value = opt;
        radio.id = 'option' + opt;
        radio.style.display = 'none';
        
        if (answers[question.id] === opt) {
            radio.checked = true;
            optionDiv.classList.add('selected');
        }
        
        // Click handler
        optionDiv.addEventListener('click', () => {
            radio.checked = true;
            saveAnswer(question.id, opt);
        });
        
        optionDiv.appendChild(optionLabel);
        optionDiv.appendChild(optionText);
        optionDiv.appendChild(radio);
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').disabled = index === questions.length - 1;
    
    renderQuestionPalette();
}

async function saveAnswer(questionId, answer) {
    answers[questionId] = answer;
    
    // Update UI - remove selected from all options, add to clicked one
    document.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('selected'));
    event.target.closest('.option-item').classList.add('selected');
    
    // Save to server
    try {
        await fetch('/api/student/submit-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                question_id: questionId,
                selected_answer: answer
            })
        });
        
        renderQuestionPalette();
    } catch (error) {
        console.error('Failed to save answer:', error);
    }
}

function requestFullscreenStart() {
    const elem = document.documentElement;
    
    // Show info message
    const startMessage = document.createElement('div');
    startMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        text-align: center;
        max-width: 500px;
    `;
    startMessage.innerHTML = `
        <h3 style="margin-top: 0; color: #0d6efd;">Exam Starting</h3>
        <p>The exam will start in fullscreen mode for proctoring purposes.</p>
        <p><strong>Click the button below to enter fullscreen and begin.</strong></p>
        <button id="startFullscreenBtn" style="
            background: #0d6efd;
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 15px;
        ">Start Exam in Fullscreen</button>
    `;
    
    document.body.appendChild(startMessage);
    
    document.getElementById('startFullscreenBtn').addEventListener('click', async () => {
        try {
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                await elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                await elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                await elem.msRequestFullscreen();
            }
            
            // Remove the message
            document.body.removeChild(startMessage);
            
            // Focus on the exam
            window.focus();
        } catch (err) {
            console.error('Fullscreen error:', err);
            alert('Please allow fullscreen mode to start the exam. Press F11 or click the fullscreen button.');
            // Try again
            requestFullscreenStart();
        }
    });
}

function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err);
        });
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

function setupProctoring() {
    // Fullscreen change detection
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    
    // Tab/Window visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Window blur (switching windows)
    window.addEventListener('blur', handleWindowBlur);
    
    // Prevent right-click
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Prevent certain key combinations
    document.addEventListener('keydown', handleKeyDown);
}

function handleFullscreenChange() {
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        isExamActive) {
        logViolation('Exited fullscreen mode');
        
        // Re-enter fullscreen after a brief delay
        setTimeout(() => {
            if (isExamActive) {
                enterFullscreen();
                window.focus();
            }
        }, 100);
    }
}

function handleVisibilityChange() {
    // Don't trigger violation if a modal is open
    const modalOpen = document.querySelector('.modal.show');
    if (document.hidden && isExamActive && !modalOpen) {
        logViolation('Switched tab or minimized window');
    }
}

function handleWindowBlur() {
    // Don't trigger violation if a modal is open (Bootstrap modals can cause blur)
    const modalOpen = document.querySelector('.modal.show');
    if (isExamActive && !modalOpen) {
        logViolation('Switched to another window or application');
    }
}

function handleKeyDown(e) {
    // Prevent Alt+Tab, Ctrl+T, Ctrl+N, F11, etc. - silently prevent without logging
    if (e.altKey || 
        (e.ctrlKey && (e.key === 't' || e.key === 'n' || e.key === 'w')) ||
        e.key === 'F11' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        // Don't log violation for key combinations - just prevent them
    }
}

async function logViolation(violationType) {
    if (!isExamActive) return;
    
    try {
        const response = await fetch('/api/student/proctoring-violation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                violation_type: violationType
            })
        });
        
        const data = await response.json();
        
        if (data.kicked) {
            handleKicked();
        } else {
            showViolationWarning(violationType, data.warnings);
        }
        
        // Emit to admin (if socket is connected)
        if (socket && socket.connected) {
            socket.emit('proctoring-violation', {
                studentName: studentData.name,
                admitCard: studentData.admit_card_id,
                examTitle: examData.title,
                violationType: violationType,
                warnings: data.warnings,
                timestamp: new Date().toLocaleString()
            });
        }
        
    } catch (error) {
        console.error('Failed to log violation:', error);
    }
}

function showViolationWarning(violationType, warningCount) {
    warnings = warningCount;
    document.getElementById('warningCount').textContent = warnings;
    document.getElementById('violationMessage').textContent = 
        `You ${violationType}. This is a violation of exam rules.`;
    document.getElementById('modalWarningCount').textContent = warnings;
    
    const modal = new bootstrap.Modal(document.getElementById('violationModal'), {
        backdrop: 'static',
        keyboard: false,
        focus: false  // Don't steal focus from exam
    });
    modal.show();
    
    // Force window to stay focused
    setTimeout(() => {
        window.focus();
    }, 50);
}

document.getElementById('acknowledgeBtn').addEventListener('click', () => {
    const modalElement = document.getElementById('violationModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    
    if (modal) {
        modal.hide();
    }
    
    // Remove any leftover backdrops
    setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Re-enter fullscreen and refocus
        enterFullscreen();
        window.focus();
        
        // Focus on the exam container
        const examContainer = document.querySelector('.exam-container');
        if (examContainer) {
            examContainer.focus();
        }
    }, 100);
});

// Also clean up when modal is hidden
document.getElementById('violationModal').addEventListener('hidden.bs.modal', function () {
    // Ensure all backdrops are removed
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
});

function handleKicked() {
    isExamActive = false;
    clearInterval(examTimer);
    
    const modal = new bootstrap.Modal(document.getElementById('kickedModal'));
    modal.show();
    
    setTimeout(() => {
        window.location.href = '/student';
    }, 5000);
}

// Navigation buttons
document.getElementById('prevBtn').addEventListener('click', () => {
    showQuestion(currentQuestionIndex - 1);
});

document.getElementById('nextBtn').addEventListener('click', () => {
    showQuestion(currentQuestionIndex + 1);
});

// Submit exam
document.getElementById('submitExamBtn').addEventListener('click', () => {
    const answeredCount = Object.keys(answers).length;
    document.getElementById('answeredCount').textContent = answeredCount;
    document.getElementById('totalQuestionsConfirm').textContent = questions.length;
    const modal = new bootstrap.Modal(document.getElementById('submitConfirmModal'));
    modal.show();
});

document.getElementById('cancelSubmitBtn').addEventListener('click', () => {
    const modal = bootstrap.Modal.getInstance(document.getElementById('submitConfirmModal'));
    if (modal) modal.hide();
});

document.getElementById('confirmSubmitBtn').addEventListener('click', async () => {
    const modal = bootstrap.Modal.getInstance(document.getElementById('submitConfirmModal'));
    if (modal) modal.hide();
    await submitExam();
});

async function submitExam() {
    isExamActive = false;
    clearInterval(examTimer);
    
    console.log('Submitting exam with session_id:', sessionId);
    
    try {
        const response = await fetch('/api/student/submit-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
        });
        
        console.log('Submit response status:', response.status);
        
        const data = await response.json();
        console.log('Submit response data:', data);
        
        if (response.ok) {
            // Don't show scores to students - just show submission confirmation
            const modalElement = document.getElementById('resultModal');
            console.log('Modal element:', modalElement);
            
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
                console.log('Modal shown successfully');
            } else {
                console.error('Modal element not found!');
                alert('Exam submitted successfully! You will be redirected to the login page.');
                window.location.href = '/student';
            }
        } else {
            console.error('Submit failed:', data);
            alert('Failed to submit exam: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Submit error:', error);
        alert('Failed to submit exam. Error: ' + error.message);
    }
}

async function autoSubmitExam() {
    alert('Time is up! Your exam will be submitted automatically.');
    await submitExam();
}

// Initialize on page load
window.addEventListener('load', initExam);

// Warn before leaving
window.addEventListener('beforeunload', (e) => {
    if (isExamActive) {
        e.preventDefault();
        e.returnValue = '';
    }
});
