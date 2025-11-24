let socket = io(); // Initialize Socket.io immediately
let currentAdmin = null;

// Socket connection monitoring
socket.on('connect', () => {
    console.log('✅ Connected to admin server:', socket.id);
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from admin server');
});

socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
    initializeAdmin();
}

function initializeAdmin() {
    console.log('Admin panel initialized');
    
    // Login functionality
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            console.log('Attempting login with:', username);
            
            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                console.log('Response status:', response.status);
                
                const data = await response.json();
                console.log('Response data:', data);
                
                if (response.ok) {
                    currentAdmin = data.admin;
                    showDashboard();
                } else {
                    const errorDiv = document.getElementById('loginError');
                    errorDiv.textContent = data.error || 'Login failed';
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Login error:', error);
                const errorDiv = document.getElementById('loginError');
                errorDiv.textContent = 'Network error: ' + error.message;
                errorDiv.style.display = 'block';
            }
        });
    }
}

function showDashboard() {
    console.log('showDashboard called');
    
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    
    console.log('loginSection:', loginSection);
    console.log('dashboardSection:', dashboardSection);
    
    // Hide login section completely
    loginSection.style.display = 'none';
    loginSection.classList.add('d-none');
    
    // Show dashboard section
    dashboardSection.style.display = 'block';
    dashboardSection.classList.add('d-block');
    
    document.getElementById('adminUsername').textContent = currentAdmin.username;
    
    console.log('Dashboard should be visible now');
    console.log('Login display:', loginSection.style.display);
    console.log('Dashboard display:', dashboardSection.style.display);
    
    // Join admin room for live alerts
    socket.emit('join-admin');
    
    // Listen for live violations
    socket.on('violation-alert', handleLiveAlert);
    
    // Listen for exam result updates
    socket.on('exam-result-update', (data) => {
        console.log('✅ Exam result update received:', data);
        
        // Refresh results table if on results tab
        const resultsTab = document.getElementById('resultsTab');
        if (resultsTab && resultsTab.classList.contains('active')) {
            console.log('Refreshing results table...');
            loadResults();
        }
        
        // Refresh students table if on students tab
        const studentsTab = document.getElementById('studentsTab');
        if (studentsTab && studentsTab.classList.contains('active')) {
            console.log('Refreshing students table...');
            loadStudents();
        }
        
        // Always refresh overview for live stats
        console.log('Refreshing overview...');
        loadOverview();
        
        // Show notification
        showResultNotification(data);
    });
    
    // Load initial data
    loadCenters();
    loadTrades();
    loadStudents(); // Load all students
    loadTradesTable(); // Load trades in the Manage Trades tab
    loadResults();
    loadProctoringLogs();
    loadOverview();
    
    // Set up event listener for trade selection in question sets
    const setTradeSelect = document.getElementById('setTradeSelect');
    if (setTradeSelect) {
        setTradeSelect.addEventListener('change', loadQuestionSets);
    }
}

function logout() {
    currentAdmin = null;
    
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    
    // Hide dashboard
    dashboardSection.style.display = 'none';
    dashboardSection.classList.remove('d-block');
    
    // Show login
    loginSection.style.display = 'flex';
    loginSection.classList.remove('d-none');
    
    document.getElementById('adminLoginForm').reset();
    
    // Clear error message
    const errorDiv = document.getElementById('loginError');
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // Reload data for specific tabs
    if (tabName === 'results') loadResults();
    if (tabName === 'proctoring') loadProctoringLogs();
    if (tabName === 'overview') loadOverview();
    if (tabName === 'analytics') loadAnalytics();
}

async function loadOverview() {
    try {
        const [centers, trades, results, logs] = await Promise.all([
            fetch('/api/admin/centers').then(r => r.json()),
            fetch('/api/admin/trades').then(r => r.json()),
            fetch('/api/admin/results').then(r => r.json()),
            fetch('/api/admin/proctoring-logs').then(r => r.json())
        ]);
        
        document.getElementById('totalCenters').textContent = centers.length;
        document.getElementById('totalExams').textContent = trades.length; // Show number of trades (each trade IS an exam)
        
        const active = results.filter(r => r.status === 'active').length;
        document.getElementById('activeSessions').textContent = active;
        
        document.getElementById('proctoringAlerts').textContent = logs.length;
        
    } catch (error) {
        console.error('Failed to load overview:', error);
    }
}

