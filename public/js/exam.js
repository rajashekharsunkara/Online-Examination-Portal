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
    // Show loading animation first
    showInitialLoadingAnimation();
    
    // Make body visible (prevent flash)
    document.body.classList.add('loaded');
    
    // Get data from sessionStorage
    studentData = JSON.parse(sessionStorage.getItem('studentData'));
    examData = JSON.parse(sessionStorage.getItem('examData'));
    
    if (!studentData || !examData) {
        alert('Session expired. Please login again.');
        sessionStorage.clear();
        window.location.href = '/';
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
            
            // Hide exam content initially to prevent flash
            document.getElementById('examContainer').style.opacity = '0';
            
            // Setup proctoring first
            setupProctoring();
            
            // Prepare exam content (but don't show yet)
            renderQuestionPalette();
            showQuestion(0);
            
            // Wait for loading animation (minimum 1 second)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Remove loading animation
            const loadingOverlay = document.getElementById('initialLoadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    if (loadingOverlay.parentNode) {
                        loadingOverlay.parentNode.removeChild(loadingOverlay);
                    }
                }, 300);
            }
            
            // Request fullscreen immediately with user interaction
            requestFullscreenStart();
            
            // Start timer (it will be ready when fullscreen is entered)
            startTimer();
        } else {
            alert('Failed to start exam: ' + data.error);
            sessionStorage.clear();
            window.location.href = '/';
        }
    } catch (error) {
        alert('Network error. Please check your connection.');
        sessionStorage.clear();
        window.location.href = '/';
    }
}

