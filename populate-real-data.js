const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./exam_portal.db');

console.log('\n=== Populating Real India Skills 2025 Data ===\n');

db.serialize(() => {
    // First, clear existing trades and centers (keep admin)
    db.run('DELETE FROM question_bank');
    db.run('DELETE FROM question_sets');
    db.run('DELETE FROM session_questions');
    db.run('DELETE FROM answers');
    db.run('DELETE FROM results');
    db.run('DELETE FROM proctoring_logs');
    db.run('DELETE FROM exam_sessions');
    db.run('DELETE FROM students');
    db.run('DELETE FROM trades');
    db.run('DELETE FROM centers');
    
    console.log('✓ Cleared existing data\n');

    // All 26 AP Districts
    const districts = [
        'Srikakulam',
        'Vizianagaram',
        'Parvathipuram Manyam',
        'Alluri Sitharama Raju',
        'Visakhapatnam',
        'Anakapalli',
        'Konaseema',
        'Kakinada',
        'East Godavari',
        'West Godavari',
        'Eluru',
        'Krishna',
        'NTR Vijayawada',
        'Guntur',
        'Palnadu',
        'Bapatla',
        'Prakasam',
        'Nellore',
        'Chittoor',
        'Tirupati',
        'Y.S.R. Kadapa',
        'Annamayya',
        'Nandyal',
        'Kurnool',
        'Sri Sathya Sai',
        'Ananthapuramu'
    ];

    // Create centers for each district
    const centerStmt = db.prepare('INSERT INTO centers (name, district, code, address) VALUES (?, ?, ?, ?)');
    districts.forEach((district, index) => {
        const code = district.substring(0, 3).toUpperCase() + String(index + 1).padStart(3, '0');
        centerStmt.run(
            `${district} ITI`,
            district,
            code,
            `Main Center, ${district}, Andhra Pradesh`
        );
    });
    centerStmt.finalize();
    console.log(`✓ Added ${districts.length} examination centers (one per district)\n`);

    // All 48 Trades from India Skills 2025
    const trades = [
        ['3D Digital Game Art', '3DDGA'],
        ['Additive Manufacturing', 'ADDMF'],
        ['Autobody Repair', 'AUTOR'],
        ['Automobile Technology', 'AUTOT'],
        ['Autonomous Mobile Robotics', 'AUTOMR'],
        ['Bakery', 'BAKRY'],
        ['Beauty Therapy', 'BEAUT'],
        ['Bricklaying', 'BRICK'],
        ['Cabinetmaking', 'CABIN'],
        ['Car Painting', 'CARPN'],
        ['Carpentry', 'CARPT'],
        ['Cloud Computing', 'CLOUD'],
        ['CNC Milling', 'CNCML'],
        ['CNC Turning', 'CNCTR'],
        ['Concrete Construction Work', 'CONCR'],
        ['Cooking', 'COOKN'],
        ['Cyber Security', 'CYBER'],
        ['Digital Construction', 'DIGCO'],
        ['Digital Interactive Media', 'DIGIM'],
        ['Electrical Installations', 'ELECI'],
        ['Electronics', 'ELECT'],
        ['Fashion Technology', 'FASHT'],
        ['Floristry', 'FLORL'],
        ['Graphic Design Technology', 'GRAPH'],
        ['Hairdressing', 'HAIRD'],
        ['Health and Social Care', 'HEALT'],
        ['Hotel Reception', 'HOTEL'],
        ['Industry 4.0', 'IND40'],
        ['IT Network Systems Administration', 'ITNSA'],
        ['Jewellery', 'JEWEL'],
        ['Joinery', 'JOINR'],
        ['Landscape Gardening', 'LANDS'],
        ['Mechanical Engineering CAD', 'MECAD'],
        ['Mechatronics', 'MECAT'],
        ['Mobile Applications Development', 'MOBAP'],
        ['Painting and Decorating', 'PAINT'],
        ['Plastering and Drywall Systems', 'PLAST'],
        ['Plumbing and Heating', 'PLUMB'],
        ['Refrigeration and Air Conditioning', 'REFRI'],
        ['Renewable Energy', 'RENEW'],
        ['Restaurant Service', 'RESTA'],
        ['Retail Sales', 'RETAI'],
        ['Robot Systems Integration', 'ROBOT'],
        ['Software Application Development', 'SOFTD'],
        ['Software Testing', 'SOFTT'],
        ['Visual Merchandising', 'VISME'],
        ['Web Technologies', 'WEBTE'],
        ['Welding', 'WELDI']
    ];

    const tradeStmt = db.prepare('INSERT INTO trades (name, code, duration, questions_per_set, marks_per_question) VALUES (?, ?, ?, ?, ?)');
    trades.forEach(([name, code]) => {
        // Set exam duration based on trade complexity
        let duration = 90; // Default 90 minutes
        let questionsCount = 30; // Fixed at 30 questions per set
        
        // Tech trades get more time
        if (name.includes('Software') || name.includes('Cloud') || name.includes('Web') || 
            name.includes('IT Network') || name.includes('Cyber') || name.includes('Mobile')) {
            duration = 120;
        }
        // Design/creative trades
        else if (name.includes('3D') || name.includes('Graphic') || name.includes('Fashion') || 
                 name.includes('Digital')) {
            duration = 120;
        }
        
        tradeStmt.run(name, code, duration, questionsCount, 4); // 4 marks per question, 30 questions per set
    });
    tradeStmt.finalize();
    console.log(`✓ Added ${trades.length} trades from India Skills 2025\n`);

    // Create sample students across different districts and trades
    console.log('Creating sample students...\n');
    
    // Read CSV to get registration counts
    const csv = fs.readFileSync('./India Skills District wise Registrations count-2025 (1).csv', 'utf-8');
    const lines = csv.split('\n');
    
    // Sample student names (Indian names)
    const firstNames = [
        'Ravi', 'Priya', 'Arun', 'Kavita', 'Suresh', 'Lakshmi', 'Vijay', 'Anjali',
        'Karthik', 'Divya', 'Rajesh', 'Meena', 'Sandeep', 'Pooja', 'Manoj', 'Sneha',
        'Venkat', 'Deepika', 'Naveen', 'Swathi', 'Prasad', 'Ramya', 'Srinivas', 'Vidya',
        'Kumar', 'Rani', 'Raghu', 'Sowmya', 'Mohan', 'Jyothi', 'Prakash', 'Saranya',
        'Kishore', 'Madhuri', 'Balaji', 'Haritha', 'Ganesh', 'Nithya', 'Chandra', 'Pavani',
        'Murali', 'Sujatha', 'Ashok', 'Lavanya', 'Naresh', 'Keerthi', 'Ramesh', 'Yamini'
    ];
    
    const lastNames = [
        'Kumar', 'Sharma', 'Patel', 'Singh', 'Reddy', 'Rao', 'Nair', 'Gupta',
        'Verma', 'Iyer', 'Menon', 'Prasad', 'Naidu', 'Choudhary', 'Das', 'Joshi',
        'Agarwal', 'Mehta', 'Desai', 'Chopra', 'Bose', 'Krishnan', 'Pillai', 'Varma'
    ];

    // Create students for top trades
    let studentCount = 0;
    const studentStmt = db.prepare('INSERT INTO students (admit_card_id, name, dob, center_id, trade_id, district) VALUES (?, ?, ?, ?, ?, ?)');
    
    // Get trade IDs for popular trades
    db.all('SELECT id, name FROM trades WHERE name IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        ['Cloud Computing', 'Web Technologies', 'Software Application Development', 
         'Electronics', 'Electrical Installations', 'Cooking', 'Beauty Therapy',
         'Automobile Technology', 'Fashion Technology', 'Health and Social Care'],
        (err, popularTrades) => {
            if (err) {
                console.error('Error fetching trades:', err);
                return;
            }

            // Create 5 students per district for random popular trades
            db.all('SELECT id, district FROM centers ORDER BY id', (err, centers) => {
                if (err) {
                    console.error('Error fetching centers:', err);
                    return;
                }

                centers.forEach(center => {
                    for (let i = 0; i < 5; i++) {
                        const trade = popularTrades[Math.floor(Math.random() * popularTrades.length)];
                        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                        const name = `${firstName} ${lastName}`;
                        
                        studentCount++;
                        const admitCardId = 'ADM2025' + String(studentCount).padStart(4, '0');
                        
                        // Random DOB between 1998-2005
                        const year = 1998 + Math.floor(Math.random() * 8);
                        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
                        const dob = `${year}-${month}-${day}`;
                        
                        studentStmt.run(admitCardId, name, dob, center.id, trade.id, center.district);
                    }
                });
                
                studentStmt.finalize(() => {
                    console.log(`✓ Created ${studentCount} sample students\n`);
                    
                    console.log('========================================');
                    console.log('✅ REAL DATA POPULATED SUCCESSFULLY');
                    console.log('========================================');
                    console.log(`\nSummary:`);
                    console.log(`   - ${districts.length} districts (all AP districts)`);
                    console.log(`   - ${trades.length} trades (India Skills 2025)`);
                    console.log(`   - ${studentCount} sample students`);
                    console.log(`\nLogin to admin panel:`);
                    console.log(`   URL: http://localhost:3001`);
                    console.log(`   Username: admin`);
                    console.log(`   Password: admin123`);
                    console.log('\n');
                    
                    db.close();
                });
            });
        });
});