async function loadCenters() {
    try {
        const response = await fetch('/api/admin/centers');
        const centers = await response.json();
        
        const tbody = document.getElementById('centersTable');
        tbody.innerHTML = '';
        
        centers.forEach(center => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${center.id}</td>
                <td>${center.name}</td>
                <td>${center.district}</td>
                <td>${center.address}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Failed to load centers:', error);
    }
}

async function loadTrades() {
    try {
        const response = await fetch('/api/admin/trades');
        const trades = await response.json();
        
        // Populate the trade selector in Question Sets tab
        const setTradeSelect = document.getElementById('setTradeSelect');
        if (setTradeSelect) {
            setTradeSelect.innerHTML = '<option value="">Select Trade</option>';
            trades.forEach(trade => {
                const option = document.createElement('option');
                option.value = trade.id;
                option.textContent = trade.name;
                setTradeSelect.appendChild(option);
            });
        }
        
        // Also populate old questionTrade if it still exists
        const selectTrade = document.getElementById('questionTrade');
        if (selectTrade) {
            selectTrade.innerHTML = '<option value="">Select Trade to Upload Questions</option>';
            trades.forEach(trade => {
                const option = document.createElement('option');
                option.value = trade.id;
                option.textContent = trade.name;
                selectTrade.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Failed to load trades:', error);
    }
}

async function loadStudents() {
    try {
        const response = await fetch('/api/admin/students');
        const students = await response.json();
        
        const tbody = document.getElementById('studentsTable');
        tbody.innerHTML = '';
        
        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No students registered</td></tr>';
            return;
        }
        
        students.forEach(student => {
            let statusBadge = '<span class="badge bg-secondary">Not Started</span>';
            if (student.exam_status === 'active') {
                statusBadge = '<span class="badge bg-warning text-dark">In Progress</span>';
            } else if (student.exam_status === 'completed') {
                statusBadge = '<span class="badge bg-success">Completed</span>';
            } else if (student.exam_status === 'kicked') {
                statusBadge = '<span class="badge bg-danger">Disqualified</span>';
            }
            
            // Determine if retest button should be shown
            const canRetest = student.exam_status === 'completed' || student.exam_status === 'kicked';
            const retestButton = canRetest ? 
                `<button class="btn btn-sm btn-warning" onclick="allowRetest(${student.id}, '${student.admit_card_id}', '${student.name}')" title="Allow student to retake exam">
                    <i class="bi bi-arrow-clockwise me-1"></i>Allow Retest
                </button>` : '';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${student.admit_card_id}</strong></td>
                <td>${student.name}</td>
                <td>${student.dob}</td>
                <td>${student.trade_name}</td>
                <td>${student.center_name}</td>
                <td>${student.district}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary" onclick="viewStudentProfile(${student.id})">
                            <i class="bi bi-eye me-1"></i>View
                        </button>
                        ${retestButton}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Failed to load students:', error);
        document.getElementById('studentsTable').innerHTML = '<tr><td colspan="8" class="text-center text-danger">Failed to load students</td></tr>';
    }
}

async function loadTradesTable() {
    try {
        const response = await fetch('/api/admin/trades');
        const trades = await response.json();
        
        // Get question counts for each trade
        const tradesWithCounts = await Promise.all(trades.map(async (trade) => {
            const qResponse = await fetch(`/api/admin/trades/${trade.id}/questions`);
            const questions = await qResponse.json();
            trade.question_count = questions.length;
            return trade;
        }));
        
        const tbody = document.getElementById('tradesTable');
        tbody.innerHTML = '';
        
        tradesWithCounts.forEach(trade => {
            const questionsPerSet = trade.questions_per_set || 30; // Default to 30
            const totalMarks = questionsPerSet * trade.marks_per_question;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${trade.id}</td>
                <td><strong>${trade.name}</strong></td>
                <td>${trade.duration}</td>
                <td>${questionsPerSet}</td>
                <td>${trade.marks_per_question}</td>
                <td><strong>${totalMarks}</strong></td>
                <td><span class="badge ${trade.question_count >= questionsPerSet ? 'bg-success' : 'bg-warning text-dark'}">${trade.question_count}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Failed to load trades table:', error);
        document.getElementById('tradesTable').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load trades</td></tr>';
    }
}

// Old loadExams function - no longer needed since trade IS the exam
/* 
async function loadExams() {
    // REMOVED - Trade is the exam now, no separate exams table
}
*/

// Old createExamForm - no longer needed (Trade IS the exam, no manual creation)
/*
document.getElementById('createExamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const examData = {
        title: document.getElementById('examTitle').value,
        trade_id: document.getElementById('examTrade').value,
        duration: parseInt(document.getElementById('examDuration').value),
        total_marks: parseInt(document.getElementById('examMarks').value)
    };
    
    try {
        const response = await fetch('/api/admin/exams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(examData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Exam created successfully!');
            document.getElementById('createExamForm').reset();
            loadExams();
        } else {
            alert('Failed to create exam: ' + data.error);
        }
    } catch (error) {
        alert('Network error');
    }
});
*/

// Load question sets when trade is selected
async function loadQuestionSets() {
    const tradeId = document.getElementById('setTradeSelect').value;
    
    if (!tradeId) {
        document.getElementById('questionSetsList').innerHTML = 
            '<div class="alert alert-info">Please select a trade first</div>';
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/trades/${tradeId}/sets`);
        const sets = await response.json();
        
        const container = document.getElementById('questionSetsList');
        
        if (sets.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i> No question sets uploaded for this trade yet.
                    Click "Upload New Set" to add one.
                </div>
            `;
            return;
        }
        
        let html = '<div class="row">';
        sets.forEach((set, index) => {
            const statusBadge = set.is_active ? 
                '<span class="badge bg-success">Active</span>' : 
                '<span class="badge bg-secondary">Inactive</span>';
            
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">
                                ${set.set_name} ${statusBadge}
                            </h5>
                            <p class="card-text">
                                <strong>Set Number:</strong> ${set.set_number}<br>
                                <strong>Questions:</strong> ${set.question_count} / 30<br>
                                <strong>Created:</strong> ${new Date(set.created_at).toLocaleDateString()}
                            </p>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-primary" onclick="viewSetQuestions(${set.id})">
                                    <i class="bi bi-eye"></i> View
                                </button>
                                <button class="btn btn-danger" onclick="deleteQuestionSet(${set.id})">
                                    <i class="bi bi-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading question sets:', error);
        document.getElementById('questionSetsList').innerHTML = 
            '<div class="alert alert-danger">Error loading question sets</div>';
    }
}

// Show upload modal
function showUploadModal() {
    const tradeId = document.getElementById('setTradeSelect').value;
    
    if (!tradeId) {
        alert('Please select a trade first');
        return;
    }
    
    // Clear previous inputs
    document.getElementById('setName').value = '';
    document.getElementById('setNumber').value = '';
    document.getElementById('questionsJsonInput').value = '';
    document.getElementById('questionsFileInput').value = '';
    document.getElementById('uploadSetResult').textContent = '';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('uploadSetModal'));
    modal.show();
}

// Upload question set from JSON textarea
async function uploadQuestionSet() {
    const tradeId = document.getElementById('setTradeSelect').value;
    const setName = document.getElementById('setName').value.trim();
    const setNumber = document.getElementById('setNumber').value;
    const jsonText = document.getElementById('questionsJsonInput').value.trim();
    
    if (!setName || !setNumber || !jsonText) {
        document.getElementById('uploadSetResult').className = 'alert alert-warning mt-3';
        document.getElementById('uploadSetResult').textContent = 
            'Please fill in all fields';
        return;
    }
    
    try {
        const questions = JSON.parse(jsonText);
        
        if (!Array.isArray(questions) || questions.length !== 30) {
            document.getElementById('uploadSetResult').className = 'alert alert-warning mt-3';
            document.getElementById('uploadSetResult').textContent = 
                `Error: Must be exactly 30 questions. You have ${questions.length} questions.`;
            return;
        }
        
        const response = await fetch('/api/admin/question-sets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trade_id: parseInt(tradeId),
                set_name: setName,
                set_number: parseInt(setNumber),
                questions: questions
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('uploadSetResult').className = 'alert alert-success mt-3';
            document.getElementById('uploadSetResult').textContent = 
                `✓ Successfully uploaded question set "${setName}" with 30 questions!`;
            
            // Refresh the sets list after 1.5 seconds and close modal
            setTimeout(() => {
                loadQuestionSets();
                bootstrap.Modal.getInstance(document.getElementById('uploadSetModal')).hide();
            }, 1500);
        } else {
            document.getElementById('uploadSetResult').className = 'alert alert-danger mt-3';
            document.getElementById('uploadSetResult').textContent = 
                'Failed to upload: ' + data.error;
        }
    } catch (error) {
        document.getElementById('uploadSetResult').className = 'alert alert-danger mt-3';
        document.getElementById('uploadSetResult').textContent = 
            'Invalid JSON format. Please check your input.';
    }
}

// Upload question set from file
async function uploadJsonFileToSet() {
    const tradeId = document.getElementById('setTradeSelect').value;
    const setName = document.getElementById('setName').value.trim();
    const setNumber = document.getElementById('setNumber').value;
    const fileInput = document.getElementById('questionsFileInput');
    
    if (!setName || !setNumber) {
        document.getElementById('uploadSetResult').className = 'alert alert-warning mt-3';
        document.getElementById('uploadSetResult').textContent = 
            'Please fill in Set Name and Set Number first';
        return;
    }
    
    if (!fileInput.files || fileInput.files.length === 0) {
        document.getElementById('uploadSetResult').className = 'alert alert-warning mt-3';
        document.getElementById('uploadSetResult').textContent = 
            'Please select a JSON file';
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const questions = JSON.parse(e.target.result);
            
            if (!Array.isArray(questions) || questions.length !== 30) {
                document.getElementById('uploadSetResult').className = 'alert alert-warning mt-3';
                document.getElementById('uploadSetResult').textContent = 
                    `Error: Must be exactly 30 questions. File contains ${questions.length} questions.`;
                return;
            }
            
            const response = await fetch('/api/admin/question-sets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trade_id: parseInt(tradeId),
                    set_name: setName,
                    set_number: parseInt(setNumber),
                    questions: questions
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('uploadSetResult').className = 'alert alert-success mt-3';
                document.getElementById('uploadSetResult').textContent = 
                    `✓ Successfully uploaded question set "${setName}" with 30 questions from file!`;
                
                // Refresh the sets list after 1.5 seconds and close modal
                setTimeout(() => {
                    loadQuestionSets();
                    bootstrap.Modal.getInstance(document.getElementById('uploadSetModal')).hide();
                }, 1500);
            } else {
                document.getElementById('uploadSetResult').className = 'alert alert-danger mt-3';
                document.getElementById('uploadSetResult').textContent = 
                    'Failed to upload: ' + data.error;
            }
        } catch (error) {
            document.getElementById('uploadSetResult').className = 'alert alert-danger mt-3';
            document.getElementById('uploadSetResult').textContent = 
                'Invalid JSON file. Please check the file format.';
        }
    };
    
    reader.readAsText(file);
}

// View questions in a set
async function viewSetQuestions(setId) {
    try {
        const response = await fetch(`/api/admin/sets/${setId}/questions`);
        const data = await response.json();
        
        if (!response.ok) {
            alert('Error loading questions: ' + data.error);
            return;
        }
        
        const questions = data.questions;
        
        let html = `
            <div class="modal fade" id="viewQuestionsModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Questions in Set: ${data.set_name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
        `;
        
        questions.forEach((q, index) => {
            html += `
                <div class="card mb-3">
                    <div class="card-header">
                        <strong>Question ${q.question_number}</strong>
                    </div>
                    <div class="card-body">
                        <p><strong>Q:</strong> ${q.question_text}</p>
                        <p><strong>A:</strong> ${q.option_a}</p>
                        <p><strong>B:</strong> ${q.option_b}</p>
                        <p><strong>C:</strong> ${q.option_c}</p>
                        <p><strong>D:</strong> ${q.option_d}</p>
                        <p><span class="badge bg-success">Correct Answer: ${q.correct_answer}</span></p>
                    </div>
                </div>
            `;
        });
        
        html += `
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modal
        const existingModal = document.getElementById('viewQuestionsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('viewQuestionsModal'));
        modal.show();
        
        // Remove modal from DOM when closed
        document.getElementById('viewQuestionsModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
        
    } catch (error) {
        console.error('Error viewing questions:', error);
        alert('Error loading questions');
    }
}

// Delete a question set
async function deleteQuestionSet(setId) {
    if (!confirm('Are you sure you want to delete this question set? This will remove all 30 questions in this set.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/sets/${setId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Question set deleted successfully');
            loadQuestionSets(); // Refresh the list
        } else {
            alert('Error deleting question set: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting question set:', error);
        alert('Network error');
    }
}

// Allow a student to retake the exam (admin action)
async function allowRetest(studentId, admitCardId, studentName) {
    const confirmMessage = `Allow retest for:\n\nStudent: ${studentName}\nAdmit Card: ${admitCardId}\n\nThis will:\n- Delete previous exam session\n- Allow the student to take the exam again\n\nAre you sure?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        const response = await fetch('/api/admin/retest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId })
        });

        const data = await response.json();
        if (response.ok) {
            alert(`✓ Retest allowed successfully!\n\n${studentName} can now log in and take the exam again.`);
            loadResults();
            loadStudents();
        } else {
            alert('Failed to allow retest: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error allowing retest:', error);
        alert('Network error while allowing retest');
    }
}

// Old questionExam dropdown listener - no longer needed
/*
document.getElementById('questionExam').addEventListener('change', async (e) => {
    const examId = e.target.value;
    if (examId) {
        loadQuestionsForExam(examId);
    }
});

async function loadQuestionsForExam(examId) {
    try {
        const response = await fetch(`/api/admin/exams/${examId}/questions`);
        const questions = await response.json();
        
        const container = document.getElementById('questionsList');
        
        if (questions.length === 0) {
            container.innerHTML = '<p class="no-data">No questions uploaded yet</p>';
            return;
        }
        
        container.innerHTML = `<p><strong>${questions.length} questions loaded</strong></p>`;
        
        questions.forEach((q, index) => {
            const div = document.createElement('div');
            div.style.cssText = 'background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 3px solid #333;';
            div.innerHTML = `
                <p><strong>Q${index + 1}:</strong> ${q.question_text}</p>
                <p style="color: #666; margin-left: 20px;">
                    A) ${q.option_a}<br>
                    B) ${q.option_b}<br>
                    C) ${q.option_c}<br>
                    D) ${q.option_d}<br>
                    <strong style="color: green;">Correct: ${q.correct_answer}</strong> | 
                    <strong>Marks: ${q.marks}</strong>
                </p>
            `;
            container.appendChild(div);
        });
        
    } catch (error) {
        console.error('Failed to load questions:', error);
    }
}
*/

let allResults = []; // Store all results for filtering
let filteredResults = [];

async function loadResults() {
    try {
        const response = await fetch('/api/admin/results');
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('Failed to fetch /api/admin/results:', response.status, text);
            allResults = [];
            filteredResults = [];
            displayResults(filteredResults);
            return;
        }

        // Protect against empty or invalid JSON
        const text = await response.text();
        if (!text) {
            console.error('Empty response from /api/admin/results');
            allResults = [];
            filteredResults = [];
            displayResults(filteredResults);
            return;
        }

        try {
            allResults = JSON.parse(text);
        } catch (err) {
            console.error('Invalid JSON from /api/admin/results:', err, text);
            allResults = [];
        }

        filteredResults = [...allResults];

        // Populate filter dropdowns
        populateFilters();

        // Display results
        displayResults(filteredResults);
    } catch (error) {
        console.error('Failed to load results (network error):', error);
    }
}

function populateFilters() {
    // Get unique values
    const districts = [...new Set(allResults.map(r => r.district))].sort();
    const centers = [...new Set(allResults.map(r => r.center_name))].sort();
    const trades = [...new Set(allResults.map(r => r.trade_name))].sort();
    const exams = [...new Set(allResults.map(r => r.exam_title))].sort();
    
    // Populate district filter
    const districtSelect = document.getElementById('filterDistrict');
    districtSelect.innerHTML = '<option value="">All Districts</option>';
    districts.forEach(d => {
        districtSelect.innerHTML += `<option value="${d}">${d}</option>`;
    });
    
    // Populate center filter
    const centerSelect = document.getElementById('filterCenter');
    centerSelect.innerHTML = '<option value="">All Centers</option>';
    centers.forEach(c => {
        centerSelect.innerHTML += `<option value="${c}">${c}</option>`;
    });
    
    // Populate trade filter
    const tradeSelect = document.getElementById('filterTrade');
    tradeSelect.innerHTML = '<option value="">All Trades</option>';
    trades.forEach(t => {
        tradeSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });
    
    // Populate exam filter
    const examSelect = document.getElementById('filterExam');
    examSelect.innerHTML = '<option value="">All Exams</option>';
    exams.forEach(e => {
        examSelect.innerHTML += `<option value="${e}">${e}</option>`;
    });
}

function filterResults() {
    const district = document.getElementById('filterDistrict').value;
    const center = document.getElementById('filterCenter').value;
    const trade = document.getElementById('filterTrade').value;
    const exam = document.getElementById('filterExam').value;
    const status = document.getElementById('filterStatus').value;
    
    filteredResults = allResults.filter(r => {
        return (!district || r.district === district) &&
               (!center || r.center_name === center) &&
               (!trade || r.trade_name === trade) &&
               (!exam || r.exam_title === exam) &&
               (!status || r.status === status);
    });
    
    displayResults(filteredResults);
}

function resetFilters() {
    document.getElementById('filterDistrict').value = '';
    document.getElementById('filterCenter').value = '';
    document.getElementById('filterTrade').value = '';
    document.getElementById('filterExam').value = '';
    document.getElementById('filterStatus').value = '';
    filteredResults = [...allResults];
    displayResults(filteredResults);
}

function displayResults(results) {
    const tbody = document.getElementById('resultsTable');
    tbody.innerHTML = '';
    
    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="no-data">No results match your filters</td></tr>';
        return;
    }
    
    results.forEach(result => {
        const tr = document.createElement('tr');
        
        let statusClass = 'status-' + result.status;
        let statusText = result.status.charAt(0).toUpperCase() + result.status.slice(1);
        
        // Calculate score percentage
        const totalMarks = result.total_marks || 100;
        const scorePercentage = (result.score / totalMarks) * 100;
        let scoreClass = 'score-highlight';
        if (scorePercentage >= 70) scoreClass += ' score-high';
        else if (scorePercentage >= 40) scoreClass += ' score-medium';
        else scoreClass += ' score-low';
        
        // Action buttons
        const canRetest = result.status === 'completed' || result.status === 'kicked';
        const retestButton = canRetest ? 
            `<button class="btn btn-sm btn-warning me-1" onclick="allowRetest(${result.student_id}, '${result.admit_card_id}', '${result.student_name}')" title="Allow student to retake exam">
                <i class="bi bi-arrow-clockwise"></i>
            </button>` : '';
        
        const viewProfileButton = `<button class="btn btn-sm btn-primary" onclick="viewStudentProfile(${result.student_id})" title="View student profile">
                <i class="bi bi-person-badge"></i>
            </button>`;
        
        tr.innerHTML = `
            <td>${result.admit_card_id}</td>
            <td>${result.student_name}</td>
            <td>${result.district}</td>
            <td>${result.center_name}</td>
            <td>${result.trade_name}</td>
            <td>${result.exam_title}</td>
            <td class="score-column"><span class="${scoreClass}">${result.score || 0} / ${totalMarks}</span></td>
            <td>${result.answered_questions || 0}</td>
            <td><strong style="color: ${result.warnings > 0 ? '#e74c3c' : '#27ae60'}">${result.warnings}</strong></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${new Date(result.start_time).toLocaleString()}</td>
            <td>${viewProfileButton} ${retestButton}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Update the charts based on filtered results
    updateResultsCharts(results);
}

// Chart Carousel Navigation - Separate for each category
let currentDistrictChartIndex = 0;
let currentCenterChartIndex = 0;
let currentTradeChartIndex = 0;

// District Chart Carousel
function nextDistrictChart() {
    if (currentDistrictChartIndex < 1) {
        currentDistrictChartIndex++;
        updateDistrictChartCarousel();
    }
}

function previousDistrictChart() {
    if (currentDistrictChartIndex > 0) {
        currentDistrictChartIndex--;
        updateDistrictChartCarousel();
    }
}

function updateDistrictChartCarousel() {
    const slider = document.getElementById('districtChartSlider');
    if (slider) {
        slider.style.transform = `translateX(-${currentDistrictChartIndex * 100}%)`;
        const chartType = currentDistrictChartIndex === 0 ? 'Pie Chart' : 'Bar Chart';
        document.getElementById('districtChartIndicator').textContent = chartType;
    }
}

// Center Chart Carousel
function nextCenterChart() {
    if (currentCenterChartIndex < 1) {
        currentCenterChartIndex++;
        updateCenterChartCarousel();
    }
}

function previousCenterChart() {
    if (currentCenterChartIndex > 0) {
        currentCenterChartIndex--;
        updateCenterChartCarousel();
    }
}

function updateCenterChartCarousel() {
    const slider = document.getElementById('centerChartSlider');
    if (slider) {
        slider.style.transform = `translateX(-${currentCenterChartIndex * 100}%)`;
        const chartType = currentCenterChartIndex === 0 ? 'Pie Chart' : 'Bar Chart';
        document.getElementById('centerChartIndicator').textContent = chartType;
    }
}

// Trade Chart Carousel
function nextTradeChart() {
    if (currentTradeChartIndex < 1) {
        currentTradeChartIndex++;
        updateTradeChartCarousel();
    }
}

function previousTradeChart() {
    if (currentTradeChartIndex > 0) {
        currentTradeChartIndex--;
        updateTradeChartCarousel();
    }
}

function updateTradeChartCarousel() {
    const slider = document.getElementById('tradeChartSlider');
    if (slider) {
        slider.style.transform = `translateX(-${currentTradeChartIndex * 100}%)`;
        const chartType = currentTradeChartIndex === 0 ? 'Pie Chart' : 'Bar Chart';
        document.getElementById('tradeChartIndicator').textContent = chartType;
    }
}

// Fullscreen Chart Modal
let fullscreenChartInstance = null;

function openFullscreen(canvasId, title) {
    const sourceCanvas = document.getElementById(canvasId);
    if (!sourceCanvas) return;
    
    // Get the chart instance
    const sourceChart = Chart.getChart(sourceCanvas);
    if (!sourceChart) return;
    
    // Set title
    document.getElementById('fullscreenChartTitle').textContent = title;
    
    // Destroy previous fullscreen chart if exists
    if (fullscreenChartInstance) {
        fullscreenChartInstance.destroy();
    }
    
    // Create fullscreen chart with same config
    const fullscreenCanvas = document.getElementById('fullscreenChartCanvas');
    fullscreenChartInstance = new Chart(fullscreenCanvas, {
        type: sourceChart.config.type,
        data: JSON.parse(JSON.stringify(sourceChart.data)),
        options: {
            ...sourceChart.config.options,
            maintainAspectRatio: true,
            responsive: true,
            plugins: {
                ...sourceChart.config.options.plugins,
                legend: {
                    ...sourceChart.config.options.plugins.legend,
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        font: { size: 12 },
                        padding: 15
                    }
                }
            }
        }
    });
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('fullscreenChartModal'));
    modal.show();
}

// Helper function to generate colors for charts
function generateColors(count) {
    const colors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(199, 199, 199, 0.6)',
        'rgba(83, 102, 255, 0.6)',
        'rgba(255, 99, 255, 0.6)',
        'rgba(99, 255, 132, 0.6)',
        'rgba(255, 132, 99, 0.6)',
        'rgba(132, 99, 255, 0.6)'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

// Chart instances for results tab
let resultsDistrictPie = null;
let resultsDistrictBar = null;
let resultsCenterPie = null;
let resultsCenterBar = null;
let resultsTradePie = null;
let resultsTradeBar = null;

function updateResultsCharts(results) {
    if (results.length === 0) return;
    
    // District-wise performance
    const districtData = {};
    results.forEach(r => {
        if (!districtData[r.district]) {
            districtData[r.district] = { total: 0, sum: 0, count: 0 };
        }
        districtData[r.district].sum += (r.score || 0);
        districtData[r.district].total += (r.total_marks || 100);
        districtData[r.district].count++;
    });
    
    const districtLabels = Object.keys(districtData);
    const districtPercentages = districtLabels.map(d => 
        ((districtData[d].sum / districtData[d].total) * 100).toFixed(1)
    );
    
    // Center-wise performance
    const centerData = {};
    results.forEach(r => {
        if (!centerData[r.center_name]) {
            centerData[r.center_name] = { total: 0, sum: 0, count: 0 };
        }
        centerData[r.center_name].sum += (r.score || 0);
        centerData[r.center_name].total += (r.total_marks || 100);
        centerData[r.center_name].count++;
    });
    
    const centerLabels = Object.keys(centerData).slice(0, 15); // Top 15 centers
    const centerPercentages = centerLabels.map(c => 
        ((centerData[c].sum / centerData[c].total) * 100).toFixed(1)
    );
    
    // Trade-wise performance
    const tradeData = {};
    results.forEach(r => {
        if (!tradeData[r.trade_name]) {
            tradeData[r.trade_name] = { total: 0, sum: 0, count: 0 };
        }
        tradeData[r.trade_name].sum += (r.score || 0);
        tradeData[r.trade_name].total += (r.total_marks || 100);
        tradeData[r.trade_name].count++;
    });
    
    const tradeLabels = Object.keys(tradeData);
    const tradePercentages = tradeLabels.map(t => 
        ((tradeData[t].sum / tradeData[t].total) * 100).toFixed(1)
    );
    
    // Destroy existing charts
    if (resultsDistrictPie) resultsDistrictPie.destroy();
    if (resultsDistrictBar) resultsDistrictBar.destroy();
    if (resultsCenterPie) resultsCenterPie.destroy();
    if (resultsCenterBar) resultsCenterBar.destroy();
    if (resultsTradePie) resultsTradePie.destroy();
    if (resultsTradeBar) resultsTradeBar.destroy();
    
    // District Pie Chart
    const districtPieCtx = document.getElementById('resultsDistrictPie');
    if (districtPieCtx) {
        resultsDistrictPie = new Chart(districtPieCtx, {
            type: 'pie',
            data: {
                labels: districtLabels,
                datasets: [{
                    data: districtPercentages,
                    backgroundColor: generateColors(districtLabels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, font: { size: 9 } } },
                    title: { display: false }
                }
            }
        });
    }
    
    // District Bar Chart
    const districtBarCtx = document.getElementById('resultsDistrictBar');
    if (districtBarCtx) {
        resultsDistrictBar = new Chart(districtBarCtx, {
            type: 'bar',
            data: {
                labels: districtLabels,
                datasets: [{
                    label: 'Avg Score %',
                    data: districtPercentages,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
    
    // Center Pie Chart
    const centerPieCtx = document.getElementById('resultsCenterPie');
    if (centerPieCtx) {
        resultsCenterPie = new Chart(centerPieCtx, {
            type: 'pie',
            data: {
                labels: centerLabels,
                datasets: [{
                    data: centerPercentages,
                    backgroundColor: generateColors(centerLabels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, font: { size: 9 } } },
                    title: { display: false }
                }
            }
        });
    }
    
    // Center Bar Chart
    const centerBarCtx = document.getElementById('resultsCenterBar');
    if (centerBarCtx) {
        resultsCenterBar = new Chart(centerBarCtx, {
            type: 'bar',
            data: {
                labels: centerLabels,
                datasets: [{
                    label: 'Avg Score %',
                    data: centerPercentages,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
    
    // Trade Pie Chart
    const tradePieCtx = document.getElementById('resultsTradePie');
    if (tradePieCtx) {
        resultsTradePie = new Chart(tradePieCtx, {
            type: 'pie',
            data: {
                labels: tradeLabels,
                datasets: [{
                    data: tradePercentages,
                    backgroundColor: generateColors(tradeLabels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, font: { size: 9 } } },
                    title: { display: false }
                }
            }
        });
    }
    
    // Trade Bar Chart
    const tradeBarCtx = document.getElementById('resultsTradeBar');
    if (tradeBarCtx) {
        resultsTradeBar = new Chart(tradeBarCtx, {
            type: 'bar',
            data: {
                labels: tradeLabels,
                datasets: [{
                    label: 'Avg Score %',
                    data: tradePercentages,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

function exportResults(format) {
    if (filteredResults.length === 0) {
        alert('No results to export');
        return;
    }
    
    if (format === 'csv') {
        exportCSV();
    } else if (format === 'excel') {
        exportExcel();
    }
}

function exportCSV() {
    const headers = ['Admit Card', 'Student Name', 'District', 'Center', 'Trade', 'Exam', 'Score', 'Total Marks', 'Answered', 'Warnings', 'Status', 'Start Time'];
    const csvContent = [
        headers.join(','),
        ...filteredResults.map(r => [
            r.admit_card_id,
            `"${r.student_name}"`,
            `"${r.district}"`,
            `"${r.center_name}"`,
            `"${r.trade_name}"`,
            `"${r.exam_title}"`,
            r.score || 0,
            r.total_marks || 100,
            r.answered_questions || 0,
            r.warnings,
            r.status,
            new Date(r.start_time).toLocaleString()
        ].join(','))
    ].join('\n');
    
    downloadFile(csvContent, 'exam_results.csv', 'text/csv');
}

function exportExcel() {
    // Simple HTML table export that can be opened in Excel
    let html = '<table><thead><tr>';
    html += '<th>Admit Card</th><th>Student Name</th><th>District</th><th>Center</th><th>Trade</th>';
    html += '<th>Exam</th><th>Score</th><th>Total Marks</th><th>Answered</th><th>Warnings</th><th>Status</th><th>Start Time</th>';
    html += '</tr></thead><tbody>';
    
    filteredResults.forEach(r => {
        html += '<tr>';
        html += `<td>${r.admit_card_id}</td>`;
        html += `<td>${r.student_name}</td>`;
        html += `<td>${r.district}</td>`;
        html += `<td>${r.center_name}</td>`;
        html += `<td>${r.trade_name}</td>`;
        html += `<td>${r.exam_title}</td>`;
        html += `<td>${r.score || 0}</td>`;
        html += `<td>${r.total_marks || 100}</td>`;
        html += `<td>${r.answered_questions || 0}</td>`;
        html += `<td>${r.warnings}</td>`;
        html += `<td>${r.status}</td>`;
        html += `<td>${new Date(r.start_time).toLocaleString()}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    downloadFile(html, 'exam_results.xls', 'application/vnd.ms-excel');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Add JSON file upload function
function uploadJsonFile() {
    const fileInput = document.getElementById('jsonFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a JSON file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            document.getElementById('questionsJson').value = JSON.stringify(json, null, 2);
            uploadQuestions();
        } catch (error) {
            alert('Invalid JSON file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

async function loadProctoringLogs() {
    try {
        const response = await fetch('/api/admin/proctoring-logs');
        const logs = await response.json();
        
        const tbody = document.getElementById('proctoringTable');
        tbody.innerHTML = '';
        
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No violations logged</td></tr>';
            return;
        }
        
        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td>${log.admit_card_id}</td>
                <td>${log.student_name}</td>
                <td>${log.trade_name}</td>
                <td><strong style="color: #c00;">${log.violation_type}</strong></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Failed to load proctoring logs:', error);
    }
}

function handleLiveAlert(data) {
    // Update overview counter
    const currentCount = parseInt(document.getElementById('proctoringAlerts').textContent);
    document.getElementById('proctoringAlerts').textContent = currentCount + 1;
    
    // Add to live alerts
    const container = document.getElementById('alertsContainer');
    
    // Remove "no alerts" message if exists
    const noData = container.querySelector('.no-data');
    if (noData) noData.remove();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-item new';
    alertDiv.innerHTML = `
        <p><strong>${data.studentName}</strong> (${data.admitCard})</p>
        <p>Exam: ${data.examTitle}</p>
        <p style="color: #c00;"><strong>Violation:</strong> ${data.violationType}</p>
        <p><strong>Warnings:</strong> ${data.warnings}/3</p>
        <p class="alert-time">${data.timestamp}</p>
    `;
    
    container.insertBefore(alertDiv, container.firstChild);
    
    // Play alert sound (optional)
    // new Audio('/sounds/alert.mp3').play();
    
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
        new Notification('Proctoring Violation', {
            body: `${data.studentName} - ${data.violationType}`,
            icon: '/favicon.ico'
        });
    }
}

// Show result notification
function showResultNotification(data) {
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
        new Notification('Exam Completed', {
            body: `A student has submitted their exam. Score: ${data.score}/${data.total_marks}`,
            icon: '/favicon.ico'
        });
    }
    
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    toast.innerHTML = `
        <strong>📝 Exam Submitted</strong><br>
        Score: ${data.score}/${data.total_marks} (${data.percentage.toFixed(1)}%)
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Request notification permission on load
if (Notification.permission === 'default') {
    Notification.requestPermission();
}

// Analytics Charts
let charts = {};

async function loadAnalytics() {
    try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('Failed to fetch /api/admin/analytics:', response.status, text);
            return;
        }

        const text = await response.text();
        if (!text) {
            console.error('Empty response from /api/admin/analytics');
            return;
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            console.error('Invalid JSON from /api/admin/analytics:', err, text);
            return;
        }

        // Update statistics
        const stats = data.statistics || {};
        document.getElementById('avgScore').textContent = stats.avg_score ? stats.avg_score.toFixed(1) + '%' : 'N/A';
        document.getElementById('passRate').textContent = stats.pass_rate ? stats.pass_rate.toFixed(1) + '%' : 'N/A';
        document.getElementById('totalViolations').textContent = stats.total_violations || 0;
        document.getElementById('kickedStudents').textContent = stats.kicked_students || 0;

        // Results Distribution Pie Chart
        createResultsDistributionChart(data.statusDistribution || []);

        // Trade Performance Bar Chart
        createTradePerformanceChart(data.tradePerformance || []);

        // District Participation Chart
        createDistrictParticipationChart(data.districtParticipation || []);

        // Violations Chart
        createViolationsChart(data.violations || []);

        // Completion Timeline
        createCompletionTimelineChart(data.completionTimeline || []);

    } catch (error) {
        console.error('Failed to load analytics (network error):', error);
    }
}

function createResultsDistributionChart(data) {
    const ctx = document.getElementById('resultsDistributionChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (charts.resultsDistribution) {
        charts.resultsDistribution.destroy();
    }
    
    const labels = data.map(d => d.status.charAt(0).toUpperCase() + d.status.slice(1));
    const values = data.map(d => d.count);
    const colors = {
        'Completed': '#28a745',
        'Active': '#ffc107',
        'Kicked': '#dc3545'
    };
    
    charts.resultsDistribution = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: labels.map(l => colors[l] || '#6c757d'),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: false
                }
            }
        }
    });
}

function createTradePerformanceChart(data) {
    const ctx = document.getElementById('tradePerformanceChart');
    if (!ctx) return;
    
    if (charts.tradePerformance) {
        charts.tradePerformance.destroy();
    }
    
    // Show top 10 trades
    const topTrades = data.slice(0, 10);
    
    charts.tradePerformance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topTrades.map(d => d.trade_name),
            datasets: [{
                label: 'Average Score (%)',
                data: topTrades.map(d => d.avg_percentage ? d.avg_percentage.toFixed(1) : 0),
                backgroundColor: '#007bff',
                borderColor: '#0056b3',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function createDistrictParticipationChart(data) {
    const ctx = document.getElementById('districtParticipationChart');
    if (!ctx) return;
    
    if (charts.districtParticipation) {
        charts.districtParticipation.destroy();
    }
    
    charts.districtParticipation = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.district),
            datasets: [{
                label: 'Students Participated',
                data: data.map(d => d.student_count),
                backgroundColor: '#17a2b8',
                borderColor: '#117a8b',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function createViolationsChart(data) {
    const ctx = document.getElementById('violationsChart');
    if (!ctx) return;
    
    if (charts.violations) {
        charts.violations.destroy();
    }
    
    charts.violations = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.violation_type),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: [
                    '#ff6384',
                    '#ff9f40',
                    '#ffcd56',
                    '#4bc0c0',
                    '#36a2eb'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createCompletionTimelineChart(data) {
    const ctx = document.getElementById('completionTimelineChart');
    if (!ctx) return;
    
    if (charts.completionTimeline) {
        charts.completionTimeline.destroy();
    }
    
    charts.completionTimeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => {
                const date = new Date(d.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Exams Completed',
                data: data.map(d => d.count),
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Student Profile Functions
// Helper function to safely escape HTML in text
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function viewStudentProfile(studentId) {
    try {
        const response = await fetch(`/api/admin/student-profile/${studentId}`);
        const data = await response.json();
        
        if (!data.student) {
            alert('Student not found');
            return;
        }
        
        const student = data.student;
        const sessions = data.sessions;
        const violations = data.violations;
        const answers = data.answers;
        
        console.log(`Loading profile for student ${studentId}:`);
        console.log(`- Sessions: ${sessions.length}`);
        console.log(`- Violations: ${violations.length}`);
        console.log(`- Answers: ${answers.length}`);
        
        // Clear previous content
        const container = document.getElementById('studentProfileContent');
        container.innerHTML = '';
        
        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'student-profile-print';
        
        // Add header
        wrapper.innerHTML = `
            <div class="text-center mb-4 print-header">
                <h3>India Skills Examination Portal</h3>
                <h4>Student Performance Report</h4>
                <p class="text-muted">Generated on: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="bi bi-person-badge me-2"></i>Student Information</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Name:</strong> ${student.name}</p>
                            <p><strong>Admit Card ID:</strong> ${student.admit_card_id}</p>
                            <p><strong>Date of Birth:</strong> ${student.dob}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Trade:</strong> ${student.trade_name}</p>
                            <p><strong>Center:</strong> ${student.center_name}</p>
                            <p><strong>District:</strong> ${student.district}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Exam Sessions
        if (sessions.length > 0) {
            const sessionsCard = document.createElement('div');
            sessionsCard.className = 'card mb-4';
            sessionsCard.innerHTML = `
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0"><i class="bi bi-file-earmark-text me-2"></i>Exam History</h5>
                </div>
                <div class="card-body">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Status</th>
                                <th>Score</th>
                                <th>Percentage</th>
                                <th>Warnings</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sessions.map(session => {
                                const statusBadge = session.status === 'completed' ? 'success' : 
                                                  session.status === 'active' ? 'warning' : 'danger';
                                return `
                                    <tr>
                                        <td>${new Date(session.start_time).toLocaleString()}</td>
                                        <td>${session.end_time ? new Date(session.end_time).toLocaleString() : 'N/A'}</td>
                                        <td><span class="badge bg-${statusBadge}">${session.status.toUpperCase()}</span></td>
                                        <td>${session.score !== null ? session.score + '/' + session.total_marks : 'N/A'}</td>
                                        <td>${session.percentage !== null ? session.percentage.toFixed(1) + '%' : 'N/A'}</td>
                                        <td>${session.warnings || 0}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            wrapper.appendChild(sessionsCard);
        }
        
        // Proctoring Violations
        if (violations.length > 0) {
            const violationsCard = document.createElement('div');
            violationsCard.className = 'card mb-4';
            violationsCard.innerHTML = `
                <div class="card-header bg-warning">
                    <h5 class="mb-0"><i class="bi bi-exclamation-triangle me-2"></i>Proctoring Violations</h5>
                </div>
                <div class="card-body">
                    <table class="table table-sm table-bordered">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Violation Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${violations.map(v => `
                                <tr>
                                    <td>${new Date(v.timestamp).toLocaleString()}</td>
                                    <td><strong>${v.violation_type}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            wrapper.appendChild(violationsCard);
        }
        
        // Answer Analysis - Build using DOM to avoid string length limits
        if (answers.length > 0) {
            const correctCount = answers.filter(a => a.is_correct).length;
            const totalCount = answers.length;
            const accuracy = ((correctCount / totalCount) * 100).toFixed(1);
            
            const analysisCard = document.createElement('div');
            analysisCard.className = 'card mb-4';
            
            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header bg-info text-white';
            cardHeader.innerHTML = '<h5 class="mb-0"><i class="bi bi-clipboard-check me-2"></i>Answer Analysis</h5>';
            
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';
            cardBody.innerHTML = `
                <p><strong>Total Questions:</strong> ${totalCount}</p>
                <p><strong>Correct Answers:</strong> ${correctCount}</p>
                <p><strong>Incorrect Answers:</strong> ${totalCount - correctCount}</p>
                <p><strong>Accuracy:</strong> ${accuracy}%</p>
                <div class="mt-4">
                    <h6>Question-wise Breakdown: (Showing all ${totalCount} questions)</h6>
                </div>
            `;
            
            const questionsList = document.createElement('div');
            questionsList.className = 'questions-list';
            questionsList.style.maxHeight = 'none';
            questionsList.style.overflow = 'visible';
            
            // Build each question card using DOM
            answers.forEach((a, index) => {
                const isCorrect = a.is_correct;
                const badgeClass = isCorrect ? 'bg-success' : 'bg-danger';
                const badgeText = isCorrect ? '✓ Correct' : '✗ Incorrect';
                
                // Escape HTML to prevent rendering issues with tags like <script>, <style>
                const questionText = escapeHtml(a.question_text || 'Question text not available');
                const optionA = escapeHtml(a.option_a || 'Option not available');
                const optionB = escapeHtml(a.option_b || 'Option not available');
                const optionC = escapeHtml(a.option_c || 'Option not available');
                const optionD = escapeHtml(a.option_d || 'Option not available');
                const correctAnswer = a.correct_answer || 'N/A';
                const selectedAnswer = a.selected_answer || 'Not Answered';
                
                const questionCard = document.createElement('div');
                questionCard.className = 'question-item card mb-3';
                questionCard.style.pageBreakInside = 'avoid';
                
                questionCard.innerHTML = `
                    <div class="card-header ${isCorrect ? 'bg-success' : 'bg-danger'} bg-opacity-10">
                        <strong>Question ${index + 1}</strong>
                        <span class="badge ${badgeClass} float-end">${badgeText}</span>
                    </div>
                    <div class="card-body">
                        <p class="mb-3"><strong>Q:</strong> ${questionText}</p>
                        <div class="options mb-3">
                            <div class="row">
                                <div class="col-md-6 mb-2">
                                    <p class="mb-0 ${selectedAnswer === 'A' ? (correctAnswer === 'A' ? 'text-success fw-bold' : 'text-danger fw-bold') : (correctAnswer === 'A' ? 'text-success fw-bold' : '')}">
                                        <strong>A:</strong> ${optionA}
                                        ${correctAnswer === 'A' ? '<i class="bi bi-check-circle-fill text-success ms-1"></i>' : ''}
                                        ${selectedAnswer === 'A' && correctAnswer !== 'A' ? '<i class="bi bi-x-circle-fill text-danger ms-1"></i>' : ''}
                                    </p>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <p class="mb-0 ${selectedAnswer === 'B' ? (correctAnswer === 'B' ? 'text-success fw-bold' : 'text-danger fw-bold') : (correctAnswer === 'B' ? 'text-success fw-bold' : '')}">
                                        <strong>B:</strong> ${optionB}
                                        ${correctAnswer === 'B' ? '<i class="bi bi-check-circle-fill text-success ms-1"></i>' : ''}
                                        ${selectedAnswer === 'B' && correctAnswer !== 'B' ? '<i class="bi bi-x-circle-fill text-danger ms-1"></i>' : ''}
                                    </p>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <p class="mb-0 ${selectedAnswer === 'C' ? (correctAnswer === 'C' ? 'text-success fw-bold' : 'text-danger fw-bold') : (correctAnswer === 'C' ? 'text-success fw-bold' : '')}">
                                        <strong>C:</strong> ${optionC}
                                        ${correctAnswer === 'C' ? '<i class="bi bi-check-circle-fill text-success ms-1"></i>' : ''}
                                        ${selectedAnswer === 'C' && correctAnswer !== 'C' ? '<i class="bi bi-x-circle-fill text-danger ms-1"></i>' : ''}
                                    </p>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <p class="mb-0 ${selectedAnswer === 'D' ? (correctAnswer === 'D' ? 'text-success fw-bold' : 'text-danger fw-bold') : (correctAnswer === 'D' ? 'text-success fw-bold' : '')}">
                                        <strong>D:</strong> ${optionD}
                                        ${correctAnswer === 'D' ? '<i class="bi bi-check-circle-fill text-success ms-1"></i>' : ''}
                                        ${selectedAnswer === 'D' && correctAnswer !== 'D' ? '<i class="bi bi-x-circle-fill text-danger ms-1"></i>' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="answer-summary">
                            <p class="mb-0">
                                <strong>Student Answer:</strong> 
                                <span class="badge ${isCorrect ? 'bg-success' : 'bg-danger'}">${selectedAnswer}</span>
                                <span class="ms-3"><strong>Correct Answer:</strong></span> 
                                <span class="badge bg-success">${correctAnswer}</span>
                            </p>
                        </div>
                    </div>
                `;
                
                questionsList.appendChild(questionCard);
            });
            
            console.log(`Rendered ${answers.length} questions in the modal`);
            
            cardBody.appendChild(questionsList);
            analysisCard.appendChild(cardHeader);
            analysisCard.appendChild(cardBody);
            wrapper.appendChild(analysisCard);
        }
        
        // Add to DOM
        container.appendChild(wrapper);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('studentProfileModal'));
        modal.show();
        
    } catch (error) {
        console.error('Failed to load student profile:', error);
        alert('Failed to load student profile');
    }
}

function printStudentReport() {
    window.print();
}

