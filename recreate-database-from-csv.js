const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Delete old database
const dbPath = path.join(__dirname, 'exam_portal.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✓ Deleted old database');
}

// Create new database
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('\n=== Creating New Database Structure ===\n');

  // Create centers table
  db.run(`CREATE TABLE centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT
  )`);
  console.log('✓ Created centers table');

  // Create trades table with exam settings
  db.run(`CREATE TABLE trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    duration INTEGER DEFAULT 90,
    questions_per_exam INTEGER DEFAULT 25,
    marks_per_question INTEGER DEFAULT 4
  )`);
  console.log('✓ Created trades table');

  // Create question_bank table
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
  console.log('✓ Created question_bank table');

  // Create students table
  db.run(`CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admit_card_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    dob TEXT NOT NULL,
    center_id INTEGER NOT NULL,
    trade_id INTEGER NOT NULL,
    district TEXT,
    FOREIGN KEY (center_id) REFERENCES centers(id),
    FOREIGN KEY (trade_id) REFERENCES trades(id)
  )`);
  console.log('✓ Created students table');

  // Create exam_sessions table (no exam_id, uses trade_id)
  db.run(`CREATE TABLE exam_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    trade_id INTEGER NOT NULL,
    start_time TEXT,
    end_time TEXT,
    status TEXT DEFAULT 'active',
    warnings INTEGER DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (trade_id) REFERENCES trades(id)
  )`);
  console.log('✓ Created exam_sessions table');

  // Create session_questions table (stores random questions per session)
  db.run(`CREATE TABLE session_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    question_order INTEGER,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id),
    FOREIGN KEY (question_id) REFERENCES question_bank(id)
  )`);
  console.log('✓ Created session_questions table');

  // Create answers table
  db.run(`CREATE TABLE answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_answer TEXT,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id),
    FOREIGN KEY (question_id) REFERENCES question_bank(id),
    UNIQUE(session_id, question_id)
  )`);
  console.log('✓ Created answers table');

  // Create results table
  db.run(`CREATE TABLE results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    score REAL DEFAULT 0,
    total_marks REAL DEFAULT 0,
    percentage REAL DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id)
  )`);
  console.log('✓ Created results table');

  // Create proctoring_logs table
  db.run(`CREATE TABLE proctoring_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    violation_type TEXT NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id)
  )`);
  console.log('✓ Created proctoring_logs table');

  // Create admins table
  db.run(`CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);
  console.log('✓ Created admins table');

  console.log('\n=== Populating Centers ===\n');

  // Insert centers (5 major centers in Andhra Pradesh)
  const centers = [
    ['Visakhapatnam Skills Center', 'Visakhapatnam', 'MVP Colony, Visakhapatnam'],
    ['Vijayawada Skills Center', 'NTR Vijayawada', 'MG Road, Vijayawada'],
    ['Guntur Skills Center', 'Guntur', 'Brodipet, Guntur'],
    ['Tirupati Skills Center', 'Tirupati', 'Renigunta Road, Tirupati'],
    ['Kakinada Skills Center', 'Kakinada', 'Main Road, Kakinada']
  ];

  const centerStmt = db.prepare('INSERT INTO centers (name, district, address) VALUES (?, ?, ?)');
  centers.forEach(center => {
    centerStmt.run(center);
  });
  centerStmt.finalize();
  console.log(`✓ Inserted ${centers.length} centers`);

  console.log('\n=== Populating Trades from CSV ===\n');

  // All 48 trades from India Skills CSV file
  const trades = [
    '3D Digital Game Art',
    'Additive Manufacturing',
    'Autobody Repair',
    'Automobile Technology',
    'Autonomous Mobile Robotics',
    'Bakery',
    'Beauty Therapy',
    'Bricklaying',
    'Cabinetmaking',
    'Car Painting',
    'Carpentry',
    'Cloud Computing',
    'CNC Milling',
    'CNC Turning',
    'Concrete Construction Work',
    'Cooking',
    'Cyber Security',
    'Digital Construction',
    'Digital Interactive Media',
    'Electrical Installations',
    'Electronics',
    'Fashion Technology',
    'Floristry',
    'Graphic Design Technology',
    'Hairdressing',
    'Health and Social Care',
    'Hotel Reception',
    'Industry 4.0',
    'IT Network Systems Administration',
    'Jewellery',
    'Joinery',
    'Landscape Gardening',
    'Mechanical Engineering CAD',
    'Mechatronics',
    'Mobile Applications Development',
    'Painting and Decorating',
    'Plastering and Drywall Systems',
    'Plumbing and Heating',
    'Refrigeration and Air Conditioning',
    'Renewable Energy',
    'Restaurant Service',
    'Retail Sales',
    'Robot Systems Integration',
    'Software Application Development',
    'Software Testing',
    'Visual Merchandising',
    'Web Technologies',
    'Welding'
  ];

  const tradeStmt = db.prepare('INSERT INTO trades (name, duration, questions_per_exam, marks_per_question) VALUES (?, ?, ?, ?)');
  
  trades.forEach(trade => {
    // Set default exam parameters
    let duration = 90; // default 90 minutes
    let questions = 25; // default 25 questions
    let marks = 4; // default 4 marks per question

    // Adjust for specific trades
    if (trade.includes('Software') || trade.includes('Cloud') || trade.includes('Web')) {
      duration = 120; // 2 hours for programming trades
      questions = 30;
    }
    
    tradeStmt.run([trade, duration, questions, marks]);
  });
  
  tradeStmt.finalize();
  console.log(`✓ Inserted ${trades.length} trades from CSV`);

  console.log('\n=== Creating Admin Account ===\n');

  // Insert admin account
  db.run('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', 'admin123']);
  console.log('✓ Created admin account (admin/admin123)');

  console.log('\n=== Creating Sample Students ===\n');

  // Create 10 sample students across different trades
  const students = [
    ['TEST2025001', 'Ravi Kumar', '2000-05-15', 1, 20, 'Visakhapatnam'], // Electrical Installations
    ['TEST2025002', 'Priya Sharma', '2001-08-20', 2, 21, 'Vijayawada'], // Electronics
    ['TEST2025003', 'Arun Patel', '1999-12-10', 3, 48, 'Guntur'], // Welding
    ['TEST2025004', 'Kavita Singh', '2002-03-25', 4, 12, 'Tirupati'], // Cloud Computing
    ['TEST2025005', 'Suresh Reddy', '2000-11-30', 5, 38, 'Kakinada'], // Plumbing and Heating
    ['TEST2025006', 'Anjali Devi', '2001-02-14', 1, 44, 'Visakhapatnam'], // Software Application Development
    ['TEST2025007', 'Manoj Rao', '2000-09-08', 2, 47, 'Vijayawada'], // Web Technologies
    ['TEST2025008', 'Deepika Nair', '2002-06-22', 3, 7, 'Guntur'], // Beauty Therapy
    ['TEST2025009', 'Ramesh Babu', '1999-11-17', 4, 4, 'Tirupati'], // Automobile Technology
    ['TEST2025010', 'Lakshmi Prasad', '2001-04-30', 5, 16, 'Kakinada'] // Cooking
  ];

  const studentStmt = db.prepare('INSERT INTO students (admit_card_id, name, dob, center_id, trade_id, district) VALUES (?, ?, ?, ?, ?, ?)');
  students.forEach(student => {
    studentStmt.run(student);
  });
  studentStmt.finalize();
  console.log(`✓ Created ${students.length} test students`);

  console.log('\n===========================================');
  console.log('✅ DATABASE RECREATED SUCCESSFULLY');
  console.log('===========================================');
  console.log('\n📊 Summary:');
  console.log(`   - Centers: ${centers.length}`);
  console.log(`   - Trades: ${trades.length} (from CSV)`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Question Banks: 0 (ready for admin upload)`);
  console.log('\n💡 Next Steps:');
  console.log('   1. Restart servers');
  console.log('   2. Login to admin portal');
  console.log('   3. Upload questions for each trade');
  console.log('   4. Students can then take exams\n');
});

db.close();
