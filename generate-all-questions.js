const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./exam_portal.db');

// Generic question templates for different trade categories
const questionTemplates = {
    technical: [
        { q: "What is the primary function of {tool} in {trade}?", opts: ["Cutting", "Measuring", "Finishing", "Assembly"], ans: "A" },
        { q: "Which safety equipment is mandatory when working with {process}?", opts: ["Gloves", "Safety goggles", "Helmet", "All of above"], ans: "D" },
        { q: "What is the standard measurement unit for {parameter}?", opts: ["Meter", "Kilogram", "Watt", "Pascal"], ans: "A" },
        { q: "Which material is commonly used in {trade}?", opts: ["Steel", "Wood", "Plastic", "Copper"], ans: "A" },
        { q: "What does {acronym} stand for in {trade}?", opts: ["Option A", "Option B", "Option C", "Option D"], ans: "B" },
        { q: "The first step in {process} is?", opts: ["Planning", "Execution", "Testing", "Documentation"], ans: "A" },
        { q: "Which tool is used for {operation}?", opts: ["Hammer", "Saw", "Drill", "Wrench"], ans: "C" },
        { q: "What is the ideal temperature for {process}?", opts: ["25°C", "50°C", "100°C", "150°C"], ans: "B" },
        { q: "Quality control in {trade} requires checking for?", opts: ["Accuracy", "Finish", "Dimensions", "All of above"], ans: "D" },
        { q: "Which of the following is a health hazard in {trade}?", opts: ["Dust", "Noise", "Chemical fumes", "All of above"], ans: "D" }
    ],
    computer: [
        { q: "What is the primary software used in {trade}?", opts: ["MS Word", "Specialized software", "Calculator", "Browser"], ans: "B" },
        { q: "Which operating system is commonly used for {trade}?", opts: ["Windows", "Linux", "MacOS", "All of above"], ans: "D" },
        { q: "What is the shortcut key for {operation}?", opts: ["Ctrl+C", "Ctrl+S", "Ctrl+P", "Ctrl+Z"], ans: "B" },
        { q: "Which programming language is used in {trade}?", opts: ["Python", "Java", "C++", "All of above"], ans: "D" },
        { q: "What does {acronym} stand for in computing?", opts: ["Option A", "Option B", "Option C", "Option D"], ans: "A" },
        { q: "The best practice for {task} in {trade} is?", opts: ["Manual process", "Automated process", "Hybrid approach", "Outsourcing"], ans: "C" },
        { q: "What is cloud computing in {trade}?", opts: ["Remote storage", "Online processing", "Virtual machines", "All of above"], ans: "D" },
        { q: "Which database is commonly used in {trade}?", opts: ["MySQL", "MongoDB", "PostgreSQL", "All of above"], ans: "D" },
        { q: "What is the purpose of version control in {trade}?", opts: ["Track changes", "Backup", "Collaboration", "All of above"], ans: "D" },
        { q: "Security in {trade} involves?", opts: ["Authentication", "Encryption", "Access control", "All of above"], ans: "D" }
    ],
    creative: [
        { q: "What is the golden ratio in {trade}?", opts: ["1:1", "1:1.618", "2:3", "3:4"], ans: "B" },
        { q: "Which color theory applies to {trade}?", opts: ["RGB", "CMYK", "HSL", "All of above"], ans: "D" },
        { q: "What is the primary principle of {trade}?", opts: ["Balance", "Contrast", "Harmony", "All of above"], ans: "D" },
        { q: "Which software is used in {trade}?", opts: ["Photoshop", "Illustrator", "InDesign", "All of above"], ans: "D" },
        { q: "What does composition mean in {trade}?", opts: ["Arrangement", "Color", "Texture", "Size"], ans: "A" },
        { q: "The rule of thirds applies to?", opts: ["Photography", "Design", "Art", "All of above"], ans: "D" },
        { q: "What is white space in {trade}?", opts: ["Empty area", "Light color", "Paper color", "Background"], ans: "A" },
        { q: "Typography in {trade} refers to?", opts: ["Text style", "Font selection", "Text layout", "All of above"], ans: "D" },
        { q: "What is a mood board in {trade}?", opts: ["Planning tool", "Design element", "Color palette", "Inspiration collection"], ans: "D" },
        { q: "Which file format is best for {trade}?", opts: ["JPEG", "PNG", "PDF", "Depends on use"], ans: "D" }
    ],
    service: [
        { q: "What is customer service in {trade}?", opts: ["Helping clients", "Selling products", "Marketing", "All of above"], ans: "A" },
        { q: "The most important skill in {trade} is?", opts: ["Communication", "Technical skill", "Speed", "Accuracy"], ans: "A" },
        { q: "What does hygiene mean in {trade}?", opts: ["Cleanliness", "Organization", "Safety", "All of above"], ans: "D" },
        { q: "Which quality is essential in {trade}?", opts: ["Patience", "Attention to detail", "Professionalism", "All of above"], ans: "D" },
        { q: "What is the first rule of {trade}?", opts: ["Customer satisfaction", "Profit", "Speed", "Quality"], ans: "A" },
        { q: "Time management in {trade} involves?", opts: ["Scheduling", "Prioritizing", "Efficiency", "All of above"], ans: "D" },
        { q: "What is workplace ethics in {trade}?", opts: ["Professional conduct", "Honesty", "Respect", "All of above"], ans: "D" },
        { q: "Which skill improves customer experience in {trade}?", opts: ["Active listening", "Problem solving", "Empathy", "All of above"], ans: "D" },
        { q: "What is quality assurance in {trade}?", opts: ["Checking work", "Meeting standards", "Customer feedback", "All of above"], ans: "D" },
        { q: "Documentation in {trade} is important for?", opts: ["Records", "Reference", "Legal compliance", "All of above"], ans: "D" }
    ],
    manufacturing: [
        { q: "What is precision in {trade}?", opts: ["Accuracy", "Speed", "Quality", "Efficiency"], ans: "A" },
        { q: "Which measurement tool is used in {trade}?", opts: ["Caliper", "Micrometer", "Ruler", "All of above"], ans: "D" },
        { q: "What is tolerance in {trade}?", opts: ["Acceptable variation", "Maximum limit", "Minimum limit", "Standard value"], ans: "A" },
        { q: "Raw materials for {trade} include?", opts: ["Metal", "Plastic", "Wood", "Depends on product"], ans: "D" },
        { q: "What is quality control in {trade}?", opts: ["Inspection", "Testing", "Verification", "All of above"], ans: "D" },
        { q: "Machine maintenance in {trade} requires?", opts: ["Regular cleaning", "Lubrication", "Inspection", "All of above"], ans: "D" },
        { q: "What is automation in {trade}?", opts: ["Using machines", "Computer control", "Reducing labor", "All of above"], ans: "D" },
        { q: "Waste reduction in {trade} involves?", opts: ["Recycling", "Optimization", "Efficient use", "All of above"], ans: "D" },
        { q: "What is the purpose of prototyping in {trade}?", opts: ["Testing design", "Cost estimation", "Quality check", "All of above"], ans: "D" },
        { q: "Production planning in {trade} includes?", opts: ["Scheduling", "Resource allocation", "Timeline", "All of above"], ans: "D" }
    ]
};

