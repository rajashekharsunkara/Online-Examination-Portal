const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./exam_portal.db');

console.log('Setting up test exam and student...\n');

db.serialize(() => {
  // Create exam for Electrician trade
  db.run(`INSERT INTO exams (title, trade_id, duration, total_marks, created_at) 
          VALUES ('Electrician Theory Test - October 2025', 1, 90, 100, datetime('now'))`, 
  function(err) {
    if (err) {
      console.error('Error creating exam:', err.message);
      return;
    }
    
    const examId = this.lastID;
    console.log('✓ Created exam with ID:', examId);
    
    // Add 25 sample questions for the exam
    const questions = [
      {
        question: "What is the standard voltage for household electrical supply in India?",
        a: "110V", b: "220V", c: "440V", d: "500V",
        correct: "B", marks: 4
      },
      {
        question: "Which material is commonly used as a conductor in electrical wiring?",
        a: "Copper", b: "Plastic", c: "Wood", d: "Rubber",
        correct: "A", marks: 4
      },
      {
        question: "What does MCB stand for?",
        a: "Main Circuit Board", b: "Miniature Circuit Breaker", c: "Motor Control Board", d: "Manual Circuit Box",
        correct: "B", marks: 4
      },
      {
        question: "What is the function of a fuse in an electrical circuit?",
        a: "Increase voltage", b: "Store electricity", c: "Protect against overload", d: "Generate power",
        correct: "C", marks: 4
      },
      {
        question: "The unit of electrical resistance is:",
        a: "Volt", b: "Ampere", c: "Ohm", d: "Watt",
        correct: "C", marks: 4
      },
      {
        question: "What color wire is used for earthing in Indian electrical standards?",
        a: "Red", b: "Black", c: "Green", d: "Blue",
        correct: "C", marks: 4
      },
      {
        question: "AC stands for:",
        a: "Alternating Current", b: "Active Current", c: "Automatic Current", d: "Additional Current",
        correct: "A", marks: 4
      },
      {
        question: "What is the frequency of AC supply in India?",
        a: "25 Hz", b: "50 Hz", c: "60 Hz", d: "100 Hz",
        correct: "B", marks: 4
      },
      {
        question: "Which device converts AC to DC?",
        a: "Transformer", b: "Rectifier", c: "Inverter", d: "Generator",
        correct: "B", marks: 4
      },
      {
        question: "The SI unit of electrical power is:",
        a: "Joule", b: "Volt", c: "Watt", d: "Ampere",
        correct: "C", marks: 4
      },
      {
        question: "Ohm's law states that V = I × R. What does I represent?",
        a: "Current", b: "Intensity", c: "Impedance", d: "Induction",
        correct: "A", marks: 4
      },
      {
        question: "What type of transformer is used to step down voltage?",
        a: "Step-up transformer", b: "Step-down transformer", c: "Isolation transformer", d: "Auto transformer",
        correct: "B", marks: 4
      },
      {
        question: "The earth wire in a three-pin plug is connected to:",
        a: "Live terminal", b: "Neutral terminal", c: "Metal body of appliance", d: "Fuse",
        correct: "C", marks: 4
      },
      {
        question: "Which instrument is used to measure electrical current?",
        a: "Voltmeter", b: "Ammeter", c: "Ohmmeter", d: "Wattmeter",
        correct: "B", marks: 4
      },
      {
        question: "The power factor of a purely resistive circuit is:",
        a: "0", b: "0.5", c: "1", d: "Infinity",
        correct: "C", marks: 4
      },
      {
        question: "What happens when two resistors are connected in parallel?",
        a: "Total resistance increases", b: "Total resistance decreases", c: "Current decreases", d: "Voltage increases",
        correct: "B", marks: 4
      },
      {
        question: "ELCB stands for:",
        a: "Electrical Load Circuit Breaker", b: "Earth Leakage Circuit Breaker", c: "Electronic Load Control Box", d: "Electric Line Control Board",
        correct: "B", marks: 4
      },
      {
        question: "The neutral wire in household wiring is typically colored:",
        a: "Red", b: "Black", c: "Green", d: "Blue or Black",
        correct: "D", marks: 4
      },
      {
        question: "Which law is used to determine the direction of magnetic field around a conductor?",
        a: "Ohm's Law", b: "Kirchhoff's Law", c: "Fleming's Right Hand Rule", d: "Faraday's Law",
        correct: "C", marks: 4
      },
      {
        question: "The capacity of a battery is measured in:",
        a: "Volts", b: "Watts", c: "Ampere-hours", d: "Ohms",
        correct: "C", marks: 4
      },
      {
        question: "What is the main purpose of earthing in electrical installations?",
        a: "To save electricity", b: "To prevent electric shock", c: "To increase voltage", d: "To reduce current",
        correct: "B", marks: 4
      },
      {
        question: "In a series circuit, if one bulb fails, what happens to other bulbs?",
        a: "They become brighter", b: "They also stop working", c: "They work normally", d: "They flicker",
        correct: "B", marks: 4
      },
      {
        question: "The device used to protect motors from overload is:",
        a: "Circuit breaker", b: "Thermal overload relay", c: "Fuse", d: "Contactor",
        correct: "B", marks: 4
      },
      {
        question: "What is the standard current rating for a 5 Amp socket?",
        a: "3 Amp", b: "5 Amp", c: "15 Amp", d: "20 Amp",
        correct: "B", marks: 4
      },
      {
        question: "LED stands for:",
        a: "Light Emitting Diode", b: "Low Energy Device", c: "Lateral Electric Display", d: "Light Electronic Disk",
        correct: "A", marks: 4
      }
    ];

    const stmt = db.prepare(`INSERT INTO questions 
      (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    questions.forEach((q, index) => {
      stmt.run(examId, q.question, q.a, q.b, q.c, q.d, q.correct, q.marks, (err) => {
        if (err) console.error(`Error inserting question ${index + 1}:`, err.message);
      });
    });

    stmt.finalize(() => {
      console.log(`✓ Added ${questions.length} questions to the exam\n`);
    });
  });

  // Create a test student
  db.run(`INSERT OR REPLACE INTO students 
          (admit_card_id, name, dob, center_id, trade_id, district) 
          VALUES ('TEST2025001', 'Ravi Kumar', '2000-05-15', 1, 1, 'Visakhapatnam')`,
  function(err) {
    if (err) {
      console.error('Error creating student:', err.message);
    } else {
      console.log('✓ Created test student');
      console.log('\n========================================');
      console.log('TEST STUDENT LOGIN CREDENTIALS:');
      console.log('========================================');
      console.log('Admit Card ID: TEST2025001');
      console.log('Date of Birth: 15/05/2000');
      console.log('Name: Ravi Kumar');
      console.log('Trade: Electrician');
      console.log('Center: Visakhapatnam Center');
      console.log('========================================');
      console.log('\nGo to: http://localhost:3000/student');
      console.log('========================================\n');
      
      db.close(() => {
        process.exit(0);
      });
    }
  });
});
