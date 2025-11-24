const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Delete old database
if (fs.existsSync('./exam_portal.db')) {
    fs.unlinkSync('./exam_portal.db');
    console.log('✓ Deleted old database\n');
}

const db = new sqlite3.Database('./exam_portal.db');

console.log('Creating India Skills 2025 Database...\n');

db.serialize(() => {
    // Create all tables
    db.run(`CREATE TABLE centers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        district TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        address TEXT
    )`);

    db.run(`CREATE TABLE trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        duration INTEGER DEFAULT 90,
        questions_per_set INTEGER DEFAULT 30,
        marks_per_question INTEGER DEFAULT 4
    )`);

    db.run(`CREATE TABLE question_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trade_id INTEGER NOT NULL,
        set_name TEXT NOT NULL,
        set_number INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (trade_id) REFERENCES trades(id),
        UNIQUE(trade_id, set_number)
    )`);

    db.run(`CREATE TABLE question_bank (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        set_id INTEGER NOT NULL,
        question_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        FOREIGN KEY (set_id) REFERENCES question_sets(id) ON DELETE CASCADE,
        UNIQUE(set_id, question_number)
    )`);

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

    db.run(`CREATE TABLE exam_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        trade_id INTEGER,
        set_id INTEGER,
        start_time DATETIME,
        end_time DATETIME,
        status TEXT DEFAULT 'active',
        warnings INTEGER DEFAULT 0,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (trade_id) REFERENCES trades(id),
        FOREIGN KEY (set_id) REFERENCES question_sets(id)
    )`);

    db.run(`CREATE TABLE session_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        question_id INTEGER,
        question_order INTEGER,
        FOREIGN KEY (session_id) REFERENCES exam_sessions(id),
        FOREIGN KEY (question_id) REFERENCES question_bank(id)
    )`);

    db.run(`CREATE TABLE answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        question_id INTEGER,
        selected_answer TEXT,
        FOREIGN KEY (session_id) REFERENCES exam_sessions(id),
        FOREIGN KEY (question_id) REFERENCES question_bank(id),
        UNIQUE(session_id, question_id)
    )`);

    db.run(`CREATE TABLE results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER UNIQUE,
        score INTEGER,
        total_marks INTEGER,
        percentage REAL,
        FOREIGN KEY (session_id) REFERENCES exam_sessions(id)
    )`);

    db.run(`CREATE TABLE proctoring_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        violation_type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES exam_sessions(id)
    )`);

    db.run(`CREATE TABLE admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`);

    console.log('✓ Created all tables\n');

    // All 48 trades from India Skills 2025
    const trades = [
        ['3D Digital Game Art', '3DDGA', 120, 30, 4],
        ['Additive Manufacturing', 'ADDMF', 90, 30, 4],
        ['Autobody Repair', 'AUTOR', 90, 30, 4],
        ['Automobile Technology', 'AUTOT', 90, 30, 4],
        ['Autonomous Mobile Robotics', 'AUTRB', 90, 30, 4],
        ['Bakery', 'BAKER', 90, 30, 4],
        ['Beauty Therapy', 'BEAUT', 90, 30, 4],
        ['Bricklaying', 'BRICK', 90, 30, 4],
        ['Cabinetmaking', 'CABIN', 90, 30, 4],
        ['Car Painting', 'CARPT', 90, 30, 4],
        ['Carpentry', 'CARPE', 90, 30, 4],
        ['Cloud Computing', 'CLOUD', 120, 30, 4],
        ['CNC Milling', 'CNCML', 90, 30, 4],
        ['CNC Turning', 'CNCTR', 90, 30, 4],
        ['Concrete Construction Work', 'CONCR', 90, 30, 4],
        ['Cooking', 'COOKI', 90, 30, 4],
        ['Cyber Security', 'CYBER', 120, 30, 4],
        ['Digital Construction', 'DIGCO', 90, 30, 4],
        ['Digital Interactive Media', 'DIGIM', 120, 30, 4],
        ['Electrical Installations', 'ELECI', 90, 30, 4],
        ['Electronics', 'ELECT', 90, 30, 4],
        ['Fashion Technology', 'FASHT', 90, 30, 4],
        ['Floristry', 'FLORI', 90, 30, 4],
        ['Graphic Design Technology', 'GRAPH', 120, 30, 4],
        ['Hairdressing', 'HAIRD', 90, 30, 4],
        ['Health and Social Care', 'HEALT', 90, 30, 4],
        ['Hotel Reception', 'HOTEL', 90, 30, 4],
        ['Industry 4.0', 'IND40', 120, 30, 4],
        ['IT Network Systems Administration', 'ITNSA', 120, 30, 4],
        ['Jewellery', 'JEWEL', 90, 30, 4],
        ['Joinery', 'JOINT', 90, 30, 4],
        ['Landscape Gardening', 'LANDS', 90, 30, 4],
        ['Mechanical Engineering CAD', 'MECAD', 120, 30, 4],
        ['Mechatronics', 'MECAT', 90, 30, 4],
        ['Mobile Applications Development', 'MOBAP', 120, 30, 4],
        ['Painting and Decorating', 'PAINT', 90, 30, 4],
        ['Plastering and Drywall Systems', 'PLAST', 90, 30, 4],
        ['Plumbing and Heating', 'PLUMB', 90, 30, 4],
        ['Refrigeration and Air Conditioning', 'REFAC', 90, 30, 4],
        ['Renewable Energy', 'RENEN', 90, 30, 4],
        ['Restaurant Service', 'RESTA', 90, 30, 4],
        ['Retail Sales', 'RETAI', 90, 30, 4],
        ['Robot Systems Integration', 'ROBOT', 90, 30, 4],
        ['Software Application Development', 'SOFTD', 120, 30, 4],
        ['Software Testing', 'SOFTT', 120, 30, 4],
        ['Visual Merchandising', 'VISUA', 90, 30, 4],
        ['Web Technologies', 'WEBTE', 120, 30, 4],
        ['Welding', 'WELDI', 90, 30, 4]
    ];

    const tradeStmt = db.prepare('INSERT INTO trades (name, code, duration, questions_per_set, marks_per_question) VALUES (?, ?, ?, ?, ?)');
    trades.forEach(t => tradeStmt.run(t));
    tradeStmt.finalize();
    console.log(`✓ Inserted ${trades.length} trades\n`);

    // All 26 districts from Andhra Pradesh
    const districts = [
        'Srikakulam', 'Vizianagaram', 'Parvathipuram Manyam', 'Alluri Sitharama Raju',
        'Visakhapatnam', 'Anakapalli', 'Konaseema', 'Kakinada', 'East Godavari',
        'West Godavari', 'Eluru', 'Krishna', 'NTR Vijayawada', 'Guntur',
        'Palnadu', 'Bapatla', 'Prakasam', 'Nellore', 'Chittoor', 'Tirupati',
        'Y.S.R. Kadapa', 'Annamayya', 'Nandyal', 'Kurnool', 'Sri Sathya Sai',
        'Ananthapuramu'
    ];

    // Create centers for each district (2-3 centers per district)
    const centers = [];
    const centerTypes = ['Skill Center', 'ITI', 'Training Hub', 'Skill Development Center', 'Polytechnic'];
    
    let globalCenterCounter = 1;
    
    districts.forEach((district, index) => {
        const numCenters = index % 2 === 0 ? 2 : 3; // Alternating 2 or 3 centers
        for (let i = 1; i <= numCenters; i++) {
            const districtCode = district.substring(0, 3).toUpperCase();
            const centerType = centerTypes[Math.floor(Math.random() * centerTypes.length)];
            centers.push([
                `${district} ${centerType} ${i}`,
                district,
                `${districtCode}${String(globalCenterCounter).padStart(3, '0')}`,
                `Center ${i}, ${district} District, Andhra Pradesh`
            ]);
            globalCenterCounter++;
        }
    });

    const centerStmt = db.prepare('INSERT INTO centers (name, district, code, address) VALUES (?, ?, ?, ?)');
    centers.forEach(c => centerStmt.run(c));
    centerStmt.finalize();
    console.log(`✓ Inserted ${centers.length} centers across ${districts.length} districts\n`);

    // Generate test students (5 students per trade for first 10 trades, distributed across districts)
    const students = [];
    const firstNames = ['Raj', 'Priya', 'Arun', 'Lakshmi', 'Kiran', 'Divya', 'Suresh', 'Anitha', 'Ravi', 'Kavya'];
    const lastNames = ['Kumar', 'Reddy', 'Rao', 'Naidu', 'Prasad', 'Sharma', 'Varma', 'Reddy', 'Krishna', 'Sai'];
    
    let studentCounter = 1;
    
    // Create 5 test students for first 10 trades only
    for (let tradeIdx = 1; tradeIdx <= 10; tradeIdx++) {
        for (let i = 0; i < 5; i++) {
            const firstName = firstNames[i % firstNames.length];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const name = `${firstName} ${lastName}`;
            
            // Distribute students across different centers
            const centerIdx = Math.floor(Math.random() * centers.length) + 1;
            const district = centers[centerIdx - 1][1];
            
            // Generate admit card ID: 2025DISTRICT001
            const districtCode = district.substring(0, 3).toUpperCase();
            const admitCardId = `2025${districtCode}${String(studentCounter).padStart(4, '0')}`;
            
            // Test DOB for easy login
            const dob = '2000-01-15';
            
            students.push([admitCardId, name, dob, centerIdx, tradeIdx, district]);
            studentCounter++;
        }
    }

    const studentStmt = db.prepare('INSERT INTO students (admit_card_id, name, dob, center_id, trade_id, district) VALUES (?, ?, ?, ?, ?, ?)');
    students.forEach(s => studentStmt.run(s));
    studentStmt.finalize();
    console.log(`✓ Inserted ${students.length} test students\n`);

    // Insert admin
    db.run(`INSERT INTO admins (username, password) VALUES ('admin', 'admin123')`, () => {
        console.log('✓ Created admin account\n');
        
        console.log('========================================');
        console.log('INDIA SKILLS 2025 DATABASE CREATED!');
        console.log('========================================\n');
        console.log(`Trades: ${trades.length}`);
        console.log(`Districts: ${districts.length}`);
        console.log(`Centers: ${centers.length}`);
        console.log(`Test Students: ${students.length}`);
        console.log('\n========================================');
        console.log('TEST CREDENTIALS');
        console.log('========================================\n');
        console.log('Admin Portal:');
        console.log('  Username: admin');
        console.log('  Password: admin123\n');
        console.log('Sample Student Logins:');
        console.log('  Admit Card: 2025SRI0001 to 2025SRI0050');
        console.log('  DOB: 2000-01-15\n');
        console.log('First 10 trades have test students:');
        trades.slice(0, 10).forEach((trade, idx) => {
            console.log(`  ${idx + 1}. ${trade[0]}`);
        });
        console.log('\n========================================\n');
        
        db.close();
    });
});