// Map trades to categories
const tradeCategories = {
    '3D Digital Game Art': 'computer',
    'Additive Manufacturing': 'manufacturing',
    'Autobody Repair': 'technical',
    'Automobile Technology': 'technical',
    'Autonomous Mobile Robotics': 'technical',
    'Bakery': 'service',
    'Beauty Therapy': 'service',
    'Bricklaying': 'technical',
    'Cabinetmaking': 'manufacturing',
    'Car Painting': 'technical',
    'Carpentry': 'technical',
    'Cloud Computing': 'computer',
    'CNC Milling': 'manufacturing',
    'CNC Turning': 'manufacturing',
    'Concrete Construction Work': 'technical',
    'Cooking': 'service',
    'Cyber Security': 'computer',
    'Digital Construction': 'computer',
    'Digital Interactive Media': 'creative',
    'Electrical Installations': 'technical',
    'Electronics': 'technical',
    'Fashion Technology': 'creative',
    'Floristry': 'creative',
    'Graphic Design Technology': 'creative',
    'Hairdressing': 'service',
    'Health and Social Care': 'service',
    'Hotel Reception': 'service',
    'Industry 4.0': 'manufacturing',
    'IT Network Systems Administration': 'computer',
    'Jewellery': 'creative',
    'Joinery': 'technical',
    'Landscape Gardening': 'service',
    'Mechanical Engineering CAD': 'computer',
    'Mechatronics': 'technical',
    'Mobile Applications Development': 'computer',
    'Painting and Decorating': 'technical',
    'Plastering and Drywall Systems': 'technical',
    'Plumbing and Heating': 'technical',
    'Refrigeration and Air Conditioning': 'technical',
    'Renewable Energy': 'technical',
    'Restaurant Service': 'service',
    'Retail Sales': 'service',
    'Robot Systems Integration': 'technical',
    'Software Application Development': 'computer',
    'Software Testing': 'computer',
    'Visual Merchandising': 'creative',
    'Web Technologies': 'computer',
    'Welding': 'technical'
};

