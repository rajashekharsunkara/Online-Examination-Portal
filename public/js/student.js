let studentData = null;
let examData = null;
let countdownTimer = null;
let remainingTime = 10;

// Load student data from sessionStorage on page load
window.addEventListener('DOMContentLoaded', async () => {
    const storedStudentData = sessionStorage.getItem('studentData');
    const storedExamData = sessionStorage.getItem('examData');
    
    if (storedStudentData && storedExamData) {
        studentData = JSON.parse(storedStudentData);
        examData = JSON.parse(storedExamData);
        
        // Check if student has already completed the exam
        try {
            const response = await fetch(`/api/student/check-exam-status/${studentData.id}`);
            const data = await response.json();
            
            if (data.status === 'completed') {
                alert('You have already completed this examination. Please contact your examination center for any queries.');
                sessionStorage.clear();
                window.location.href = '/';
                return;
            } else if (data.status === 'kicked') {
                alert('You have been disqualified from this examination due to policy violations.');
                sessionStorage.clear();
                window.location.href = '/';
                return;
            }
        } catch (error) {
            console.error('Error checking exam status:', error);
        }
        
        showConfirmationSection();
    } else {
        // Redirect to homepage if no data
        alert('Please login first');
        window.location.href = '/';
    }
});

function showConfirmationSection() {
    document.getElementById('confirmationSection').style.display = 'block';
    
    // Display student details
    document.getElementById('studentName').textContent = studentData.name;
    document.getElementById('studentAdmitCard').textContent = studentData.admit_card_id;
    document.getElementById('studentCenter').textContent = studentData.center_name;
    document.getElementById('studentTrade').textContent = studentData.trade_name;
    document.getElementById('studentDistrict').textContent = studentData.district;
    document.getElementById('examTitle').textContent = examData.title;
    document.getElementById('examDuration').textContent = examData.duration;
    
    // Start countdown
    startCountdown();
    
    // Enable checkbox listener
    document.getElementById('confirmDetails').addEventListener('change', checkStartButton);
}

function startCountdown() {
    updateCountdownDisplay();
    
    countdownTimer = setInterval(() => {
        remainingTime--;
        updateCountdownDisplay();
        
        if (remainingTime <= 0) {
            clearInterval(countdownTimer);
            enableStartButton();
        }
    }, 1000);
}

function updateCountdownDisplay() {
    const countdownElement = document.getElementById('countdownDisplay');
    if (countdownElement) {
        countdownElement.textContent = remainingTime;
    }
}

function checkStartButton() {
    const checkbox = document.getElementById('confirmDetails');
    const startBtn = document.getElementById('startExamBtn');
    
    // Only enable if BOTH conditions are met: timer finished AND checkbox checked
    if (checkbox && checkbox.checked && remainingTime <= 0) {
        startBtn.disabled = false;
        startBtn.style.cursor = 'pointer';
    } else {
        startBtn.disabled = true;
        startBtn.style.cursor = 'not-allowed';
    }
}

function enableStartButton() {
    const countdownLabel = document.querySelector('.countdown-label');
    if (countdownLabel) {
        countdownLabel.textContent = 'Timer complete!';
        countdownLabel.style.color = '#10b981';
        countdownLabel.style.fontWeight = '700';
    }
    checkStartButton();
}

// Wait for DOM to be ready before adding event listener
setTimeout(() => {
    const startBtn = document.getElementById('startExamBtn');
    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            // Show loading animation immediately
            showLoadingAnimation();
            
            // Data already in sessionStorage from homepage login
            
            // Small delay to show loading animation
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Now redirect to exam page
            window.location.href = '/exam';
        });
    }
}, 100);

function showLoadingAnimation() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
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
        animation: fadeIn 0.3s ease-out;
    `;
    
    loadingOverlay.innerHTML = `
        <div style="text-align: center; color: white;">
            <div class="spinner-border" style="width: 4rem; height: 4rem; border-width: 0.4rem;" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <h3 style="margin-top: 30px; font-weight: 600; letter-spacing: 1px;">Preparing Your Exam</h3>
            <p style="margin-top: 15px; font-size: 18px; opacity: 0.9;">Please wait...</p>
            <div style="margin-top: 20px;">
                <div style="display: inline-block; animation: pulse 1.5s ease-in-out infinite;">
                    <i class="bi bi-shield-check" style="font-size: 2rem;"></i>
                </div>
            </div>
        </div>
        <style>
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            @keyframes pulse {
                0%, 100% {
                    opacity: 0.4;
                    transform: scale(1);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.1);
                }
            }
        </style>
    `;
    
    document.body.appendChild(loadingOverlay);
}


