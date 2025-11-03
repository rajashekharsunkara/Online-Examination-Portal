const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./exam_portal.db');

console.log('\n=== Adding Questions to Popular Trades ===\n');

// Map question files to trade names
const questionMappings = [
    { file: 'Electronics_40Questions.json', trade: 'Electronics' },
    { file: 'Software_Development_40Questions.json', trade: 'Software Application Development' },
    { file: 'sample-questions-electrician.json', trade: 'Electrical Installations' }
];

let totalQuestionsAdded = 0;

db.serialize(() => {
    questionMappings.forEach(mapping => {
        // Get trade ID
        db.get('SELECT id FROM trades WHERE name = ?', [mapping.trade], (err, trade) => {
            if (err || !trade) {
                console.log(`✗ Trade "${mapping.trade}" not found`);
                return;
            }

            // Read and parse JSON file
            try {
                const fileContent = fs.readFileSync(`./${mapping.file}`, 'utf-8');
                const questions = JSON.parse(fileContent);
                
                if (!Array.isArray(questions)) {
                    console.log(`✗ Invalid format in ${mapping.file}`);
                    return;
                }

                const stmt = db.prepare('INSERT INTO question_bank (trade_id, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)');
                
                let count = 0;
                questions.forEach(q => {
                    stmt.run(
                        trade.id,
                        q.question_text || q.question,
                        q.option_a || q.options?.A || q.a,
                        q.option_b || q.options?.B || q.b,
                        q.option_c || q.options?.C || q.c,
                        q.option_d || q.options?.D || q.d,
                        q.correct_answer || q.answer
                    );
                    count++;
                });
                
                stmt.finalize(() => {
                    totalQuestionsAdded += count;
                    console.log(`✓ ${mapping.trade}: Added ${count} questions`);
                });
                
            } catch (error) {
                console.log(`✗ Error reading ${mapping.file}:`, error.message);
            }
        });
    });

    // Add sample questions for other popular trades
    setTimeout(() => {
        const sampleTrades = [
            'Cloud Computing',
            'Web Technologies',
            'Cyber Security',
            'Cooking',
            'Beauty Therapy',
            'Fashion Technology',
            'Automobile Technology'
        ];

        db.all(`SELECT id, name FROM trades WHERE name IN (${sampleTrades.map(() => '?').join(',')})`, 
            sampleTrades, (err, trades) => {
                if (err) {
                    console.error('Error fetching trades:', err);
                    return;
                }

                const stmt = db.prepare('INSERT INTO question_bank (trade_id, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)');
                
                trades.forEach(trade => {
                    // Add 30 generic questions for each trade
                    for (let i = 1; i <= 30; i++) {
                        stmt.run(
                            trade.id,
                            `Sample question ${i} for ${trade.name}. This is a placeholder question for testing purposes.`,
                            'Option A',
                            'Option B',
                            'Option C',
                            'Option D',
                            'A'
                        );
                    }
                    console.log(`✓ ${trade.name}: Added 30 sample questions`);
                    totalQuestionsAdded += 30;
                });

                stmt.finalize(() => {
                    console.log('\n========================================');
                    console.log('✅ QUESTIONS ADDED SUCCESSFULLY');
                    console.log('========================================');
                    console.log(`Total questions added: ${totalQuestionsAdded}\n`);
                    db.close();
                });
            });
    }, 1000);
});
