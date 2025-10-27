const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./exam_portal.db');

console.log('\n=== Populating Additional Data ===\n');

db.serialize(() => {
  
  // Add more centers from all 26 districts in the CSV
  console.log('Adding more examination centers...');
  
  const moreCenters = [
    ['Srikakulam Skills Center', 'Srikakulam', 'Main Road, Srikakulam'],
    ['Vizianagaram Skills Center', 'Vizianagaram', 'Railway Station Road, Vizianagaram'],
    ['Parvathipuram Skills Center', 'Parvathipuram Manyam', 'Parvathipuram Town'],
    ['East Godavari Skills Center', 'East Godavari', 'Rajahmundry'],
    ['West Godavari Skills Center', 'West Godavari', 'Eluru'],
    ['Krishna Skills Center', 'Krishna', 'Machilipatnam'],
    ['Prakasam Skills Center', 'Prakasam', 'Ongole'],
    ['Nellore Skills Center', 'Nellore', 'Nellore City'],
    ['Chittoor Skills Center', 'Chittoor', 'Chittoor Town'],
    ['YSR Kadapa Skills Center', 'Y.S.R. Kadapa', 'Kadapa City'],
    ['Kurnool Skills Center', 'Kurnool', 'Kurnool City'],
    ['Ananthapuramu Skills Center', 'Ananthapuramu', 'Anantapur Town'],
    ['Anakapalli Skills Center', 'Anakapalli', 'Anakapalli Town'],
    ['Alluri Sitharama Raju Skills Center', 'Alluri Sitharama Raju', 'Paderu'],
    ['Konaseema Skills Center', 'Konaseema', 'Amalapuram']
  ];

  const centerStmt = db.prepare('INSERT INTO centers (name, district, address) VALUES (?, ?, ?)');
  moreCenters.forEach(center => {
    centerStmt.run(center);
  });
  centerStmt.finalize();
  console.log(`✓ Added ${moreCenters.length} more centers`);

  // Add more students across different trades and districts
  console.log('\nAdding more students...');
  
  const moreStudents = [
    ['TEST2025011', 'Ramya Devi', '2001-07-15', 6, 1, 'Srikakulam'], // 3D Digital Game Art
    ['TEST2025012', 'Kiran Kumar', '2000-03-22', 7, 12, 'Vizianagaram'], // Cloud Computing
    ['TEST2025013', 'Sneha Reddy', '2002-01-18', 8, 21, 'East Godavari'], // Electronics
    ['TEST2025014', 'Prakash Rao', '1999-09-30', 9, 47, 'West Godavari'], // Web Technologies
    ['TEST2025015', 'Divya Sharma', '2001-11-05', 10, 16, 'Krishna'], // Cooking
    ['TEST2025016', 'Vijay Babu', '2000-06-12', 11, 4, 'Prakasam'], // Automobile Technology
    ['TEST2025017', 'Madhavi Latha', '2002-04-28', 12, 7, 'Nellore'], // Beauty Therapy
    ['TEST2025018', 'Srinivas Reddy', '2001-02-14', 13, 20, 'Chittoor'], // Electrical Installations
    ['TEST2025019', 'Lakshmi Priya', '2000-08-19', 14, 44, 'Kadapa'], // Software Application Development
    ['TEST2025020', 'Ravi Teja', '1999-12-25', 15, 48, 'Kurnool'], // Welding
    ['TEST2025021', 'Swathi Naidu', '2001-05-10', 16, 17, 'Ananthapuramu'], // Cyber Security
    ['TEST2025022', 'Mahesh Kumar', '2002-09-03', 17, 35, 'Anakapalli'], // Mobile Applications Development
    ['TEST2025023', 'Anusha Reddy', '2000-10-17', 18, 22, 'Tirupati'], // Fashion Technology
    ['TEST2025024', 'Naveen Babu', '2001-03-08', 19, 33, 'Guntur'], // Mechanical Engineering CAD
    ['TEST2025025', 'Harini Devi', '2002-07-22', 20, 26, 'Vijayawada'] // Health and Social Care
  ];

  const studentStmt = db.prepare('INSERT INTO students (admit_card_id, name, dob, center_id, trade_id, district) VALUES (?, ?, ?, ?, ?, ?)');
  moreStudents.forEach(student => {
    studentStmt.run(student);
  });
  studentStmt.finalize();
  console.log(`✓ Added ${moreStudents.length} more students`);

  // Add question banks for multiple trades
  console.log('\nPopulating question banks for trades...');

  // Cloud Computing (Trade ID 12) - 40 questions
  const cloudQuestions = [
    ['What is cloud computing?', 'Local storage', 'Internet-based computing', 'Desktop computing', 'Mobile computing', 'B'],
    ['Which company provides AWS?', 'Microsoft', 'Amazon', 'Google', 'IBM', 'B'],
    ['What does SaaS stand for?', 'Software as a Service', 'System as a Service', 'Storage as a Service', 'Security as a Service', 'A'],
    ['Which is a cloud storage service?', 'MS Word', 'Google Drive', 'Photoshop', 'Excel', 'B'],
    ['What is IaaS?', 'Infrastructure as a Service', 'Internet as a Service', 'Integration as a Service', 'Information as a Service', 'A'],
    ['What is virtualization?', 'Physical servers', 'Running multiple OS on one machine', 'Cloud storage', 'Network security', 'B'],
    ['Which is NOT a cloud provider?', 'AWS', 'Azure', 'Oracle', 'Norton', 'D'],
    ['What is PaaS?', 'Platform as a Service', 'Product as a Service', 'Protocol as a Service', 'Privacy as a Service', 'A'],
    ['Public cloud is owned by?', 'Single organization', 'Third-party provider', 'Government', 'Individual', 'B'],
    ['What is hybrid cloud?', 'Only public cloud', 'Only private cloud', 'Mix of public and private', 'No cloud', 'C'],
    ['Which protocol is used for cloud?', 'FTP', 'HTTP/HTTPS', 'SMTP', 'POP3', 'B'],
    ['What is a VM?', 'Virtual Machine', 'Variable Memory', 'Video Mode', 'Virus Manager', 'A'],
    ['What does CDN stand for?', 'Content Delivery Network', 'Cloud Data Network', 'Central Distribution Node', 'Computer Domain Name', 'A'],
    ['Which is a cloud database?', 'MySQL local', 'MongoDB Atlas', 'MS Access', 'SQLite', 'B'],
    ['What is auto-scaling?', 'Manual adjustment', 'Automatic resource adjustment', 'Fixed resources', 'No scaling', 'B'],
    ['What is a container?', 'Physical box', 'Lightweight virtualization', 'Storage device', 'Network device', 'B'],
    ['Which tool is used for containers?', 'MS Word', 'Docker', 'Excel', 'PowerPoint', 'B'],
    ['What is serverless computing?', 'No servers', 'Servers managed by provider', 'Local servers', 'Old servers', 'B'],
    ['What is cloud migration?', 'Moving to cloud', 'Leaving cloud', 'Cloud storage', 'Cloud security', 'A'],
    ['What is cloud backup?', 'Local backup', 'Data stored in cloud', 'No backup', 'Hard drive backup', 'B'],
    ['What is multi-tenancy?', 'Single user', 'Multiple users sharing resources', 'No users', 'One tenant', 'B'],
    ['What is cloud security?', 'No security', 'Protecting cloud data', 'Local security', 'Physical security', 'B'],
    ['What is load balancing?', 'Distributing traffic', 'Single server', 'No traffic', 'Blocking traffic', 'A'],
    ['What is edge computing?', 'Computing at data source', 'Central computing', 'No computing', 'Cloud only', 'A'],
    ['What is cloud orchestration?', 'Managing cloud workflows', 'Single task', 'No management', 'Local management', 'A'],
    ['What is API in cloud?', 'Application Programming Interface', 'Advanced Protocol Interface', 'Automatic Public Interface', 'Access Point Information', 'A'],
    ['What is cloud monitoring?', 'Tracking cloud resources', 'No tracking', 'Local monitoring', 'Physical monitoring', 'A'],
    ['What is disaster recovery?', 'No recovery', 'Data restoration plan', 'Delete data', 'Local backup', 'B'],
    ['What is cloud compliance?', 'Following regulations', 'No rules', 'Local compliance', 'Ignoring rules', 'A'],
    ['What is cloud elasticity?', 'Fixed resources', 'Flexible resource scaling', 'No resources', 'Limited resources', 'B'],
    ['What is cloud automation?', 'Manual processes', 'Automated cloud tasks', 'No automation', 'Local automation', 'B'],
    ['What is cloud encryption?', 'No security', 'Data protection', 'Open data', 'Local encryption', 'B'],
    ['What is cloud redundancy?', 'Single copy', 'Multiple data copies', 'No backup', 'Delete copies', 'B'],
    ['What is cloud latency?', 'Delay in data transfer', 'Fast transfer', 'No delay', 'Local transfer', 'A'],
    ['What is cloud throughput?', 'Data processing rate', 'No processing', 'Slow processing', 'Local processing', 'A'],
    ['What is cloud availability?', 'System uptime', 'System downtime', 'No system', 'Local availability', 'A'],
    ['What is cloud portability?', 'Moving between clouds', 'Fixed cloud', 'No movement', 'Local only', 'A'],
    ['What is cloud governance?', 'Managing cloud policies', 'No policies', 'Local governance', 'Ignoring policies', 'A'],
    ['What is cloud billing?', 'Free service', 'Pay-per-use pricing', 'One-time payment', 'No payment', 'B'],
    ['What is cloud optimization?', 'Improving efficiency', 'No improvement', 'Decreasing efficiency', 'Local optimization', 'A']
  ];

  const cloudStmt = db.prepare('INSERT INTO question_bank (trade_id, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)');
  cloudQuestions.forEach(q => {
    cloudStmt.run([12, ...q]);
  });
  cloudStmt.finalize();
  console.log(`✓ Cloud Computing: ${cloudQuestions.length} questions`);

  // Web Technologies (Trade ID 47) - 40 questions
  const webQuestions = [
    ['What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks Text Markup Language', 'A'],
    ['What does CSS stand for?', 'Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style System', 'Colorful Style Sheets', 'A'],
    ['Which tag is used for heading?', '<head>', '<h1>', '<title>', '<header>', 'B'],
    ['What is JavaScript?', 'Styling language', 'Programming language', 'Markup language', 'Database language', 'B'],
    ['Which is a web server?', 'MS Word', 'Apache', 'Excel', 'PowerPoint', 'B'],
    ['What is HTTP?', 'HyperText Transfer Protocol', 'High Transfer Text Protocol', 'Hyperlink Transfer Protocol', 'Home Text Transfer Protocol', 'A'],
    ['What does URL stand for?', 'Universal Resource Locator', 'Uniform Resource Locator', 'Universal Reference Link', 'Uniform Reference Link', 'B'],
    ['Which is a frontend framework?', 'Django', 'React', 'Laravel', 'Spring', 'B'],
    ['What is Bootstrap?', 'Database', 'CSS Framework', 'Programming language', 'Server', 'B'],
    ['Which is a backend language?', 'HTML', 'CSS', 'Python', 'Bootstrap', 'C'],
    ['What is DOM?', 'Document Object Model', 'Data Object Model', 'Digital Object Model', 'Domain Object Model', 'A'],
    ['What is AJAX?', 'Asynchronous JavaScript and XML', 'Advanced Java and XML', 'Asynchronous Java and XHTML', 'Advanced JavaScript and XHTML', 'A'],
    ['Which is a database?', 'React', 'MySQL', 'CSS', 'HTML', 'B'],
    ['What is REST API?', 'Representational State Transfer', 'Remote State Transfer', 'Real State Transfer', 'Rapid State Transfer', 'A'],
    ['What is JSON?', 'JavaScript Object Notation', 'Java Standard Object Notation', 'JavaScript Oriented Notation', 'Java Syntax Object Notation', 'A'],
    ['Which HTTP method retrieves data?', 'POST', 'PUT', 'GET', 'DELETE', 'C'],
    ['What is responsive design?', 'Fast website', 'Adapts to screen size', 'Colorful design', 'Fixed layout', 'B'],
    ['What is Node.js?', 'Frontend framework', 'JavaScript runtime', 'Database', 'CSS framework', 'B'],
    ['What is MongoDB?', 'SQL database', 'NoSQL database', 'Web server', 'Programming language', 'B'],
    ['What is Git?', 'Version control', 'Database', 'Web server', 'Programming language', 'A'],
    ['What is a cookie?', 'Dessert', 'Small data file', 'Image file', 'Video file', 'B'],
    ['What is session storage?', 'Permanent storage', 'Temporary browser storage', 'Database', 'Server storage', 'B'],
    ['What is localStorage?', 'Server storage', 'Browser persistent storage', 'Temporary storage', 'No storage', 'B'],
    ['What is HTTPS?', 'HTTP Secure', 'High Transfer Protocol Secure', 'Hypertext Transfer Protocol System', 'Home Transfer Protocol Secure', 'A'],
    ['What is SSL?', 'Secure Sockets Layer', 'Simple Socket Layer', 'Secure System Layer', 'Standard Socket Layer', 'A'],
    ['What is a CDN?', 'Content Delivery Network', 'Central Data Network', 'Cloud Distribution Network', 'Computer Domain Network', 'A'],
    ['What is SEO?', 'Search Engine Optimization', 'Secure Engine Optimization', 'System Engine Optimization', 'Simple Engine Optimization', 'A'],
    ['What is a framework?', 'Complete application', 'Reusable code structure', 'Database', 'Server', 'B'],
    ['What is MVC?', 'Model View Controller', 'Multiple View Controller', 'Model Variable Controller', 'Modern View Controller', 'A'],
    ['What is webpack?', 'Database', 'Module bundler', 'Web server', 'Programming language', 'B'],
    ['What is npm?', 'Node Package Manager', 'New Package Manager', 'Node Program Manager', 'Network Package Manager', 'A'],
    ['What is a promise in JS?', 'Commitment', 'Async operation result', 'Function', 'Variable', 'B'],
    ['What is async/await?', 'Synchronous code', 'Asynchronous code syntax', 'Loop', 'Condition', 'B'],
    ['What is flexbox?', 'Database', 'CSS layout model', 'JavaScript function', 'HTML tag', 'B'],
    ['What is grid in CSS?', '2D layout system', 'Database', 'JavaScript feature', 'HTML element', 'A'],
    ['What is a SPA?', 'Single Page Application', 'Simple Page Application', 'Standard Page Application', 'Secure Page Application', 'A'],
    ['What is PWA?', 'Progressive Web App', 'Professional Web App', 'Private Web App', 'Public Web App', 'A'],
    ['What is WebSocket?', 'Full-duplex communication', 'HTTP only', 'FTP protocol', 'Email protocol', 'A'],
    ['What is CORS?', 'Cross-Origin Resource Sharing', 'Central Origin Resource Sharing', 'Cross-Object Resource Sharing', 'Computer Origin Resource Sharing', 'A'],
    ['What is minification?', 'Reducing code size', 'Increasing code size', 'Deleting code', 'Writing code', 'A']
  ];

  const webStmt = db.prepare('INSERT INTO question_bank (trade_id, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)');
  webQuestions.forEach(q => {
    webStmt.run([47, ...q]);
  });
  webStmt.finalize();
  console.log(`✓ Web Technologies: ${webQuestions.length} questions`);

  // Electrical Installations (Trade ID 20) - 30 questions
  const electricalQuestions = [
    ['What is the SI unit of electrical resistance?', 'Volt', 'Ampere', 'Ohm', 'Watt', 'C'],
    ['Which device protects against earth leakage current?', 'MCB', 'ELCB', 'Fuse', 'Switch', 'B'],
    ['What is the purpose of earthing?', 'Increase voltage', 'Prevent electric shock', 'Save electricity', 'Increase current', 'B'],
    ['The color code for neutral wire in single phase is:', 'Red', 'Black', 'Blue', 'Green', 'C'],
    ['What is the function of a circuit breaker?', 'Increase current', 'Protect against overload', 'Store electricity', 'Measure voltage', 'B'],
    ['The unit of electrical power is:', 'Volt', 'Ampere', 'Watt', 'Ohm', 'C'],
    ['Which device measures electrical current?', 'Voltmeter', 'Ammeter', 'Ohmmeter', 'Wattmeter', 'B'],
    ['The frequency of AC supply in India is:', '25 Hz', '50 Hz', '60 Hz', '100 Hz', 'B'],
    ['Which cable is used for underground wiring?', 'PVC cable', 'Rubber cable', 'Armoured cable', 'Overhead cable', 'C'],
    ['Standard voltage for domestic supply in India:', '110V', '220V', '330V', '440V', 'B'],
    ['What is a conductor?', 'Insulator', 'Material that allows current', 'Resistor', 'Capacitor', 'B'],
    ['What is an insulator?', 'Allows current', 'Blocks current', 'Stores current', 'Measures current', 'B'],
    ['Which material is best conductor?', 'Wood', 'Plastic', 'Copper', 'Rubber', 'C'],
    ['What does MCB stand for?', 'Main Circuit Board', 'Miniature Circuit Breaker', 'Maximum Current Board', 'Multiple Circuit Breaker', 'B'],
    ['What is a fuse?', 'Voltage increaser', 'Safety device', 'Current multiplier', 'Power storage', 'B'],
    ['The unit of electrical energy is:', 'Watt', 'Joule', 'Kilowatt-hour', 'Ampere', 'C'],
    ['What is AC current?', 'Alternating Current', 'Automatic Current', 'Adjusted Current', 'Active Current', 'A'],
    ['What is DC current?', 'Direct Current', 'Double Current', 'Divided Current', 'Dynamic Current', 'A'],
    ['Which wire carries current to load?', 'Neutral', 'Earth', 'Phase', 'Ground', 'C'],
    ['What is a transformer?', 'Voltage converter', 'Current generator', 'Resistance measurer', 'Power storage', 'A'],
    ['What is the color of earth wire?', 'Red', 'Black', 'Green/Yellow', 'Blue', 'C'],
    ['What is a switchboard?', 'Control panel', 'Power generator', 'Voltage reducer', 'Current multiplier', 'A'],
    ['What is conduit?', 'Protective pipe for wires', 'Power source', 'Measuring device', 'Switch type', 'A'],
    ['What is a socket?', 'Power outlet', 'Switch', 'Fuse', 'Wire', 'A'],
    ['What is a plug?', 'Connects to socket', 'Breaks circuit', 'Measures voltage', 'Stores power', 'A'],
    ['What is series circuit?', 'Single path', 'Multiple paths', 'No path', 'Closed path', 'A'],
    ['What is parallel circuit?', 'Single path', 'Multiple paths', 'No path', 'Series connection', 'B'],
    ['What is short circuit?', 'Normal flow', 'Direct unwanted connection', 'Open circuit', 'High resistance', 'B'],
    ['What is open circuit?', 'Closed loop', 'Broken path', 'Short connection', 'Normal flow', 'B'],
    ['What is load in electrical circuit?', 'Power source', 'Device using electricity', 'Wire', 'Switch', 'B']
  ];

  const electricalStmt = db.prepare('INSERT INTO question_bank (trade_id, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)');
  electricalQuestions.forEach(q => {
    electricalStmt.run([20, ...q]);
  });
  electricalStmt.finalize();
  console.log(`✓ Electrical Installations: ${electricalQuestions.length} questions`);

  console.log('\n===========================================');
  console.log('✅ DATA POPULATION COMPLETED');
  console.log('===========================================');
  console.log('\nSummary:');
  console.log(`   - Added 15 more centers`);
  console.log(`   - Added 15 more students`);
  console.log(`   - Added 110 questions across 3 trades`);
  console.log('\nTrades with questions:');
  console.log('   - Cloud Computing: 40 questions');
  console.log('   - Web Technologies: 40 questions');
  console.log('   - Electrical Installations: 30 questions\n');
});

db.close();
