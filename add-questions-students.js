const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./exam_portal.db');

console.log('Adding question banks and test students...\n');

db.serialize(() => {
    // Electrician Questions (50 questions)
    const electricianQuestions = [
        ["What is the standard voltage for household electrical supply in India?", "110V", "220V", "440V", "500V", "B"],
        ["Which material is commonly used as a conductor?", "Copper", "Plastic", "Wood", "Rubber", "A"],
        ["What does MCB stand for?", "Main Circuit Board", "Miniature Circuit Breaker", "Motor Control Board", "Manual Circuit Box", "B"],
        ["What is the function of a fuse?", "Increase voltage", "Store electricity", "Protect against overload", "Generate power", "C"],
        ["The unit of electrical resistance is:", "Volt", "Ampere", "Ohm", "Watt", "C"],
        ["What color wire is used for earthing?", "Red", "Black", "Green", "Blue", "C"],
        ["AC stands for:", "Alternating Current", "Active Current", "Automatic Current", "Additional Current", "A"],
        ["Frequency of AC supply in India:", "25 Hz", "50 Hz", "60 Hz", "100 Hz", "B"],
        ["Which device converts AC to DC?", "Transformer", "Rectifier", "Inverter", "Generator", "B"],
        ["SI unit of electrical power:", "Joule", "Volt", "Watt", "Ampere", "C"],
        ["In Ohm's law V=IR, I represents:", "Current", "Intensity", "Impedance", "Induction", "A"],
        ["Earth wire connects to:", "Live terminal", "Neutral terminal", "Metal body", "Fuse", "C"],
        ["Instrument to measure current:", "Voltmeter", "Ammeter", "Ohmmeter", "Wattmeter", "B"],
        ["Power factor of resistive circuit:", "0", "0.5", "1", "Infinity", "C"],
        ["ELCB stands for:", "Electrical Load Circuit Breaker", "Earth Leakage Circuit Breaker", "Electronic Load Control", "Electric Line Control", "B"],
        ["Neutral wire color:", "Red", "Black", "Blue/Black", "Green", "C"],
        ["Battery capacity measured in:", "Volts", "Watts", "Ampere-hours", "Ohms", "C"],
        ["Purpose of earthing:", "Save electricity", "Prevent shock", "Increase voltage", "Reduce current", "B"],
        ["LED stands for:", "Light Emitting Diode", "Low Energy Device", "Lateral Electric Display", "Light Electronic Disk", "A"],
        ["Transformer function:", "Convert AC to DC", "Change voltage level", "Store energy", "Generate current", "B"],
        ["Wire gauge measured in:", "Meters", "SWG/AWG", "Kilograms", "Volts", "B"],
        ["Insulation resistance test uses:", "Multimeter", "Megger", "Ammeter", "Clamp meter", "B"],
        ["Three phase supply voltage:", "230V", "400V", "110V", "500V", "B"],
        ["Overload protection device:", "RCCB", "Thermal relay", "Capacitor", "Resistor", "B"],
        ["Electrical safety symbol color:", "Red", "Yellow", "Green", "Blue", "B"],
        ["Conductor cross-section unit:", "mm", "mm²", "cm", "meter", "B"],
        ["Short circuit causes:", "Low resistance path", "High resistance", "Open circuit", "No current", "A"],
        ["Voltage drop measured in:", "Amperes", "Volts", "Ohms", "Watts", "B"],
        ["Star connection voltage ratio:", "1:1", "1:√3", "√3:1", "1:3", "B"],
        ["Motor starter type:", "DOL", "All of these", "Star-Delta", "Auto transformer", "B"],
        ["Cable color code phase R:", "Red", "Yellow", "Blue", "Black", "A"],
        ["Electrical fire extinguisher:", "Water", "Foam", "CO2", "Sand only", "C"],
        ["Switch rating in:", "Volts", "Amperes", "Watts", "Ohms", "B"],
        ["Conduit pipe type:", "PVC", "GI", "Both A&B", "None", "C"],
        ["Energy meter measures:", "Voltage", "Current", "kWh", "Resistance", "C"],
        ["Circuit protection priority:", "Equipment", "Human life", "Property", "Wiring", "B"],
        ["Multimeter cannot measure:", "Voltage", "Current", "Frequency", "Resistance", "C"],
        ["Wattmeter measures:", "Voltage", "Current", "Power", "Energy", "C"],
        ["Electric motor converts:", "Electrical to mechanical", "Mechanical to electrical", "AC to DC", "DC to AC", "A"],
        ["Generator converts:", "Electrical to mechanical", "Mechanical to electrical", "AC to DC", "Heat to electrical", "B"],
        ["Electrical panel earthing:", "Optional", "Mandatory", "Not required", "Depends on voltage", "B"],
        ["Voltage stabilizer function:", "Increase voltage", "Maintain constant voltage", "Convert AC to DC", "Store energy", "B"],
        ["Capacitor stores:", "Current", "Voltage", "Charge", "Resistance", "C"],
        ["Inductor opposes:", "Change in current", "Change in voltage", "Resistance", "Capacitance", "A"],
        ["Electrical power formula:", "V×I", "V/I", "I/V", "V+I", "A"],
        ["Parallel circuit voltage:", "Different across components", "Same across components", "Zero", "Infinite", "B"],
        ["Series circuit current:", "Different in components", "Same in all components", "Zero", "Infinite", "B"],
        ["Electric shock severity depends on:", "Voltage only", "Current only", "Current and duration", "Resistance only", "C"],
        ["RCD trips at:", "Voltage fault", "Overload", "Earth leakage", "Short circuit", "C"],
        ["Electrical inspection done by:", "Anyone", "Licensed electrician", "Helper", "Student", "B"]
    ];

    // Fitter Questions (50 questions)
    const fitterQuestions = [
        ["Vernier caliper least count:", "0.01mm", "0.02mm", "0.1mm", "1mm", "B"],
        ["Micrometer measures:", "Large dimensions", "Small dimensions", "Angles", "Temperature", "B"],
        ["File used for:", "Cutting", "Smoothing", "Drilling", "Welding", "B"],
        ["Hacksaw blade TPI for soft metal:", "14", "18", "24", "32", "A"],
        ["Chisel angle:", "30°", "45°", "60°", "90°", "C"],
        ["Center punch angle:", "60°", "90°", "120°", "30°", "B"],
        ["Tap used for:", "External threads", "Internal threads", "Cutting", "Drilling", "B"],
        ["Die used for:", "External threads", "Internal threads", "Cutting", "Drilling", "A"],
        ["Drill bit material:", "HSS", "Copper", "Aluminum", "Plastic", "A"],
        ["Reamer used for:", "Drilling", "Finishing holes", "Threading", "Cutting", "B"],
        ["Hammer head made of:", "Mild steel", "Cast iron", "Copper", "Aluminum", "A"],
        ["File cut types:", "Single, Double", "Triple", "Quadruple", "None", "A"],
        ["Bench vice jaw material:", "Wood", "Hardened steel", "Plastic", "Rubber", "B"],
        ["Screw pitch gauge measures:", "Diameter", "Pitch of threads", "Length", "Angle", "B"],
        ["Surface plate made of:", "Wood", "Cast iron", "Plastic", "Rubber", "B"],
        ["Try square checks:", "Angles", "Right angles", "Dimensions", "Threads", "B"],
        ["Feeler gauge measures:", "Clearance", "Diameter", "Length", "Weight", "A"],
        ["Allowance is:", "Intentional difference", "Error", "Tolerance", "None", "A"],
        ["Tolerance is:", "Permissible variation", "Exact size", "Error", "Allowance", "A"],
        ["Fit types:", "Clearance, Interference", "Transition", "All of these", "None", "C"],
        ["Hardness test:", "Brinell, Rockwell", "Impact", "Tensile", "Fatigue", "A"],
        ["Mild steel carbon %:", "0.15-0.3%", "0.5-1%", "1-2%", "3-4%", "A"],
        ["Cast iron properties:", "Brittle", "Ductile", "Soft", "Elastic", "A"],
        ["Brass composition:", "Cu + Zn", "Cu + Sn", "Fe + C", "Al + Cu", "A"],
        ["Bronze composition:", "Cu + Sn", "Cu + Zn", "Fe + C", "Al + Cu", "A"],
        ["Annealing process:", "Softening", "Hardening", "Cleaning", "Coating", "A"],
        ["Tempering process:", "Toughening", "Hardening", "Softening completely", "Melting", "A"],
        ["Bearing types:", "Ball, Roller", "Plain", "All of these", "None", "C"],
        ["Key used for:", "Locking rotation", "Decoration", "Measurement", "Cutting", "A"],
        ["Spanner types:", "Open, Ring", "Box", "All of these", "None", "C"],
        ["Allen key shape:", "Hexagonal", "Square", "Round", "Triangular", "A"],
        ["Washer purpose:", "Distribute load", "Decoration", "Measurement", "Cutting", "A"],
        ["Rivet joint type:", "Permanent", "Temporary", "Movable", "Flexible", "A"],
        ["Bolt and nut joint:", "Temporary", "Permanent", "Welded", "Soldered", "A"],
        ["Coupling connects:", "Two shafts", "Pipe", "Wire", "Plate", "A"],
        ["Gear ratio formula:", "Driven/Driver", "Driver/Driven", "Driver+Driven", "Driver-Driven", "A"],
        ["Pulley advantage:", "Speed change", "Direction change", "All of these", "None", "C"],
        ["V-belt angle:", "40°", "30°", "45°", "60°", "A"],
        ["Limit gauge checks:", "Go/No-Go", "Exact size", "Weight", "Color", "A"],
        ["Datum in drawing:", "Reference point", "Dimension", "Angle", "Material", "A"],
        ["Isometric view angle:", "30°", "45°", "60°", "90°", "A"],
        ["Orthographic projection:", "1st angle, 3rd angle", "2nd angle", "4th angle", "None", "A"],
        ["Hidden lines shown as:", "Dashed", "Solid", "Dotted", "Thick", "A"],
        ["Center line shown as:", "Long dash-dot", "Solid", "Dashed", "Dotted", "A"],
        ["Scale 1:2 means:", "Half size", "Double size", "Same size", "Quarter size", "A"],
        ["Dimension line:", "Thin", "Thick", "Dashed", "Wavy", "A"],
        ["Section line angle:", "45°", "30°", "60°", "90°", "A"],
        ["Lubricant reduces:", "Friction", "Speed", "Temperature only", "Size", "A"],
        ["Rust prevention:", "Painting", "Oiling", "Galvanizing", "All of these", "D"],
        ["Safety color for danger:", "Red", "Yellow", "Green", "Blue", "A"]
    ];

    // Welder Questions (50 questions)
    const welderQuestions = [
        ["Arc welding uses:", "Heat from arc", "Gas flame", "Friction", "Pressure", "A"],
        ["Welding electrode coating:", "Flux", "Paint", "Oil", "Water", "A"],
        ["MIG welding uses:", "Inert gas", "Oxygen", "Air", "Nitrogen", "A"],
        ["TIG welding uses:", "Tungsten electrode", "Consumable electrode", "Carbon electrode", "Copper electrode", "A"],
        ["Gas welding uses:", "Oxy-acetylene", "Air", "Nitrogen", "Hydrogen only", "A"],
        ["Welding current type:", "AC or DC", "AC only", "DC only", "None", "A"],
        ["Arc length affects:", "Weld quality", "Color only", "Nothing", "Electrode only", "A"],
        ["Welding defect spatter:", "Metal droplets", "Crack", "Porosity", "Undercut", "A"],
        ["Porosity caused by:", "Gas entrapment", "High speed", "Low current", "Thick plate", "A"],
        ["Undercut is:", "Groove at weld toe", "Crack", "Porosity", "Spatter", "A"],
        ["Slag inclusion:", "Trapped slag", "Gas", "Crack", "Bend", "A"],
        ["Butt joint:", "Edge to edge", "Overlapping", "Corner", "T-shape", "A"],
        ["Lap joint:", "Overlapping", "Edge to edge", "Corner", "T-shape", "A"],
        ["T-joint:", "Perpendicular", "Parallel", "Angular", "Overlapping", "A"],
        ["Corner joint:", "Two edges at angle", "Parallel", "Overlapping", "Straight", "A"],
        ["Fillet weld shape:", "Triangular", "Square", "Round", "Rectangular", "A"],
        ["Groove weld:", "Full penetration", "Surface only", "Spot", "Seam", "A"],
        ["Welding position flat:", "1G", "2G", "3G", "4G", "A"],
        ["Horizontal position:", "2G", "1G", "3G", "4G", "A"],
        ["Vertical position:", "3G", "1G", "2G", "4G", "A"],
        ["Overhead position:", "4G", "1G", "2G", "3G", "A"],
        ["Welding helmet protects:", "Eyes from UV", "Hands", "Feet", "Ears", "A"],
        ["Welding gloves material:", "Leather", "Cotton", "Plastic", "Rubber", "A"],
        ["Electrode storage:", "Dry place", "Wet place", "Open air", "Underground", "A"],
        ["Preheating reduces:", "Cracking", "Strength", "Hardness", "Color", "A"],
        ["Post weld heat treatment:", "Stress relief", "Hardening", "Painting", "Cleaning", "A"],
        ["Weld inspection method:", "Visual, NDT", "Taste", "Smell", "Sound only", "A"],
        ["Dye penetrant test:", "Surface defects", "Internal defects", "Thickness", "Weight", "A"],
        ["Radiography test:", "Internal defects", "Surface only", "Color", "Smell", "A"],
        ["Ultrasonic test uses:", "Sound waves", "Light", "Heat", "Pressure", "A"],
        ["Magnetic particle test:", "Ferromagnetic materials", "All materials", "Plastic only", "Wood only", "A"],
        ["Welding symbol location:", "Reference line", "Random", "Title block", "Border", "A"],
        ["Arrow side symbol:", "Below line", "Above line", "Left", "Right", "A"],
        ["Other side symbol:", "Above line", "Below line", "Left", "Right", "A"],
        ["Backing strip purpose:", "Support weld root", "Decoration", "Measurement", "Cleaning", "A"],
        ["Root gap:", "Space between plates", "Weld length", "Weld width", "Electrode size", "A"],
        ["Root face:", "Un-beveled edge", "Beveled edge", "Gap", "Throat", "A"],
        ["Bevel angle:", "For groove preparation", "For measurement", "For decoration", "For cleaning", "A"],
        ["Throat thickness:", "Smallest weld section", "Largest section", "Length", "Width", "A"],
        ["Leg length:", "Fillet weld dimension", "Groove depth", "Gap", "Root", "A"],
        ["Weld reinforcement:", "Excess weld metal", "Defect", "Gap", "Crack", "A"],
        ["Tack weld:", "Temporary joint", "Permanent weld", "Defect", "Crack", "A"],
        ["Seal weld:", "Make watertight", "Open joint", "Weak joint", "Visual only", "A"],
        ["Plug weld:", "Fill hole", "Surface weld", "Edge weld", "Corner weld", "A"],
        ["Spot weld:", "Resistance welding", "Arc welding", "Gas welding", "Forge welding", "A"],
        ["Seam weld:", "Continuous spots", "Single spot", "No weld", "Crack", "A"],
        ["Brazing temperature:", "Below melting point", "Above melting point", "Room temperature", "Freezing point", "A"],
        ["Soldering temperature:", "Low temperature", "Very high temperature", "Melting temperature", "Boiling point", "A"],
        ["Flux purpose in welding:", "Clean surface", "Add strength", "Change color", "Add weight", "A"],
        ["Safety distance for arc:", "Keep away", "Touch it", "Look directly", "No precaution", "A"]
    ];

    // Computer Operator Questions (60 questions - longer exam)
    const computerQuestions = [
        ["CPU stands for:", "Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "None", "A"],
        ["RAM stands for:", "Random Access Memory", "Read Access Memory", "Run All Memory", "None", "A"],
        ["ROM is:", "Read Only Memory", "Random Output Memory", "Read Open Memory", "None", "A"],
        ["Hard disk is:", "Secondary storage", "Primary storage", "CPU part", "Input device", "A"],
        ["Mouse is:", "Input device", "Output device", "Storage", "Processing", "A"],
        ["Monitor is:", "Output device", "Input device", "Storage", "Processing", "A"],
        ["Keyboard has:", "Input keys", "Output keys", "Storage keys", "CPU keys", "A"],
        ["Printer is:", "Output device", "Input device", "Storage", "Processing", "A"],
        ["Scanner is:", "Input device", "Output device", "Storage", "Processing", "A"],
        ["USB stands for:", "Universal Serial Bus", "Unique System Bus", "United Serial Bus", "None", "A"],
        ["BIOS stands for:", "Basic Input Output System", "Binary Input Output System", "Best Input Output System", "None", "A"],
        ["OS stands for:", "Operating System", "Output System", "Optical System", "None", "A"],
        ["Windows is:", "Operating System", "Application", "Hardware", "Printer", "A"],
        ["MS Word is:", "Word processor", "Spreadsheet", "Database", "Presentation", "A"],
        ["MS Excel is:", "Spreadsheet", "Word processor", "Database", "Presentation", "A"],
        ["MS PowerPoint:", "Presentation software", "Word processor", "Spreadsheet", "Database", "A"],
        ["MS Access:", "Database", "Word processor", "Spreadsheet", "Presentation", "A"],
        ["Internet Explorer:", "Web browser", "Word processor", "Spreadsheet", "Email", "A"],
        ["Google Chrome:", "Web browser", "Operating system", "Antivirus", "Game", "A"],
        ["HTTP stands for:", "HyperText Transfer Protocol", "High Transfer Text Protocol", "Home Text Transfer Protocol", "None", "A"],
        ["WWW stands for:", "World Wide Web", "World Work Web", "World Wide Work", "None", "A"],
        ["HTML stands for:", "HyperText Markup Language", "High Text Markup Language", "Home Text Markup Language", "None", "A"],
        ["URL stands for:", "Uniform Resource Locator", "Universal Resource Locator", "Unique Resource Locator", "None", "A"],
        ["LAN stands for:", "Local Area Network", "Large Area Network", "Long Area Network", "None", "A"],
        ["WAN stands for:", "Wide Area Network", "World Area Network", "Work Area Network", "None", "A"],
        ["Email stands for:", "Electronic Mail", "Electric Mail", "Easy Mail", "None", "A"],
        ["Spam is:", "Unwanted email", "Wanted email", "Attachment", "Virus", "A"],
        ["Virus is:", "Malicious software", "Useful software", "Hardware", "Operating system", "A"],
        ["Antivirus:", "Protection software", "Harmful software", "Game", "Word processor", "A"],
        ["Firewall:", "Network security", "Hardware part", "Software game", "Printer", "A"],
        ["Shortcut Ctrl+C:", "Copy", "Cut", "Paste", "Save", "A"],
        ["Shortcut Ctrl+V:", "Paste", "Copy", "Cut", "Save", "A"],
        ["Shortcut Ctrl+X:", "Cut", "Copy", "Paste", "Save", "A"],
        ["Shortcut Ctrl+S:", "Save", "Copy", "Paste", "Cut", "A"],
        ["Shortcut Ctrl+P:", "Print", "Paste", "Copy", "Save", "A"],
        ["Shortcut Ctrl+Z:", "Undo", "Redo", "Save", "Print", "A"],
        ["Shortcut Ctrl+Y:", "Redo", "Undo", "Save", "Print", "A"],
        ["Shortcut Ctrl+A:", "Select All", "Save", "Print", "Copy", "A"],
        ["File extension .doc:", "Word document", "Excel file", "Image", "Video", "A"],
        ["File extension .xls:", "Excel file", "Word document", "Image", "Video", "A"],
        ["File extension .jpg:", "Image file", "Word document", "Excel file", "Video", "A"],
        ["File extension .mp3:", "Audio file", "Video file", "Image", "Document", "A"],
        ["File extension .mp4:", "Video file", "Audio file", "Image", "Document", "A"],
        ["File extension .pdf:", "Portable Document", "Word document", "Excel file", "Image", "A"],
        ["File extension .exe:", "Executable file", "Image", "Document", "Audio", "A"],
        ["1 GB equals:", "1024 MB", "1000 MB", "100 MB", "10 MB", "A"],
        ["1 MB equals:", "1024 KB", "1000 KB", "100 KB", "10 KB", "A"],
        ["1 KB equals:", "1024 Bytes", "1000 Bytes", "100 Bytes", "10 Bytes", "A"],
        ["Bit is:", "0 or 1", "8 bits", "1024 bytes", "Character", "A"],
        ["Byte is:", "8 bits", "1 bit", "16 bits", "32 bits", "A"],
        ["Binary system uses:", "0 and 1", "0 to 9", "A to Z", "All numbers", "A"],
        ["Decimal system:", "0 to 9", "0 and 1", "A to Z", "0 to 7", "A"],
        ["Computer language:", "Binary", "English", "Hindi", "All languages", "A"],
        ["Programming language:", "Instructions to computer", "Speaking language", "Writing language", "Reading language", "A"],
        ["Python is:", "Programming language", "Snake", "Operating system", "Hardware", "A"],
        ["Java is:", "Programming language", "Coffee", "Operating system", "Hardware", "A"],
        ["C++ is:", "Programming language", "Grade", "Operating system", "Hardware", "A"],
        ["Compiler:", "Translates code", "Runs program", "Saves file", "Prints document", "A"],
        ["Algorithm:", "Step by step solution", "Random steps", "Hardware", "Software name", "A"],
        ["Flowchart:", "Visual representation", "Text document", "Spreadsheet", "Database", "A"]
    ];

    // Plumber Questions (50 questions)
    const plumberQuestions = [
        ["PVC pipe material:", "Polyvinyl Chloride", "Poly Carbon", "Pure Vinyl Carbon", "None", "A"],
        ["GI pipe stands for:", "Galvanized Iron", "General Iron", "Good Iron", "Gray Iron", "A"],
        ["CPVC pipe used for:", "Hot water", "Cold water only", "Drainage", "Gas", "A"],
        ["Elbow fitting angle:", "90°", "45°", "30°", "60°", "A"],
        ["T-joint connects:", "Three pipes", "Two pipes", "Four pipes", "One pipe", "A"],
        ["Reducer connects:", "Different size pipes", "Same size pipes", "No pipes", "Tanks only", "A"],
        ["Union fitting:", "Easy disconnection", "Permanent joint", "Decoration", "Support", "A"],
        ["Socket fitting:", "Push fit joint", "Threaded joint", "Welded joint", "Glued joint", "A"],
        ["Nipple is:", "Short pipe piece", "Long pipe", "Fitting", "Tool", "A"],
        ["Coupler connects:", "Two pipe ends", "Three pipes", "Tank", "Tap", "A"],
        ["Ferrule used in:", "Tap connection", "Drainage", "Tank", "Support", "A"],
        ["Float valve:", "Controls water level", "Stops flow", "Increases pressure", "Decoration", "A"],
        ["Ball valve:", "Quick shut-off", "Slow control", "Measurement", "Decoration", "A"],
        ["Gate valve:", "Full bore flow", "Partial flow", "No flow", "Reverse flow", "A"],
        ["Non-return valve:", "One way flow", "Both way", "No flow", "Reverse only", "A"],
        ["Pressure reducing valve:", "Reduces pressure", "Increases pressure", "Maintains same", "Stops flow", "A"],
        ["Flush tank capacity:", "9-10 liters", "20 liters", "5 liters", "50 liters", "A"],
        ["WC means:", "Water Closet", "Water Container", "Wall Cabinet", "None", "A"],
        ["EWC stands for:", "European Water Closet", "English Water Closet", "Electric Water Closet", "None", "A"],
        ["IWC stands for:", "Indian Water Closet", "International Water Closet", "Iron Water Closet", "None", "A"],
        ["Wash basin:", "Hand washing", "Bathing", "Drinking", "Cooking", "A"],
        ["Sink used in:", "Kitchen", "Bathroom", "Bedroom", "Living room", "A"],
        ["Trap purpose:", "Prevent foul smell", "Store water", "Increase flow", "Decoration", "A"],
        ["P-trap shape:", "P-shaped", "S-shaped", "U-shaped", "L-shaped", "A"],
        ["S-trap shape:", "S-shaped", "P-shaped", "U-shaped", "L-shaped", "A"],
        ["Gully trap:", "Outdoor drainage", "Indoor drainage", "Water supply", "Gas line", "A"],
        ["Floor trap:", "Floor drainage", "Ceiling drainage", "Wall drainage", "Window drainage", "A"],
        ["Vent pipe:", "Allow air entry", "Water supply", "Drainage", "Gas supply", "A"],
        ["Soil pipe:", "WC discharge", "Wash basin", "Kitchen sink", "Rain water", "A"],
        ["Waste pipe:", "Wash basin discharge", "WC discharge", "Rain water", "Gas", "A"],
        ["Rain water pipe:", "Roof drainage", "WC discharge", "Kitchen waste", "Bathroom waste", "A"],
        ["Septic tank:", "Sewage treatment", "Water storage", "Rain water", "Gas storage", "A"],
        ["Manhole:", "Inspection chamber", "Water tank", "Pipe storage", "Tool storage", "A"],
        ["Plunger used for:", "Unclog drains", "Cut pipes", "Thread pipes", "Measure pipes", "A"],
        ["Pipe wrench:", "Grip pipes", "Cut pipes", "Measure pipes", "Join pipes", "A"],
        ["Pipe cutter:", "Cut pipes", "Join pipes", "Thread pipes", "Measure pipes", "A"],
        ["Die stock:", "Thread external", "Thread internal", "Cut pipes", "Measure pipes", "A"],
        ["Tap used for:", "Thread internal", "Thread external", "Cut pipes", "Join pipes", "A"],
        ["Blow lamp:", "Heating/soldering", "Cutting", "Measuring", "Drilling", "A"],
        ["Hacksaw:", "Cut pipes", "Join pipes", "Thread pipes", "Measure pipes", "A"],
        ["Spirit level:", "Check level", "Measure length", "Cut pipes", "Join pipes", "A"],
        ["Plumb bob:", "Check vertical", "Check horizontal", "Measure", "Cut", "A"],
        ["Pipe bending:", "Change direction", "Join pipes", "Cut pipes", "Thread pipes", "A"],
        ["Soldering:", "Join copper pipes", "Join PVC", "Cut pipes", "Thread pipes", "A"],
        ["Welding:", "Join metal pipes", "Join PVC", "Cut pipes", "Thread pipes", "A"],
        ["Pipe insulation:", "Prevent heat loss", "Decoration", "Increase flow", "Reduce pressure", "A"],
        ["Pressure test:", "Check leakage", "Check color", "Check length", "Check weight", "A"],
        ["Water hammer:", "Pressure surge", "Tool name", "Pipe type", "Fitting type", "A"],
        ["Drainage slope:", "1 in 40 to 60", "1 in 10", "1 in 100", "No slope", "A"],
        ["Safety gear:", "Gloves, goggles", "Hat only", "Shoes only", "Nothing", "A"]
    ];

    console.log('Adding question banks...\n');

    // Insert questions for each trade
    const stmt = db.prepare(`INSERT INTO question_bank 
        (trade_id, question_text, option_a, option_b, option_c, option_d, correct_answer) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`);

    electricianQuestions.forEach(q => stmt.run(1, q[0], q[1], q[2], q[3], q[4], q[5]));
    fitterQuestions.forEach(q => stmt.run(2, q[0], q[1], q[2], q[3], q[4], q[5]));
    welderQuestions.forEach(q => stmt.run(3, q[0], q[1], q[2], q[3], q[4], q[5]));
    computerQuestions.forEach(q => stmt.run(4, q[0], q[1], q[2], q[3], q[4], q[5]));
    plumberQuestions.forEach(q => stmt.run(5, q[0], q[1], q[2], q[3], q[4], q[5]));

    stmt.finalize(() => {
        console.log(`✓ Electrician: ${electricianQuestions.length} questions`);
        console.log(`✓ Fitter: ${fitterQuestions.length} questions`);
        console.log(`✓ Welder: ${welderQuestions.length} questions`);
        console.log(`✓ Computer Operator: ${computerQuestions.length} questions`);
        console.log(`✓ Plumber: ${plumberQuestions.length} questions\n`);

        // Create 5 test students (one for each trade)
        const students = [
            ['TEST2025001', 'Ravi Kumar', '2000-05-15', 1, 1, 'Visakhapatnam'],     // Electrician
            ['TEST2025002', 'Priya Sharma', '2001-08-20', 2, 2, 'Krishna'],          // Fitter
            ['TEST2025003', 'Arun Patel', '1999-12-10', 3, 3, 'Guntur'],            // Welder
            ['TEST2025004', 'Kavita Singh', '2002-03-25', 4, 4, 'Chittoor'],        // Computer Operator
            ['TEST2025005', 'Suresh Reddy', '2000-11-30', 5, 5, 'East Godavari']    // Plumber
        ];

        const studentStmt = db.prepare(`INSERT INTO students 
            (admit_card_id, name, dob, center_id, trade_id, district) 
            VALUES (?, ?, ?, ?, ?, ?)`);
        
        students.forEach(s => studentStmt.run(s));
        studentStmt.finalize(() => {
            console.log(`✓ Created ${students.length} test students\n`);
            console.log('========================================');
            console.log('TEST STUDENTS CREATED:');
            console.log('========================================');
            console.log('1. TEST2025001 | 15/05/2000 | Ravi Kumar       | Electrician');
            console.log('2. TEST2025002 | 20/08/2001 | Priya Sharma     | Fitter');
            console.log('3. TEST2025003 | 10/12/1999 | Arun Patel       | Welder');
            console.log('4. TEST2025004 | 25/03/2002 | Kavita Singh     | Computer Operator');
            console.log('5. TEST2025005 | 30/11/2000 | Suresh Reddy     | Plumber');
            console.log('========================================\n');
            console.log('Login at: http://localhost:3000/student\n');
            
            db.close();
        });
    });
});
