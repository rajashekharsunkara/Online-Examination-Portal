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
  const { duration, questions_per_exam, marks_per_question } = req.body;
  
  db.run(
    'UPDATE trades SET duration = ?, questions_per_exam = ?, marks_per_question = ? WHERE id = ?',
    [duration, questions_per_exam, marks_per_question, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update trade' });
      }
      res.json({ success: true });
    }
  );
});

// Upload questions to question bank
app.post('/api/admin/questions', (req, res) => {
  const { trade_id, questions } = req.body;
  
  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Invalid questions format' });
  }

  let completed = 0;
  let errors = [];

  questions.forEach((q, index) => {
    db.run(
      'INSERT INTO question_bank (trade_id, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [trade_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer],
      (err) => {
        completed++;
        if (err) errors.push(`Question ${index + 1}: ${err.message}`);
        
        if (completed === questions.length) {
          if (errors.length > 0) {
            res.status(500).json({ error: 'Some questions failed', details: errors });
          } else {
            res.json({ success: true, count: questions.length });
          }
        }
      }
    );
  });
});

// Get questions for a trade
app.get('/api/admin/trades/:tradeId/questions', (req, res) => {
  const { tradeId } = req.params;
  
  db.all('SELECT * FROM question_bank WHERE trade_id = ? ORDER BY id', [tradeId], (err, questions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
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
      s.admit_card_id,
      s.name as student_name,
      s.district,
      c.name as center_name,
      t.name as trade_name,
      es.start_time,
      es.end_time,
      es.status,
      es.warnings,
      r.score,
      r.total_marks,
      r.percentage
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