function generateQuestions(tradeName, count = 30) {
    const category = tradeCategories[tradeName] || 'technical';
    const templates = questionTemplates[category];
    const questions = [];
    
    for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        const question = {
            question_text: template.q
                .replace('{trade}', tradeName)
                .replace('{tool}', 'standard equipment')
                .replace('{process}', 'key operations')
                .replace('{parameter}', 'measurements')
                .replace('{acronym}', 'technical terms')
                .replace('{operation}', 'standard procedures')
                .replace('{task}', 'workflow management'),
            option_a: template.opts[0],
            option_b: template.opts[1],
            option_c: template.opts[2],
            option_d: template.opts[3],
            correct_answer: template.ans
        };
        questions.push(question);
    }
    
    return questions;
}

async function generateAndUploadQuestions() {
    console.log('========================================');
    console.log('GENERATING QUESTIONS FOR ALL TRADES');
    console.log('========================================\n');
    
    // Get all trades from database
    db.all('SELECT id, name, code FROM trades ORDER BY id', async (err, trades) => {
        if (err) {
            console.error('Error fetching trades:', err);
            db.close();
            return;
        }
        
        console.log(`Found ${trades.length} trades\n`);
        
        let processedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const trade of trades) {
            try {
                // Check if trade already has question sets
                const existing = await new Promise((resolve, reject) => {
                    db.get(
                        'SELECT COUNT(*) as count FROM question_sets WHERE trade_id = ?',
                        [trade.id],
                        (err, row) => {
                            if (err) reject(err);
                            else resolve(row.count);
                        }
                    );
                });
                
                if (existing > 0) {
                    console.log(`⚠ ${trade.name} - Already has ${existing} set(s), skipping`);
                    skippedCount++;
                    continue;
                }
                
                // Generate questions
                const questions = generateQuestions(trade.name, 30);
                
                // Create question set
                const setId = await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO question_sets (trade_id, set_name, set_number, is_active) 
                         VALUES (?, ?, 1, 1)`,
                        [trade.id, `${trade.name} Set 1`],
                        function(err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        }
                    );
                });
                
                // Insert questions
                const stmt = db.prepare(`
                    INSERT INTO question_bank 
                    (set_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_answer)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    stmt.run(setId, i + 1, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer);
                }
                
                await new Promise((resolve, reject) => {
                    stmt.finalize((err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                
                console.log(`✓ ${trade.name} - Generated 30 questions`);
                processedCount++;
                
            } catch (error) {
                console.error(`✗ ${trade.name} - Error: ${error.message}`);
                errorCount++;
            }
        }
        
        // Summary
        console.log('\n========================================');
        console.log('SUMMARY');
        console.log('========================================');
        console.log(`Total trades: ${trades.length}`);
        console.log(`Generated: ${processedCount}`);
        console.log(`Skipped (already exist): ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Total question sets: ${processedCount + skippedCount}`);
        console.log(`Total questions: ${(processedCount + skippedCount) * 30}`);
        console.log('========================================\n');
        
        db.close();
    });
}

generateAndUploadQuestions();
