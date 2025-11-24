const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3001;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Socket.io connection for real-time proctoring alerts
io.on('connection', (socket) => {
  console.log('Admin client connected:', socket.id);

  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('Admin joined monitoring room');
  });

  socket.on('disconnect', () => {
    console.log('Admin client disconnected:', socket.id);
  });
});

// Endpoint for students to send proctoring violations (cross-server)
app.post('/api/proctoring-alert', (req, res) => {
  const data = req.body;
  io.to('admin-room').emit('violation-alert', data);
  res.json({ success: true });
});

// Endpoint for exam result updates (cross-server)
app.post('/api/exam-result-update', (req, res) => {
  const data = req.body;
  console.log('Exam result update received, broadcasting to admins:', data);
  io.to('admin-room').emit('exam-result-update', data);
  res.json({ success: true });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password], (err, admin) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ success: true, admin: { id: admin.id, username: admin.username } });
  });
});

// Get all centers
app.get('/api/admin/centers', (req, res) => {
  db.all('SELECT * FROM centers ORDER BY district, name', (err, centers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(centers);
  });
});

// Get all trades
app.get('/api/admin/trades', (req, res) => {
  db.all('SELECT * FROM trades ORDER BY name', (err, trades) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(trades);
  });
});

// Get all students
app.get('/api/admin/students', (req, res) => {
  db.all(`
    SELECT 
      s.*,
      c.name as center_name,
      t.name as trade_name,
      (SELECT status FROM exam_sessions WHERE student_id = s.id ORDER BY start_time DESC LIMIT 1) as exam_status
    FROM students s
    JOIN centers c ON s.center_id = c.id
    JOIN trades t ON s.trade_id = t.id
    ORDER BY s.admit_card_id
  `, (err, students) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(students);
  });
});

// Update trade settings
app.put('/api/admin/trades/:id', (req, res) => {
  const { id } = req.params;
  const { duration, questions_per_set, marks_per_question } = req.body;
  
  db.run(
    'UPDATE trades SET duration = ?, questions_per_set = ?, marks_per_question = ? WHERE id = ?',
    [duration, questions_per_set, marks_per_question, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update trade' });
      }
      res.json({ success: true });
    }
  );
});

// Get all question sets for a trade
app.get('/api/admin/trades/:tradeId/sets', (req, res) => {
  const { tradeId } = req.params;
  
  db.all(`
    SELECT 
      qs.*,
      COUNT(qb.id) as question_count
    FROM question_sets qs
    LEFT JOIN question_bank qb ON qs.id = qb.set_id
    WHERE qs.trade_id = ?
    GROUP BY qs.id
    ORDER BY qs.set_number
  `, [tradeId], (err, sets) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(sets);
  });
});

// Upload a new question set (30 questions)
app.post('/api/admin/question-sets', (req, res) => {
  const { trade_id, set_name, questions } = req.body;
  
  // Validate: Must have exactly 30 questions
  if (!questions || !Array.isArray(questions) || questions.length !== 30) {
    return res.status(400).json({ 
      error: 'Invalid questions format. Each set must contain exactly 30 questions.' 
    });
  }

  // Validate each question has required fields
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_answer) {
      return res.status(400).json({ 
        error: `Question ${i + 1} is missing required fields` 
      });
    }
    if (!['A', 'B', 'C', 'D'].includes(q.correct_answer.toUpperCase())) {
      return res.status(400).json({ 
        error: `Question ${i + 1} has invalid correct answer. Must be A, B, C, or D` 
      });
    }
  }

  // Get next set number for this trade
  db.get('SELECT COALESCE(MAX(set_number), 0) + 1 as next_set FROM question_sets WHERE trade_id = ?', 
    [trade_id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const setNumber = row.next_set;
      const finalSetName = set_name || `Set ${setNumber}`;

      // Insert question set
      db.run(
        'INSERT INTO question_sets (trade_id, set_name, set_number) VALUES (?, ?, ?)',
        [trade_id, finalSetName, setNumber],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create question set' });
          }

          const setId = this.lastID;
          
          // Insert all 30 questions
          const stmt = db.prepare(
            'INSERT INTO question_bank (set_id, trade_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          );

          let completed = 0;
          let errors = [];

          questions.forEach((q, index) => {
            stmt.run(
              setId,
              trade_id,
              index + 1,
              q.question_text,
              q.option_a,
              q.option_b,
              q.option_c,
              q.option_d,
              q.correct_answer.toUpperCase(),
              (err) => {
                completed++;
                if (err) errors.push(`Question ${index + 1}: ${err.message}`);
                
                if (completed === questions.length) {
                  stmt.finalize();
                  if (errors.length > 0) {
                    // Rollback - delete the set
                    db.run('DELETE FROM question_sets WHERE id = ?', [setId]);
                    res.status(500).json({ error: 'Some questions failed', details: errors });
                  } else {
                    res.json({ 
                      success: true, 
                      set_id: setId,
                      set_number: setNumber,
                      count: questions.length 
                    });
                  }
                }
              }
            );
          });
        }
      );
    });
});

