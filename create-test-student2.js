const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./exam_portal.db');

console.log('Creating second test student...\n');

db.serialize(() => {
  // Create another test student
  db.run(`INSERT OR REPLACE INTO students 
          (admit_card_id, name, dob, center_id, trade_id, district) 
          VALUES ('TEST2025002', 'Priya Sharma', '2001-08-20', 1, 1, 'Visakhapatnam')`,
  function(err) {
    if (err) {
      console.error('Error creating student:', err.message);
    } else {
      console.log('✓ Created second test student');
      console.log('\n========================================');
      console.log('TEST STUDENT #2 LOGIN CREDENTIALS:');
      console.log('========================================');
      console.log('Admit Card ID: TEST2025002');
      console.log('Date of Birth: 20/08/2001');
      console.log('Name: Priya Sharma');
      console.log('Trade: Electrician');
      console.log('Center: Visakhapatnam Center');
      console.log('Exam: Electrician Theory Test');
      console.log('========================================');
      console.log('\nGo to: http://localhost:3000/student');
      console.log('========================================\n');
      
      db.close(() => {
        process.exit(0);
      });
    }
  });
});
