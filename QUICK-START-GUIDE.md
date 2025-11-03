# Quick Start Guide - Set-Based Question System

## 🚀 Starting the System

```bash
# Start both servers (student + admin)
node start-both.js

# Or start individually:
node student-server.js    # Port 3000
node admin-server.js      # Port 3001
```

## 👨‍💼 Admin Quick Guide

### Login
- URL: http://localhost:3001
- Username: `admin`
- Password: `admin123`

### Upload a Question Set (30 Questions)

1. Go to **Question Sets** tab (Tab 6)
2. Select a trade from dropdown
3. Click **"Upload New Set"** button
4. Fill in:
   - Set Name (e.g., "Cloud Computing Set 1")
   - Set Number (e.g., 1, 2, 3...)
5. Add questions (2 ways):
   - **Method 1**: Upload JSON file
   - **Method 2**: Paste JSON array
6. Click **"Upload from JSON"** or **"Upload from File"**

### Question Set JSON Format

```json
[
  {
    "question_text": "What is cloud computing?",
    "option_a": "Computing in the sky",
    "option_b": "Internet-based computing services",
    "option_c": "Weather prediction",
    "option_d": "None of the above",
    "correct_answer": "B"
  },
  {
    "question_text": "Which is a cloud service provider?",
    "option_a": "AWS",
    "option_b": "Netflix",
    "option_c": "Facebook",
    "option_d": "Twitter",
    "correct_answer": "A"
  }
  ... (28 more questions - total must be 30)
]
```

**Important**: 
- Must have exactly 30 questions
- correct_answer must be "A", "B", "C", or "D"
- All fields are required

### View Analytics

1. Go to **Analytics** tab (Tab 7)
2. View 5 different charts:
   - Results Distribution
   - Trade Performance
   - District Participation
   - Proctoring Violations
   - Completion Timeline

### View Student Report

1. Go to **Students** tab (Tab 2)
2. Click **"View Profile"** on any student
3. See complete exam history
4. Click **"Print Report"** for printable version

## 👨‍🎓 Student Quick Guide

### Login
- URL: http://localhost:3000
- Admit Card ID: (e.g., `AS/01/001/001`)
- Password: Date of birth (YYYY-MM-DD format)

### Take Exam

1. After login, click **"Start Exam"**
2. You'll get 30 questions from one random set
3. Answer all questions
4. Submit when ready
5. You'll see confirmation (no score shown)

### Sample Student Credentials

Check `TEST-USERS-CREDENTIALS.csv` for full list. Examples:
```
Admit Card ID    | Password      | Trade
AS/01/001/001    | 2000-01-15    | Cloud Computing
AS/02/002/001    | 2000-02-20    | Web Technologies
AS/03/003/001    | 2000-03-10    | Software Development
```

## 📊 Understanding the System

### How Question Sets Work

1. **Admin uploads sets**:
   - Cloud Computing Set 1 (30 questions)
   - Cloud Computing Set 2 (30 questions)
   - Cloud Computing Set 3 (30 questions)

2. **Student starts exam**:
   - System randomly picks ONE set (e.g., Set 2)
   - Student gets all 30 questions from Set 2
   - Questions stay in order (1-30)

3. **Scoring**:
   - Each question: 4 marks
   - Total: 30 × 4 = 120 marks
   - Pass: 60% (18 correct answers)

### Benefits

✅ **Fair**: All students get complete, balanced sets
✅ **Secure**: Multiple sets prevent cheating
✅ **Consistent**: Each set has curated difficulty
✅ **Easy**: Admin uploads complete sets, not individual questions

## 🛠️ Common Tasks

### Add More Sets to a Trade

```bash
# Example: Add Set 2 for Web Technologies
1. Prepare JSON with 30 questions
2. Admin panel → Question Sets tab
3. Select "Web Technologies"
4. Upload New Set → Set Number: 2
5. Upload questions
```

### Delete a Question Set