function showInitialLoadingAnimation() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'initialLoadingOverlay';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        transition: opacity 0.3s ease-out;
    `;
    
    loadingOverlay.innerHTML = `
        <div style="text-align: center; color: white;">
            <div style="margin-bottom: 30px;">
                <div class="spinner-border" style="width: 4rem; height: 4rem; border-width: 0.4rem; color: white;" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            <h2 style="font-weight: 600; letter-spacing: 1px; margin-bottom: 15px;">Loading Your Examination</h2>
            <p style="font-size: 18px; opacity: 0.9; margin-bottom: 30px;">Setting up secure exam environment...</p>
            <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                <div style="animation: pulse 1.5s ease-in-out infinite; animation-delay: 0s;">
                    <i class="bi bi-shield-check" style="font-size: 2rem;"></i>
                </div>
                <div style="animation: pulse 1.5s ease-in-out infinite; animation-delay: 0.3s;">
                    <i class="bi bi-camera-video" style="font-size: 2rem;"></i>
                </div>
                <div style="animation: pulse 1.5s ease-in-out infinite; animation-delay: 0.6s;">
                    <i class="bi bi-file-text" style="font-size: 2rem;"></i>
                </div>
            </div>
        </div>
        <style>
            @keyframes pulse {
                0%, 100% {
                    opacity: 0.3;
                    transform: scale(1);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.15);
                }
            }
        </style>
    `;
    
    document.body.appendChild(loadingOverlay);
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
    
    // Create a full overlay that blocks all content
    const fullOverlay = document.createElement('div');
    fullOverlay.id = 'fullscreenOverlay';
    fullOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: all;
    `;
    
    // Create the message box
    const startMessage = document.createElement('div');
    startMessage.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        text-align: center;
        max-width: 500px;
        animation: fadeInScale 0.3s ease-out;
    `;
    startMessage.innerHTML = `
        <div style="font-size: 60px; color: #0d6efd; margin-bottom: 20px;">🖥️</div>
        <h3 style="margin: 0 0 20px 0; color: #0d6efd; font-size: 24px;">Exam Starting</h3>
        <p style="color: #666; margin-bottom: 15px; line-height: 1.6;">
            The exam will start in fullscreen mode for proctoring purposes.
        </p>
        <p style="color: #333; font-weight: 600; margin-bottom: 25px;">
            Click the button below to enter fullscreen and begin your examination.
        </p>
        <button id="startFullscreenBtn" style="
            background: #0d6efd;
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        " onmouseover="this.style.background='#0b5ed7'; this.style.transform='scale(1.05)'"
           onmouseout="this.style.background='#0d6efd'; this.style.transform='scale(1)'">
            <span style="font-size: 20px; margin-right: 8px;">⛶</span>
            Start Exam in Fullscreen
        </button>
        <p style="color: #999; font-size: 12px; margin-top: 20px; margin-bottom: 0;">
            Press ESC to exit fullscreen (will trigger a violation warning)
        </p>
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(style);
    
    fullOverlay.appendChild(startMessage);
    document.body.appendChild(fullOverlay);
    
    // Disable all interactions with exam content behind overlay
    document.getElementById('examContainer').style.pointerEvents = 'none';
    
    document.getElementById('startFullscreenBtn').addEventListener('click', async () => {
        try {
            // Request fullscreen
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                await elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                await elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                await elem.msRequestFullscreen();
            }
            
            // Wait a moment for fullscreen to activate
            setTimeout(() => {
                // Remove the overlay
                if (fullOverlay && fullOverlay.parentNode) {
                    document.body.removeChild(fullOverlay);
                }
                
                // Re-enable exam interactions and show content
                const examContainer = document.getElementById('examContainer');
                examContainer.style.pointerEvents = 'all';
                examContainer.style.opacity = '1';
                examContainer.style.transition = 'opacity 0.3s ease-in';
                
                // Focus on the exam
                window.focus();
            }, 100);
            
        } catch (err) {
            console.error('Fullscreen error:', err);
            
            // Show error message
            startMessage.innerHTML = `
                <div style="font-size: 60px; color: #dc3545; margin-bottom: 20px;">⚠️</div>
                <h3 style="margin: 0 0 20px 0; color: #dc3545; font-size: 24px;">Fullscreen Required</h3>
                <p style="color: #666; margin-bottom: 15px; line-height: 1.6;">
                    Please allow fullscreen mode to start the exam.
                </p>
                <p style="color: #333; margin-bottom: 25px;">
                    You can also press <strong>F11</strong> to enter fullscreen mode.
                </p>
                <button id="retryFullscreenBtn" style="
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 15px 40px;
                    font-size: 18px;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
                ">
                    Try Again
                </button>
            `;
            
            document.getElementById('retryFullscreenBtn').addEventListener('click', () => {
                document.body.removeChild(fullOverlay);
                document.getElementById('examContainer').style.pointerEvents = 'all';
                requestFullscreenStart();
            });
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

let fullscreenReentryTimer = null;

function handleFullscreenChange() {
    // Clear any pending reentry
    if (fullscreenReentryTimer) {
        clearTimeout(fullscreenReentryTimer);
        fullscreenReentryTimer = null;
    }
    
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        isExamActive) {
        
        // Log violation
        logViolation('Exited fullscreen mode');
        
        // Disable exam interaction immediately
        document.getElementById('examContainer').style.pointerEvents = 'none';
        document.getElementById('examContainer').style.opacity = '0.3';
        
        // Re-enter fullscreen after a brief delay
        fullscreenReentryTimer = setTimeout(() => {
            if (isExamActive) {
                enterFullscreen();
                // Re-enable interaction after entering fullscreen
                setTimeout(() => {
                    document.getElementById('examContainer').style.pointerEvents = 'all';
                    document.getElementById('examContainer').style.opacity = '1';
                    window.focus();
                }, 200);
            }
        }, 500);
    } else {
        // Successfully in fullscreen
        document.getElementById('examContainer').style.pointerEvents = 'all';
        document.getElementById('examContainer').style.opacity = '1';
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
        sessionStorage.clear();
        window.location.href = '/';
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
                sessionStorage.clear();
                window.location.href = '/';
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

// Question Palette Sliding Menu
function openPalette() {
    const sidebar = document.getElementById('questionPaletteSidebar');
    const toggleBtn = document.getElementById('togglePaletteBtn');
    
    sidebar.style.left = '0px';
    toggleBtn.style.display = 'none';
}

function closePalette() {
    const sidebar = document.getElementById('questionPaletteSidebar');
    const toggleBtn = document.getElementById('togglePaletteBtn');
    
    sidebar.style.left = '-300px';
    toggleBtn.style.display = 'block';
}

document.getElementById('togglePaletteBtn').addEventListener('click', () => {
    const sidebar = document.getElementById('questionPaletteSidebar');
    const currentLeft = sidebar.style.left;
    
    if (currentLeft === '-300px' || currentLeft === '') {
        openPalette();
    } else {
        closePalette();
    }
});

document.getElementById('closePaletteBtn').addEventListener('click', () => {
    closePalette();
});

// Close palette when clicking on a question number
document.addEventListener('click', (e) => {
    if (e.target.closest('.palette-btn')) {
        setTimeout(() => {
            closePalette();
        }, 300);
    }
});

// Initialize on page load
window.addEventListener('load', initExam);

// Warn before leaving
window.addEventListener('beforeunload', (e) => {
    if (isExamActive) {
        e.preventDefault();
        e.returnValue = '';
    }
});
