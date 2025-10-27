const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./exam_portal.db');

console.log('Creating 5 test users...\n');

// Delete existing test users to avoid conflicts
db.run('DELETE FROM students WHERE admit_card_id LIKE "TEST%"');

// Get trades that have question banks
db.all(`
    SELECT t.id, t.name, COUNT(qb.id) as question_count
    FROM trades t
    LEFT JOIN question_bank qb ON t.id = qb.trade_id
    GROUP BY t.id
    HAVING question_count > 0
`, [], (err, tradesWithQuestions) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log('Trades with questions:');
    tradesWithQuestions.forEach(t => console.log(`  - ${t.name}: ${t.question_count} questions`));
    console.log('\n');

    // Get some centers
    db.all('SELECT * FROM centers LIMIT 5', [], (err, centers) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            return;
        }

        // Create 5 test users
        const users = [
            {
                admit_card_id: 'TEST001',
                name: 'Rajesh Kumar',
                dob: '2000-05-15',
                trade_id: tradesWithQuestions[0].id,
                center_id: centers[0].id,
                district: centers[0].district
            },
            {
                admit_card_id: 'TEST002',
                name: 'Priya Sharma',
                dob: '2001-08-22',
                trade_id: tradesWithQuestions[1].id,
                center_id: centers[1].id,
                district: centers[1].district
            },
            {
                admit_card_id: 'TEST003',
                name: 'Amit Patel',
                dob: '1999-12-10',
                trade_id: tradesWithQuestions[2].id,
                center_id: centers[2].id,
                district: centers[2].district
            },
            {
                admit_card_id: 'TEST004',
                name: 'Sneha Reddy',
                dob: '2002-03-18',
                trade_id: tradesWithQuestions[0].id,
                center_id: centers[3].id,
                district: centers[3].district
            },
            {
                admit_card_id: 'TEST005',
                name: 'Vikram Singh',
                dob: '2000-11-25',
                trade_id: tradesWithQuestions[1].id,
                center_id: centers[4].id,
                district: centers[4].district
            }
        ];

        const insertStmt = db.prepare(`
            INSERT INTO students (admit_card_id, name, dob, trade_id, center_id, district)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        let completed = 0;
        users.forEach(user => {
            insertStmt.run(
                user.admit_card_id,
                user.name,
                user.dob,
                user.trade_id,
                user.center_id,
                user.district,
                (err) => {
                    if (err) console.error('Insert error:', err);
                    completed++;
                    if (completed === users.length) {
                        insertStmt.finalize();
                        console.log('✅ Created 5 test users\n');
                        generateCSV();
                    }
                }
            );
        });
    });
});

function generateCSV() {
    // Generate CSV
    db.all(`
        SELECT 
            s.admit_card_id,
            s.name,
            s.dob,
            t.name as trade,
            c.name as center,
            c.district
        FROM students s
        JOIN trades t ON s.trade_id = t.id
        JOIN centers c ON s.center_id = c.id
        WHERE s.admit_card_id LIKE 'TEST%'
        ORDER BY s.admit_card_id
    `, [], (err, students) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            return;
        }

        const fs = require('fs');
        const csv = [
            'Admit Card ID,Name,Date of Birth,Trade,Center,District,Password',
            ...students.map(s => `${s.admit_card_id},${s.name},${s.dob},${s.trade},"${s.center}",${s.district},${s.dob.replace(/-/g, '')}`)
        ].join('\n');

        fs.writeFileSync('TEST-USERS-CREDENTIALS.csv', csv);

        console.log('✅ Generated TEST-USERS-CREDENTIALS.csv\n');
        console.log('Test Users Created:');
        console.log('==================');
        students.forEach(s => {
            console.log(`${s.admit_card_id} - ${s.name} (${s.trade}) - Password: ${s.dob.replace(/-/g, '')}`);
        });

        db.close();
    });
}