```bash
1. Question Sets tab
2. Select trade
3. Find the set to delete
4. Click "Delete" button
5. Confirm (all 30 questions will be removed)
```

### View Questions in a Set

```bash
1. Question Sets tab
2. Select trade
3. Click "View" on any set
4. Modal shows all 30 questions with answers
```

### Reset Database

```bash
# Warning: Deletes all data!
node recreate-database.js      # Creates schema
node populate-real-data.js     # Adds 48 trades, 26 centers, 130 students
node upload-sample-sets.js     # Adds 4 sample question sets
```

## 📈 Monitoring System

### Check Current Data

```bash
# View all question sets
sqlite3 exam_portal.db "SELECT t.name, qs.set_name, COUNT(qb.id) as questions 
FROM question_sets qs 
JOIN trades t ON qs.trade_id = t.id 
LEFT JOIN question_bank qb ON qs.id = qb.set_id 
GROUP BY qs.id;"

# View active exam sessions
sqlite3 exam_portal.db "SELECT s.name, t.name, es.status, es.start_time 
FROM exam_sessions es 
JOIN students s ON es.student_id = s.id 
JOIN trades t ON es.trade_id = t.id;"

# View results summary
sqlite3 exam_portal.db "SELECT t.name, COUNT(*) as exams, 
AVG(r.score) as avg_score, AVG(r.percentage) as avg_percent 
FROM results r 
JOIN trades t ON r.trade_id = t.id 
GROUP BY t.id;"
```

## 🎯 Validation Checklist

Before exam day, verify:

- [ ] All required trades have question sets uploaded
- [ ] Each set has exactly 30 questions
- [ ] Sample exam completed successfully
- [ ] Admin can see results in dashboard
- [ ] Analytics charts display correctly
- [ ] Student reports print properly
- [ ] Proctoring violations are logged
- [ ] All students have correct trade assignment

## 🔧 Troubleshooting

### "No question sets available"
- Solution: Upload at least one 30-question set for that trade

### "Must be exactly 30 questions"
- Solution: Count your questions array - must have 30 items

### Student can't login
- Check: Admit card ID format (e.g., AS/01/001/001)
- Check: Password is DOB in YYYY-MM-DD format
- Check: Student exists in database

### Charts not showing data
- Reason: No exam results yet
- Solution: Complete some test exams first

### Database error
- Solution: Run `node recreate-database.js` and `node populate-real-data.js`

## 📞 File Locations

```
Configuration:
- Database: exam_portal.db
- Student Server: student-server.js (port 3000)
- Admin Server: admin-server.js (port 3001)

Question Sets:
- Sample sets: *_Set*_30Questions.json
- Upload script: upload-sample-sets.js
- Create script: create-sample-sets.js

Student Files:
- Frontend: public/student.html
- JavaScript: public/js/student.js
- Exam page: public/exam.html

Admin Files:
- Frontend: public/admin.html
- JavaScript: public/js/admin.js
- Styles: public/css/admin.css

Documentation:
- Complete guide: SET-BASED-SYSTEM-COMPLETE.md
- Quick start: QUICK-START-GUIDE.md (this file)
- Updates: UPDATES.md
- Test credentials: TEST-USERS-CREDENTIALS.csv
```

## ✅ Quick Test

Run this to verify everything works:

```bash
# 1. Reset database
node recreate-database.js && node populate-real-data.js

# 2. Upload sample sets
node upload-sample-sets.js

# 3. Start servers
node start-both.js

# 4. Test admin panel
# Open http://localhost:3001
# Login: admin / admin123
# Go to Question Sets tab, select "Web Technologies"
# You should see "Web Technologies Set 1" with 30 questions

# 5. Test student exam
# Open http://localhost:3000
# Login: AS/01/001/001 / 2000-01-15
# Start exam and verify you get 30 questions
```

## 🎉 You're Ready!

The system is fully configured and ready for use. Upload your question sets and start conducting exams!

For detailed information, see `SET-BASED-SYSTEM-COMPLETE.md`
