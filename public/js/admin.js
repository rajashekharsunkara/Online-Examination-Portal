let socket = io(); // Initialize Socket.io immediately
let currentAdmin = null;

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
    
    // Load initial data
    loadCenters();
    loadTrades();
    loadStudents(); // Load all students
    loadTradesTable(); // Load trades in the Manage Trades tab
    loadResults();
    loadProctoringLogs();
    loadOverview();
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
        
        // Populate the trade selector in Questions tab
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
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No students registered</td></tr>';
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
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${student.admit_card_id}</strong></td>
                <td>${student.name}</td>
                <td>${student.dob}</td>
                <td>${student.trade_name}</td>
                <td>${student.center_name}</td>
                <td>${student.district}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Failed to load students:', error);
        document.getElementById('studentsTable').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load students</td></tr>';
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
            const totalMarks = trade.questions_per_exam * trade.marks_per_question;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${trade.id}</td>
                <td><strong>${trade.name}</strong></td>
                <td>${trade.duration}</td>
                <td>${trade.questions_per_exam}</td>
                <td>${trade.marks_per_question}</td>
                <td><strong>${totalMarks}</strong></td>
                <td><span class="badge ${trade.question_count >= trade.questions_per_exam ? 'bg-success' : 'bg-warning text-dark'}">${trade.question_count}</span></td>
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

async function uploadQuestions() {
    const tradeId = document.getElementById('questionTrade').value;
    const jsonText = document.getElementById('questionsJson').value;
    
    if (!tradeId) {
        alert('Please select a trade first');
        return;
    }
    
    if (!jsonText) {
        alert('Please enter questions in JSON format');
        return;
    }
    
    try {
        const questions = JSON.parse(jsonText);
        
        const response = await fetch('/api/admin/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trade_id: tradeId, questions: questions })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('uploadResult').className = 'alert alert-success';
            document.getElementById('uploadResult').textContent = 
                `✓ Successfully uploaded ${data.count} questions to question bank!`;
            document.getElementById('questionsJson').value = '';
            loadTradesTable(); // Refresh the trades table to show updated question counts
        } else {
            document.getElementById('uploadResult').className = 'message error';
            document.getElementById('uploadResult').textContent = 
                'Failed to upload: ' + data.error;
        }
    } catch (error) {
        alert('Invalid JSON format. Please check your input.');
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
        allResults = await response.json();
        filteredResults = [...allResults];
        
        // Populate filter dropdowns
        populateFilters();
        
        // Display results
        displayResults(filteredResults);
    } catch (error) {
        console.error('Failed to load results:', error);
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
        tbody.innerHTML = '<tr><td colspan="11" class="no-data">No results match your filters</td></tr>';
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
        `;
        tbody.appendChild(tr);
    });
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

// Request notification permission on load
if (Notification.permission === 'default') {
    Notification.requestPermission();
}
