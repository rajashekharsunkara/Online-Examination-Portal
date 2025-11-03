const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./database');

const app = express();
const server = http.createServer(app);

const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Student authentication
app.post('/api/student/login', (req, res) => {
  const { admit_card_id, dob } = req.body;
  
  db.get(`
    SELECT s.*, c.name as center_name, t.name as trade_name, t.id as trade_id,
           t.duration, t.questions_per_set, t.marks_per_question
    FROM students s
    JOIN centers c ON s.center_id = c.id
    JOIN trades t ON s.trade_id = t.id
    WHERE s.admit_card_id = ? AND s.dob = ?
  `, [admit_card_id, dob], (err, student) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!student) {
      return res.status(401).json({ error: 'Invalid admit card ID or date of birth' });
    }

    // Check if student already has an active session or was kicked
    db.get('SELECT * FROM exam_sessions WHERE student_id = ?',
      [student.id], (err, session) => {
        if (session) {
          if (session.status === 'kicked') {
            return res.status(403).json({ 
              error: 'You have been disqualified from this exam due to multiple proctoring violations',
              kicked: true
            });
          } else if (session.status === 'active') {
            return res.status(400).json({ error: 'You already have an active exam session' });
          } else if (session.status === 'completed') {
            return res.status(400).json({ error: 'You have already completed this exam' });
          }
        }

        // Create exam object from trade data (30 questions per set)
        const exam = {
          id: student.trade_id,
          title: `${student.trade_name} Examination`,
          trade_id: student.trade_id,
          duration: student.duration,
          total_marks: 30 * student.marks_per_question // Always 30 questions
        };

        res.json({ 
          success: true, 
          student: {
            id: student.id,
            name: student.name,
            admit_card_id: student.admit_card_id,
            center_name: student.center_name,
            trade_name: student.trade_name,
            district: student.district
          },
          exam: exam
        });
      });
  });
});

// Start exam session
app.post('/api/student/start-exam', (req, res) => {
  const { student_id, exam_id } = req.body;
  
  // Get student's trade info
  db.get('SELECT trade_id FROM students WHERE id = ?', [student_id], (err, student) => {
    if (err || !student) {
      return res.status(500).json({ error: 'Failed to find student' });
    }

    // Get trade settings
    db.get('SELECT questions_per_set, marks_per_question FROM trades WHERE id = ?', 
      [student.trade_id], (err, trade) => {
        if (err || !trade) {
          return res.status(500).json({ error: 'Failed to find trade' });
        }

        // Get a random active question set for this trade
        db.all(`
          SELECT id FROM question_sets 
          WHERE trade_id = ? AND is_active = 1
        `, [student.trade_id], (err, sets) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to find question sets' });
          }
          
          if (sets.length === 0) {
            return res.status(500).json({ 
              error: 'No question sets available for this trade. Please contact administrator.' 
            });
          }

          // Randomly select one set
          const randomSet = sets[Math.floor(Math.random() * sets.length)];
          const setId = randomSet.id;

          // Create exam session with assigned set
          db.run(
            'INSERT INTO exam_sessions (student_id, trade_id, set_id, start_time, status) VALUES (?, ?, ?, datetime("now"), "active")',
            [student_id, student.trade_id, setId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to start exam session' });
              }
              
              const sessionId = this.lastID;
              
              // Get all 30 questions from the assigned set
              db.all(`
                SELECT id, question_text, option_a, option_b, option_c, option_d 
                FROM question_bank 
                WHERE set_id = ? 
                ORDER BY question_number
              `, [setId], (err, questions) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to load questions' });
                }
                
                if (questions.length !== 30) {
                  return res.status(500).json({ 
                    error: `Invalid question set. Expected 30 questions, found ${questions.length}` 
                  });
                }

                // Store all questions in session_questions (to track which set was used)
                let completed = 0;
                questions.forEach((q, index) => {
                  db.run(
                    'INSERT INTO session_questions (session_id, question_id, question_order) VALUES (?, ?, ?)',
                    [sessionId, q.id, index + 1],
                    (err) => {
                      completed++;
                      if (completed === questions.length) {
                        // Add marks to each question
                        const questionsWithMarks = questions.map(q => ({
                          ...q,
                          marks: trade.marks_per_question
                        }));

                        res.json({ 
                          success: true, 
                          sessionId: sessionId,
                          setId: setId,
                          questions: questionsWithMarks
                        });
                      }
                    }
                  );
                });
              });
            }
          );
        });
      });
  });
});

