const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Delete old database
if (fs.existsSync('./exam_portal.db')) {
    fs.unlinkSync('./exam_portal.db');
    console.log('✓ Deleted old database\n');
}

const db = new sqlite3.Database('./exam_portal.db');

console.log('Creating new database structure...\n');

db.serialize(() => {
    // Centers table
    db.run(`CREATE TABLE centers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        district TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        address TEXT
    )`);

    // Trades table (Trade IS the exam)
    db.run(`CREATE TABLE trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        duration INTEGER DEFAULT 90,
        questions_per_exam INTEGER DEFAULT 25,
        marks_per_question INTEGER DEFAULT 4
    )`);

    // Question Bank (all questions for a trade)
    db.run(`CREATE TABLE question_bank (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trade_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        FOREIGN KEY (trade_id) REFERENCES trades(id)
    )`);

    // Students table
    db.run(`CREATE TABLE students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admit_card_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        dob TEXT NOT NULL,
        center_id INTEGER,
        trade_id INTEGER,
        district TEXT,
        FOREIGN KEY (center_id) REFERENCES centers(id),
        FOREIGN KEY (trade_id) REFERENCES trades(id)
    )`);

    // Exam sessions
    db.run(`CREATE TABLE exam_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        trade_id INTEGER,
        start_time DATETIME,
        end_time DATETIME,
        status TEXT DEFAULT 'active',
        warnings INTEGER DEFAULT 0,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (trade_id) REFERENCES trades(id)
    )`);

    // Session questions (randomized for each student)
    db.run(`CREATE TABLE session_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        question_id INTEGER,
        question_number INTEGER,
        FOREIGN KEY (session_id) REFERENCES exam_sessions(id),
        FOREIGN KEY (question_id) REFERENCES question_bank(id)
    )`);

    // Answers
    db.run(`CREATE TABLE answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        question_id INTEGER,
        answer TEXT,
        FOREIGN KEY (session_id) REFERENCES exam_sessions(id),
        FOREIGN KEY (question_id) REFERENCES question_bank(id)
    )`);

    // Results
    db.run(`CREATE TABLE results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER UNIQUE,
        student_id INTEGER,
        trade_id INTEGER,
        score INTEGER,
        total_marks INTEGER,
        answered INTEGER,
        correct INTEGER,
        wrong INTEGER,
        unanswered INTEGER,
        submitted_at DATETIME,
        FOREIGN KEY (session_id) REFERENCES exam_sessions(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (trade_id) REFERENCES trades(id)
    )`);

    // Proctoring logs
    db.run(`CREATE TABLE proctoring_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        violation_type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES exam_sessions(id)
    )`);

    // Admins
    db.run(`CREATE TABLE admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`);

    console.log('✓ Created all tables\n');

    // Insert sample centers (Andhra Pradesh districts)
    const centers = [
        ['Visakhapatnam ITI', 'Visakhapatnam', 'VSP001', 'MVP Colony, Visakhapatnam'],
        ['Vijayawada Skill Center', 'Krishna', 'VJA001', 'MG Road, Vijayawada'],
        ['Guntur Training Center', 'Guntur', 'GNT001', 'Amaravathi Road, Guntur'],
        ['Tirupati ITI', 'Chittoor', 'TPT001', 'Renigunta Road, Tirupati'],
        ['Kakinada Skill Hub', 'East Godavari', 'KKD001', 'Main Road, Kakinada']
    ];

    const centerStmt = db.prepare('INSERT INTO centers (name, district, code, address) VALUES (?, ?, ?, ?)');
    centers.forEach(c => centerStmt.run(c));
    centerStmt.finalize();
    console.log(`✓ Inserted ${centers.length} centers\n`);

    // Insert 5 trades with exam settings
    const trades = [
        ['Electrician', 'ELEC', 90, 25, 4],
        ['Fitter', 'FITT', 90, 25, 4],
        ['Welder', 'WELD', 90, 25, 4],
        ['Computer Operator', 'COMP', 120, 30, 4],
        ['Plumber', 'PLMB', 90, 25, 4]
    ];

    const tradeStmt = db.prepare('INSERT INTO trades (name, code, duration, questions_per_exam, marks_per_question) VALUES (?, ?, ?, ?, ?)');
    trades.forEach(t => tradeStmt.run(t));
    tradeStmt.finalize();
    console.log(`✓ Inserted ${trades.length} trades\n`);

    // Insert admin
    db.run(`INSERT INTO admins (username, password) VALUES ('admin', 'admin123')`, () => {
        console.log('✓ Created admin account\n');
        console.log('========================================');
        console.log('DATABASE RECREATED SUCCESSFULLY');
        console.log('========================================\n');
        db.close();
    });
});
