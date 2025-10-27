# India Skills Online Examination Portal

A center-based online examination portal for India Skills Andhra Pradesh with 48 trades across 26 districts, featuring MCQ support, separate admin and student servers, and real-time proctoring.

## Features

### Student Portal (Port 3000)
- Authentication using Admit Card ID and Date of Birth
- Trade-specific examinations (48 trades from India Skills)
- District-based center assignment (26 AP districts)
- 5-minute instruction reading period (mandatory)
- Full-screen mode enforcement
- Real-time proctoring with violation detection
- Automatic submission on time expiry
- Warning system (3 strikes = kicked out)
- Professional responsive UI with Pure.css

### Admin Portal (Port 3001)
- Separate secure admin server
- Manage examination centers across all 26 districts
- Create exams for 48 different trades
- Upload questions in JSON format
- View all student results
- Real-time proctoring alerts via Socket.io
- Comprehensive violation logs
- Live monitoring of active exam sessions
- Professional dashboard with Pure.css

### Proctoring Features
- Full-screen mode detection
- Tab switching detection
- Window switching detection
- Keyboard shortcut blocking
- 3-warning system
- Real-time alerts to admin
- Automatic exam termination after 3 violations

## Tech Stack

- **Backend**: Node.js + Express (Separate servers for Admin & Student)
- **Database**: SQLite3 (Shared database)
- **Real-time**: Socket.io (Admin server for proctoring alerts)
- **Frontend**: Pure.css + Vanilla JavaScript
- **No Build Required**: CDN-based UI library

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Start both servers:

**Option A - Using batch file (Windows):**
```bash
start-servers.bat
```

**Option B - Manual start:**
```bash
# Terminal 1 - Student Server
npm start

# Terminal 2 - Admin Server  
npm run admin
```

3. Access the portals:
- Student Portal: http://localhost:3000
- Admin Panel: http://localhost:3001

## Architecture

### Separate Servers
- **Student Server (3000)**: Handles student authentication, exam delivery, answer submission
- **Admin Server (3001)**: Manages exams, questions, results, real-time monitoring
- **Shared Database**: Both servers access same SQLite database
- **Cross-Server Communication**: Socket.io for real-time proctoring alerts

## Default Credentials

### Admin Login
- Username: `admin`
- Password: `admin123`

### Sample Student Logins

| Admit Card | DOB | Trade | District |
|------------|-----|-------|----------|
| ADM2025001 | 2005-03-15 | Cloud Computing | Visakhapatnam |
| ADM2025002 | 2005-07-22 | Electronics | Visakhapatnam |
| ADM2025003 | 2004-11-08 | Electrical Installations | Visakhapatnam |
| ADM2025004 | 2005-01-30 | Cooking | Guntur |
| ADM2025005 | 2004-09-12 | Software Application Development | Guntur |
| ADM2025006 | 2005-04-18 | Web Technologies | NTR Vijayawada |
| ADM2025007 | 2005-06-25 | Cloud Computing | NTR Vijayawada |

## Real Data from India Skills 2025

### 26 Andhra Pradesh Districts
Srikakulam, Vizianagaram, Parvathipuram Manyam, Alluri Sitharama Raju, Visakhapatnam, Anakapalli, Konaseema, Kakinada, East Godavari, West Godavari, Eluru, Krishna, NTR Vijayawada, Guntur, Palnadu, Bapatla, Prakasam, Nellore, Chittoor, Tirupati, Y.S.R. Kadapa, Annamayya, Nandyal, Kurnool, Sri Sathya Sai, Ananthapuramu

### 48 Trades
3D Digital Game Art, Additive Manufacturing, Autobody Repair, Automobile Technology, Autonomous Mobile Robotics, Bakery, Beauty Therapy, Bricklaying, Cabinetmaking, Car Painting, Carpentry, Cloud Computing, CNC Milling, CNC Turning, Concrete Construction Work, Cooking, Cyber Security, Digital Construction, Digital Interactive Media, Electrical Installations, Electronics, Fashion Technology, Floristry, Graphic Design Technology, Hairdressing, Health and Social Care, Hotel Reception, Industry 4.0, IT Network Systems Administration, Jewellery, Joinery, Landscape Gardening, Mechanical Engineering CAD, Mechatronics, Mobile Applications Development, Painting and Decorating, Plastering and Drywall Systems, Plumbing and Heating, Refrigeration and Air Conditioning, Renewable Energy, Restaurant Service, Retail Sales, Robot Systems Integration, Software Application Development, Software Testing, Visual Merchandising, Web Technologies, Welding

### Centers
- 31 examination centers across all districts
- Major districts have 2 centers (Visakhapatnam, Guntur, NTR Vijayawada, Tirupati, Kurnool)
- Other districts have 1 center each

## Uploading Questions

Questions must be uploaded in JSON format through the admin panel:

```json
[
  {
    "question_text": "What is 2+2?",
    "option_a": "3",
    "option_b": "4",
    "option_c": "5",
    "option_d": "6",
    "correct_answer": "B",
    "marks": 4
  }
]
```

## Proctoring Rules

Students will receive warnings for:
- Exiting full-screen mode
- Switching tabs
- Switching windows
- Using forbidden keyboard shortcuts (Alt+Tab, Ctrl+T, F11, etc.)

After 3 warnings, the student is automatically kicked out and the exam is submitted.

## System Workflow

1. **Student Login**: Authenticate with Admit Card ID and DOB
2. **Confirmation**: Verify details and read instructions (5 minutes)
3. **Exam Start**: Enter full-screen mode and begin examination
4. **Monitoring**: Real-time proctoring throughout the exam
5. **Submission**: Submit manually or auto-submit on time expiry
6. **Results**: View score immediately after submission

## Admin Workflow

1. **Login**: Access admin dashboard
2. **Create Exam**: Define exam for specific trade
3. **Upload Questions**: Add MCQ questions in JSON format
4. **Monitor**: Watch live proctoring alerts
5. **Review Results**: View all student results and statistics

## File Structure

```
OEP2/
├── server.js              # Express server
├── database.js            # SQLite database setup
├── package.json           # Dependencies
├── public/
│   ├── index.html        # Main landing page
│   ├── admin.html        # Admin dashboard
│   ├── student.html      # Student login & instructions
│   ├── exam.html         # Exam interface
│   ├── css/
│   │   ├── style.css     # Main styles
│   │   ├── admin.css     # Admin dashboard styles
│   │   └── exam.css      # Exam interface styles
│   └── js/
│       ├── admin.js      # Admin functionality
│       ├── student.js    # Student login & instructions
│       └── exam.js       # Exam proctoring & submission
└── exam_portal.db        # SQLite database (auto-created)
```

## Notes

- Database is auto-created on first run
- All timestamps are in local time
- Session data is stored in sessionStorage
- Proctoring violations are logged in real-time
- Admin receives instant notifications for violations

## Browser Requirements

- Modern browser with fullscreen API support
- JavaScript enabled
- Cookies/sessionStorage enabled
- Stable internet connection recommended

## Security Considerations

This is a basic implementation. For production use, consider:
- Proper password hashing (bcrypt)
- JWT-based authentication
- HTTPS enforcement
- Rate limiting
- Database encryption
- Enhanced session management
- Camera-based proctoring
- More sophisticated anti-cheating measures