// Submit answer
app.post('/api/student/submit-answer', (req, res) => {
  const { session_id, question_id, selected_answer } = req.body;
  
  db.run(
    'INSERT OR REPLACE INTO answers (session_id, question_id, selected_answer) VALUES (?, ?, ?)',
    [session_id, question_id, selected_answer],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save answer' });
      }
      res.json({ success: true });
    }
  );
});

// Log proctoring violation
app.post('/api/student/proctoring-violation', (req, res) => {
  const { session_id, violation_type } = req.body;
  
  // Log the violation
  db.run(
    'INSERT INTO proctoring_logs (session_id, violation_type) VALUES (?, ?)',
    [session_id, violation_type],
    (err) => {
      if (err) {
        console.error('Failed to log violation:', err);
      }
    }
  );

  // Update warnings count
  db.run(
    'UPDATE exam_sessions SET warnings = warnings + 1 WHERE id = ?',
    [session_id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update warnings' });
      }

      // Get updated session info
      db.get('SELECT warnings FROM exam_sessions WHERE id = ?', [session_id], (err, session) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const warnings = session.warnings;
        const kicked = warnings > 3; // Changed from >= 3 to > 3 (allows 3 warnings, kicks on 4th)

        if (kicked) {
          // End the session
          db.run('UPDATE exam_sessions SET status = "kicked", end_time = datetime("now") WHERE id = ?', [session_id]);
        }

        res.json({ 
          success: true, 
          warnings: warnings,
          kicked: kicked
        });
      });
    }
  );
});

// Submit exam
app.post('/api/student/submit-exam', (req, res) => {
  const { session_id } = req.body;
  
  console.log('Submitting exam for session:', session_id);
  
  db.run(
    'UPDATE exam_sessions SET status = "completed", end_time = datetime("now") WHERE id = ?',
    [session_id],
    (err) => {
      if (err) {
        console.error('Failed to update exam session:', err);
        return res.status(500).json({ error: 'Failed to submit exam' });
      }

      // Calculate score using answers and question_bank (via question_sets)
      db.get(`
        SELECT 
          COUNT(a.id) as total_answered,
          SUM(CASE WHEN a.selected_answer = qb.correct_answer THEN t.marks_per_question ELSE 0 END) as score,
          t.questions_per_set * t.marks_per_question as total_marks
        FROM exam_sessions es
        JOIN trades t ON es.trade_id = t.id
        LEFT JOIN answers a ON es.id = a.session_id
        LEFT JOIN question_bank qb ON a.question_id = qb.id
        WHERE es.id = ?
      `, [session_id], (err, result) => {
        if (err) {
          console.error('Failed to calculate score:', err);
          return res.status(500).json({ error: 'Failed to calculate score' });
        }
        
        console.log('Score calculation result:', result);
        
        // Store result in results table
        const score = result.score || 0;
        const totalMarks = result.total_marks;
        const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

        db.run(
          'INSERT INTO results (session_id, score, total_marks, percentage) VALUES (?, ?, ?, ?)',
          [session_id, score, totalMarks, percentage],
          (err) => {
            if (err) {
              console.error('Failed to store result:', err);
              return res.status(500).json({ error: 'Failed to store result' });
            }

            console.log('Exam submitted successfully. Score:', score, 'Total:', totalMarks);
            
            res.json({ 
              success: true,
              score: score,
              total_marks: totalMarks,
              answered: result.total_answered
            });
          }
        );
      });
    }
  );
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student-home.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

app.get('/exam', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'exam.html'));
});

server.listen(PORT, () => {
  console.log(`\n===========================================`);
  console.log(`STUDENT PORTAL - Running`);
  console.log(`===========================================`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`\nSample Student Login:`);
  console.log(`Admit Card: ADM2025001`);
  console.log(`DOB: 2005-03-15`);
  console.log(`===========================================\n`);
});
