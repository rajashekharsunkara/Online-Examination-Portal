const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./exam_portal.db');

db.run(`INSERT OR REPLACE INTO students 
        (admit_card_id, name, dob, center_id, trade_id, district) 
        VALUES ('TEST2025003', 'Arun Patel', '1999-12-10', 1, 1, 'Visakhapatnam')`,
(err) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('✓ Test Student #3 Created');
    console.log('\n========================================');
    console.log('Admit Card ID: TEST2025003');
    console.log('Date of Birth: 10/12/1999');
    console.log('Name: Arun Patel');
    console.log('Trade: Electrician');
    console.log('========================================\n');
  }
  db.close();
});
