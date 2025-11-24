const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./exam_portal.db');

// Define all available question sets mapped to India Skills trade names
const questionSets = [
    // Electronics (Trade ID 21 in India Skills)
    { 
        file: 'Electronics_Set1_30Questions.json', 
        tradeName: 'Electronics', 
        setName: 'Electronics Set 1', 
        setNumber: 1 
    },
    
    // Software Application Development (Trade ID 44)
    { 
        file: 'Software_Development_Set1_30Questions.json', 
        tradeName: 'Software Application Development', 
        setName: 'Software Development Set 1', 
        setNumber: 1 
    },
    { 
        file: 'Software_Development_Set2_30Questions.json', 
        tradeName: 'Software Application Development', 
        setName: 'Software Development Set 2', 
        setNumber: 2 
    },
    
    // Web Technologies (Trade ID 47)
    { 
        file: 'Web_Technologies_Set1_30Questions.json', 
        tradeName: 'Web Technologies', 
        setName: 'Web Technologies Set 1', 
        setNumber: 1 
    }
];

async function uploadQuestionSet(setInfo) {
    return new Promise((resolve, reject) => {
        // Check if file exists
        if (!fs.existsSync(setInfo.file)) {
            console.log(`  ⚠ File not found: ${setInfo.file} - Skipping`);
            resolve();
            return;
        }

        // Get the trade ID
        db.get('SELECT id FROM trades WHERE name = ?', [setInfo.tradeName], (err, trade) => {
            if (err || !trade) {
                console.error(`  ✗ Trade not found: ${setInfo.tradeName}`);
                reject(err || new Error('Trade not found'));
                return;
            }
            
            const tradeId = trade.id;
            
            // Check if set already exists
            db.get(
                'SELECT id FROM question_sets WHERE trade_id = ? AND set_number = ?',
                [tradeId, setInfo.setNumber],
                (err, existing) => {
                    if (existing) {
                        console.log(`  ⚠ Set already exists: ${setInfo.setName} - Skipping`);
                        resolve();
                        return;
                    }
                    
                    // Read and validate questions
                    let questions;
                    try {
                        questions = JSON.parse(fs.readFileSync(setInfo.file, 'utf8'));
                    } catch (error) {
                        console.error(`  ✗ Error reading file ${setInfo.file}: ${error.message}`);
                        reject(error);
                        return;
                    }
                    
                    if (questions.length !== 30) {
                        console.error(`  ✗ Invalid question count for ${setInfo.file}: ${questions.length} (expected 30)`);
                        reject(new Error('Must have exactly 30 questions'));
                        return;
                    }
                    
                    // Insert the question set
                    db.run(
                        `INSERT INTO question_sets (trade_id, set_name, set_number, is_active) 
                         VALUES (?, ?, ?, 1)`,
                        [tradeId, setInfo.setName, setInfo.setNumber],
                        function(err) {
                            if (err) {
                                console.error(`  ✗ Error creating set: ${err.message}`);
                                reject(err);
                                return;
                            }
                            
                            const setId = this.lastID;
                            console.log(`  ✓ Created set: ${setInfo.setName} (ID: ${setId})`);
                            
                            // Insert all questions
                            const stmt = db.prepare(`
                                INSERT INTO question_bank 
                                (set_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_answer)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            `);
                            
                            let completed = 0;
                            let hasError = false;
                            
                            questions.forEach((q, index) => {
                                stmt.run(
                                    setId,
                                    index + 1,
                                    q.question_text,
                                    q.option_a,
                                    q.option_b,
                                    q.option_c,
                                    q.option_d,
                                    q.correct_answer,
                                    (err) => {
                                        if (err && !hasError) {
                                            hasError = true;
                                            console.error(`    ✗ Error inserting question ${index + 1}: ${err.message}`);
                                        }
                                        completed++;
                                    }
                                );
                            });
                            
                            stmt.finalize((err) => {
                                if (err) {
                                    console.error(`    ✗ Error finalizing: ${err.message}`);
                                    reject(err);
                                } else if (hasError) {
                                    reject(new Error('Some questions failed to insert'));
                                } else {
                                    console.log(`    ✓ Inserted ${questions.length} questions`);
                                    resolve();
                                }
                            });
                        }
                    );
                }
            );
        });
    });
}

async function uploadAllQuestionSets() {
    console.log('========================================');
    console.log('UPLOADING QUESTION SETS');
    console.log('========================================\n');
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const setInfo of questionSets) {
        try {
            console.log(`Processing: ${setInfo.tradeName} - ${setInfo.setName}`);
            await uploadQuestionSet(setInfo);
            successCount++;
            console.log('');
        } catch (error) {
            errorCount++;
            console.error(`Failed: ${setInfo.setName}\n`);
        }
    }
    
    // Verify and display summary
    db.all(`
        SELECT 
            t.name as trade_name,
            qs.set_name,
            qs.set_number,
            COUNT(qb.id) as question_count,
            qs.is_active
        FROM question_sets qs
        LEFT JOIN trades t ON qs.trade_id = t.id
        LEFT JOIN question_bank qb ON qs.id = qb.set_id
        GROUP BY qs.id
        ORDER BY t.name, qs.set_number
    `, (err, rows) => {
        if (err) {
            console.error('Error fetching summary:', err.message);
        } else {
            console.log('========================================');
            console.log('QUESTION SETS IN DATABASE');
            console.log('========================================\n');
            
            if (rows.length === 0) {
                console.log('No question sets found in database.\n');
            } else {
                let currentTrade = '';
                rows.forEach(row => {
                    if (row.trade_name !== currentTrade) {
                        if (currentTrade !== '') console.log('');
                        console.log(`${row.trade_name}:`);
                        currentTrade = row.trade_name;
                    }
                    const status = row.is_active ? '✓' : '✗';
                    console.log(`  ${status} ${row.set_name} - ${row.question_count} questions`);
                });
                console.log('');
            }
            
            console.log('========================================');
            console.log('SUMMARY');
            console.log('========================================');
            console.log(`Total sets processed: ${questionSets.length}`);
            console.log(`Successfully uploaded: ${successCount}`);
            console.log(`Failed: ${errorCount}`);
            console.log(`Total sets in DB: ${rows.length}`);
            console.log('========================================\n');
        }
        
        db.close();
    });
}

// Run the upload
uploadAllQuestionSets().catch(err => {
    console.error('Fatal error:', err);
    db.close();
    process.exit(1);
});
