const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./exam_portal.db');

// Map of trade names to trade IDs (based on populate-real-data.js)
const tradeMap = {
    'Software Application Development': 'Web Technologies',
    'Electronics': 'Electronics'
};

const sets = [
    { file: 'Web_Technologies_Set1_30Questions.json', tradeName: 'Web Technologies', setName: 'Web Technologies Set 1', setNumber: 1 },
    { file: 'Software_Development_Set1_30Questions.json', tradeName: 'Software Application Development', setName: 'Software Development Set 1', setNumber: 1 },
    { file: 'Software_Development_Set2_30Questions.json', tradeName: 'Software Application Development', setName: 'Software Development Set 2', setNumber: 2 },
    { file: 'Electronics_Set1_30Questions.json', tradeName: 'Electronics', setName: 'Electronics Set 1', setNumber: 1 }
];

async function uploadSet(setInfo) {
    return new Promise((resolve, reject) => {
        // First, get the trade ID
        db.get('SELECT id FROM trades WHERE name = ?', [setInfo.tradeName], (err, trade) => {
            if (err || !trade) {
                console.error(`Trade not found: ${setInfo.tradeName}`);
                reject(err || new Error('Trade not found'));
                return;
            }
            
            const tradeId = trade.id;
            
            // Read the questions file
            const questions = JSON.parse(fs.readFileSync(setInfo.file, 'utf8'));
            
            if (questions.length !== 30) {
                console.error(`Invalid question count for ${setInfo.file}: ${questions.length}`);
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
                        console.error(`Error inserting question set: ${err.message}`);
                        reject(err);
                        return;
                    }
                    
                    const setId = this.lastID;
                    console.log(`Created question set: ${setInfo.setName} (ID: ${setId})`);
                    
                    // Insert all 30 questions
                    const stmt = db.prepare(`
                        INSERT INTO question_bank 
                        (set_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_answer)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `);
                    
                    let insertCount = 0;
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
                                if (err) {
                                    console.error(`Error inserting question ${index + 1}: ${err.message}`);
                                } else {
                                    insertCount++;
                                }
                            }
                        );
                    });
                    
                    stmt.finalize((err) => {
                        if (err) {
                            console.error(`Error finalizing statement: ${err.message}`);
                            reject(err);
                        } else {
                            console.log(`  ✓ Inserted ${insertCount} questions`);
                            resolve();
                        }
                    });
                }
            );
        });
    });
}

async function uploadAllSets() {
    console.log('Uploading sample question sets...\n');
    
    for (const setInfo of sets) {
        try {
            await uploadSet(setInfo);
            console.log(`✓ Successfully uploaded ${setInfo.setName}\n`);
        } catch (error) {
            console.error(`✗ Failed to upload ${setInfo.setName}: ${error.message}\n`);
        }
    }
    
    // Verify the uploads
    db.all(`
        SELECT 
            qs.id,
            qs.set_name,
            t.name as trade_name,
            COUNT(qb.id) as question_count
        FROM question_sets qs
        LEFT JOIN trades t ON qs.trade_id = t.id
        LEFT JOIN question_bank qb ON qs.id = qb.set_id
        GROUP BY qs.id
        ORDER BY t.name, qs.set_number
    `, (err, rows) => {
        if (err) {
            console.error('Error verifying uploads:', err.message);
        } else {
            console.log('\n=== Question Sets Summary ===');
            rows.forEach(row => {
                console.log(`${row.trade_name} - ${row.set_name}: ${row.question_count} questions`);
            });
        }
        
        db.close();
    });
}

uploadAllSets();
