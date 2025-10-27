let studentData = null;
let examData = null;
let countdownTimer = null;
let remainingTime = 10; // 5 minutes in seconds

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const admitCardId = document.getElementById('admitCardId').value.trim();
    const dob = document.getElementById('dob').value;
    
    try {
        const response = await fetch('/api/student/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admit_card_id: admitCardId, dob: dob })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            studentData = data.student;
            examData = data.exam;
            showConfirmationSection();
        } else {
            const errorDiv = document.getElementById('loginError');
            errorDiv.style.display = 'block';
            if (data.kicked) {
                errorDiv.innerHTML = '<strong><i class="bi bi-x-circle-fill me-2"></i>Disqualified:</strong> ' + data.error;
                errorDiv.className = 'alert alert-danger mt-3';
            } else {
                errorDiv.textContent = data.error || 'Login failed';
                errorDiv.className = 'alert alert-danger mt-3';
            }
        }
    } catch (error) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.className = 'alert alert-danger mt-3';
    }
});

function showConfirmationSection() {
    document.getElementById('loginSection').style.display = 'none';
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
    document.getElementById('countdown').textContent = remainingTime;
    document.getElementById('countdownDisplay').textContent = remainingTime;
    const progress = ((10 - remainingTime) / 10) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

function checkStartButton() {
    const checkbox = document.getElementById('confirmDetails');
    const startBtn = document.getElementById('startExamBtn');
    
    if (checkbox.checked && remainingTime <= 0) {
        startBtn.disabled = false;
    } else {
        startBtn.disabled = true;
    }
}

function enableStartButton() {
    document.querySelector('.timer-text').innerHTML = 
        'You may now start the exam. Please confirm that you have read all instructions.';
    checkStartButton();
}

document.getElementById('startExamBtn').addEventListener('click', async () => {
    // Store data in sessionStorage
    sessionStorage.setItem('studentData', JSON.stringify(studentData));
    sessionStorage.setItem('examData', JSON.stringify(examData));
    
    // Redirect to exam page
    window.location.href = '/exam';
});

// Update checkbox listener
document.getElementById('confirmDetails').addEventListener('change', checkStartButton);
