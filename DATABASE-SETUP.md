# Quick Start Guide - Database Reinitialization

## Database Issues? Use These Scripts:

### Option 1: Reinitialize and Start (Recommended)
```batch
reinit-and-start.bat
```
or
```powershell
.\reinit-and-start.ps1
```
**What it does:**
- Deletes old database
- Creates fresh database with all tables
- Inserts sample centers and trades
- Starts both servers

### Option 2: Smart Setup (Interactive)
```batch
setup-and-run.bat
```
**What it does:**
- Checks if database exists
- Asks if you want to reinitialize
- Starts servers

### Option 3: Manual Steps
```batch
# 1. Delete old database
del exam_portal.db

# 2. Recreate database
node recreate-database.js

# 3. Start servers
node start-both.js
```

## Default Credentials

### Admin Portal (http://localhost:3001)
- Username: `admin`
- Password: `admin123`

### Test Students
After running `create-test-users.js`, you'll have test students with:
- Admit Card IDs in format: `2025DISTRICT001` 
- DOB: `2000-01-15`

## What Gets Created

The database includes:
- **5 Centers**: Visakhapatnam, Vijayawada, Guntur, Tirupati, Kakinada
- **5 Trades**: Electrician, Fitter, Welder, Computer Operator, Plumber
- **Admin Account**: admin/admin123

## Adding Test Data

To add test students and questions:
```batch
node create-test-users.js
node upload-sample-sets.js
```

## Troubleshooting

### Database Locked Error
- Close all running servers (Ctrl+C)
- Delete `exam_portal.db`
- Run `reinit-and-start.bat`

### Port Already in Use
- Close any process using port 3000 or 3001
- Or change ports in `student-server.js` and `admin-server.js`

### Module Not Found
```batch
npm install
```

## Server URLs

- **Student Portal**: http://localhost:3000
- **Admin Portal**: http://localhost:3001