// Get questions for a specific set
app.get('/api/admin/sets/:setId/questions', (req, res) => {
  const { setId } = req.params;
  
  db.all(`
    SELECT * FROM question_bank 
    WHERE set_id = ? 
    ORDER BY question_number
  `, [setId], (err, questions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(questions);
  });
});

// Delete a question set
app.delete('/api/admin/sets/:setId', (req, res) => {
  const { setId } = req.params;
  
  db.run('DELETE FROM question_sets WHERE id = ?', [setId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete question set' });
    }
    res.json({ success: true });
  });
});

// Allow student to retake exam
app.post('/api/admin/students/:studentId/retest', (req, res) => {
  const { studentId } = req.params;
  
  console.log('Allowing retest for student ID:', studentId);
  
  // Start transaction-like operations
  // 1. Get all session IDs for this student
  db.all('SELECT id FROM exam_sessions WHERE student_id = ?', [studentId], (err, sessions) => {
    if (err) {
      console.error('Error fetching sessions:', err);
      return res.status(500).json({ error: 'Failed to fetch student sessions' });
    }
    
    const sessionIds = sessions.map(s => s.id);
    
    if (sessionIds.length === 0) {
      return res.json({ success: true, message: 'No previous sessions to clear' });
    }
    
    console.log('Clearing sessions:', sessionIds);
    
    // 2. Delete all answers for these sessions
    db.run(
      `DELETE FROM answers WHERE session_id IN (${sessionIds.join(',')})`,
      (err) => {
        if (err) {
          console.error('Error deleting answers:', err);
        }
        
        // 3. Delete all results
        db.run(
          `DELETE FROM results WHERE session_id IN (${sessionIds.join(',')})`,
          (err) => {
            if (err) {
              console.error('Error deleting results:', err);
            }
            
            // 4. Delete proctoring violations
            db.run(
              'DELETE FROM proctoring_violations WHERE student_id = ?',
              [studentId],
              (err) => {
                if (err) {
                  console.error('Error deleting violations:', err);
                }
                
                // 5. Delete exam sessions
                db.run(
                  'DELETE FROM exam_sessions WHERE student_id = ?',
                  [studentId],
                  (err) => {
                    if (err) {
                      console.error('Error deleting sessions:', err);
                      return res.status(500).json({ error: 'Failed to clear exam sessions' });
                    }
                    
                    console.log('Retest allowed successfully for student:', studentId);
                    
                    res.json({ 
                      success: true,
                      message: 'Student can now retake the exam',
                      cleared_sessions: sessionIds.length
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

// Get questions for a trade (legacy - now returns all sets)
app.get('/api/admin/trades/:tradeId/questions', (req, res) => {
  const { tradeId } = req.params;
  
  db.all(`
    SELECT 
      qb.*,
      qs.set_name,
      qs.set_number
    FROM question_bank qb
    JOIN question_sets qs ON qb.set_id = qs.id
    WHERE qs.trade_id = ? 
    ORDER BY qs.set_number, qb.question_number
  `, [tradeId], (err, questions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json(questions);
  });
});

// Delete question from question bank
app.delete('/api/admin/questions/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM question_bank WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete question' });
    }
    res.json({ success: true });
  });
});

// Get all results
app.get('/api/admin/results', (req, res) => {
  db.all(`
    SELECT 
      es.id as session_id,
      s.id as student_id,
      s.admit_card_id,
      s.name as student_name,
      s.district,
      c.name as center_name,
      t.name as trade_name,
      t.name as exam_title,
      es.start_time,
      es.end_time,
      es.status,
      es.warnings,
      r.score,
      r.total_marks,
      r.percentage,
      (SELECT COUNT(*) FROM answers WHERE session_id = es.id) as answered_questions
    FROM exam_sessions es
    JOIN students s ON es.student_id = s.id
    JOIN trades t ON es.trade_id = t.id
    JOIN centers c ON s.center_id = c.id
    LEFT JOIN results r ON es.id = r.session_id
    ORDER BY es.start_time DESC
  `, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Get proctoring logs
app.get('/api/admin/proctoring-logs', (req, res) => {
  db.all(`
    SELECT 
      pl.*,
      s.admit_card_id,
      s.name as student_name,
      t.name as trade_name
    FROM proctoring_logs pl
    JOIN exam_sessions es ON pl.session_id = es.id
    JOIN students s ON es.student_id = s.id
    JOIN trades t ON es.trade_id = t.id
    ORDER BY pl.timestamp DESC
    LIMIT 100
  `, (err, logs) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(logs);
  });
});

// Get analytics data
app.get('/api/admin/analytics', (req, res) => {
  Promise.all([
    // Results distribution (Completed, Active, Kicked)
    new Promise((resolve, reject) => {
      db.all(`
        SELECT status, COUNT(*) as count
        FROM exam_sessions
        GROUP BY status
      `, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    }),
    
    // Trade-wise performance
    new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          t.name as trade_name,
          COUNT(r.id) as total_exams,
          AVG(r.percentage) as avg_percentage
        FROM trades t
        LEFT JOIN exam_sessions es ON t.id = es.trade_id AND es.status = 'completed'
        LEFT JOIN results r ON es.id = r.session_id
        GROUP BY t.id, t.name
        HAVING COUNT(r.id) > 0
        ORDER BY avg_percentage DESC
      `, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    }),
    
    // District-wise participation
    new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          s.district,
          COUNT(DISTINCT es.student_id) as student_count
        FROM students s
        LEFT JOIN exam_sessions es ON s.id = es.student_id
        WHERE es.id IS NOT NULL
        GROUP BY s.district
        ORDER BY student_count DESC
      `, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    }),
    
    // Violation types distribution
    new Promise((resolve, reject) => {
      db.all(`
        SELECT violation_type, COUNT(*) as count
        FROM proctoring_logs
        GROUP BY violation_type
        ORDER BY count DESC
      `, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    }),
    
    // Exam completion timeline (last 7 days or all data)
    new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          DATE(end_time) as date,
          COUNT(*) as count
        FROM exam_sessions
        WHERE status = 'completed' AND end_time IS NOT NULL
        GROUP BY DATE(end_time)
        ORDER BY date
      `, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    }),
    
    // Overall statistics
    new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          AVG(r.percentage) as avg_score,
          COUNT(CASE WHEN r.percentage >= 40 THEN 1 END) * 100.0 / COUNT(*) as pass_rate,
          (SELECT COUNT(*) FROM proctoring_logs) as total_violations,
          (SELECT COUNT(*) FROM exam_sessions WHERE status = 'kicked') as kicked_students
        FROM results r
      `, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    })
  ])
  .then(([statusDist, tradePerf, districtPart, violations, timeline, stats]) => {
    res.json({
      statusDistribution: statusDist,
      tradePerformance: tradePerf,
      districtParticipation: districtPart,
      violations: violations,
      completionTimeline: timeline,
      statistics: stats
    });
  })
  .catch(err => {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  });
});

// Get individual student profile with all details
app.get('/api/admin/student-profile/:studentId', (req, res) => {
  const { studentId } = req.params;
  
  Promise.all([
    // Student basic info
    new Promise((resolve, reject) => {
      db.get(`
        SELECT s.*, c.name as center_name, t.name as trade_name
        FROM students s
        JOIN centers c ON s.center_id = c.id
        JOIN trades t ON s.trade_id = t.id
        WHERE s.id = ?
      `, [studentId], (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    }),
    
    // Exam sessions
    new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          es.*,
          r.score,
          r.total_marks,
          r.percentage
        FROM exam_sessions es
        LEFT JOIN results r ON es.id = r.session_id
        WHERE es.student_id = ?
        ORDER BY es.start_time DESC
      `, [studentId], (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    }),
    
    // Proctoring violations
    new Promise((resolve, reject) => {
      db.all(`
        SELECT pl.*
        FROM proctoring_logs pl
        JOIN exam_sessions es ON pl.session_id = es.id
        WHERE es.student_id = ?
        ORDER BY pl.timestamp DESC
      `, [studentId], (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    }),
    
    // Answer details for latest exam
    new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          qb.question_text,
          qb.option_a,
          qb.option_b,
          qb.option_c,
          qb.option_d,
          qb.correct_answer,
          a.selected_answer,
          CASE 
            WHEN a.selected_answer = qb.correct_answer THEN 1 
            ELSE 0 
          END as is_correct
        FROM answers a
        JOIN question_bank qb ON a.question_id = qb.id
        WHERE a.session_id = (
          SELECT id FROM exam_sessions 
          WHERE student_id = ? 
          ORDER BY start_time DESC 
          LIMIT 1
        )
        ORDER BY a.id
      `, [studentId], (err, data) => {
        if (err) reject(err);
        else resolve(data || []);
      });
    })
  ])
  .then(([student, sessions, violations, answers]) => {
    res.json({
      student: student,
      sessions: sessions,
      violations: violations,
      answers: answers
    });
  })
  .catch(err => {
    console.error('Student profile error:', err);
    res.status(500).json({ error: 'Failed to fetch student profile' });
  });
});

// Admin: allow a student to retake the exam (clears previous session data)
app.post('/api/admin/retest', (req, res) => {
  const { student_id } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id required' });

  // Find any sessions for the student
  db.all('SELECT id FROM exam_sessions WHERE student_id = ?', [student_id], (err, sessions) => {
    if (err) {
      console.error('Retest lookup error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const sessionIds = sessions.map(s => s.id);

    db.serialize(() => {
      // Delete related answers and session_questions for those sessions
      if (sessionIds.length > 0) {
        const placeholders = sessionIds.map(() => '?').join(',');
        db.run(`DELETE FROM answers WHERE session_id IN (${placeholders})`, sessionIds, function(err) {
          if (err) console.error('Failed to delete answers for retest:', err);
        });
        db.run(`DELETE FROM session_questions WHERE session_id IN (${placeholders})`, sessionIds, function(err) {
          if (err) console.error('Failed to delete session_questions for retest:', err);
        });
        // Optionally keep results, do not delete results to preserve history
        db.run(`DELETE FROM exam_sessions WHERE id IN (${placeholders})`, sessionIds, function(err) {
          if (err) console.error('Failed to delete exam_sessions for retest:', err);
        });
      }

      // Completed: respond success
      res.json({ success: true, message: 'Retest allowed. Previous session cleared.' });
    });
  });
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

server.listen(PORT, () => {
  console.log(`\n===========================================`);
  console.log(`ADMIN PORTAL - Running`);
  console.log(`===========================================`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`\nDefault Admin Credentials:`);
  console.log(`Username: admin`);
  console.log(`Password: admin123`);
  console.log(`===========================================\n`);
});

module.exports = { io };
