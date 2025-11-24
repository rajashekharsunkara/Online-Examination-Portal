# India Skills 2025 - Test Database Information

## 🎓 Complete Data Overview

### Trades (48 Total)
Based on India Skills 2025 Competition:

1. 3D Digital Game Art
2. Additive Manufacturing
3. Autobody Repair
4. Automobile Technology
5. Autonomous Mobile Robotics
6. Bakery
7. Beauty Therapy
8. Bricklaying
9. Cabinetmaking
10. Car Painting
11. Carpentry
12. Cloud Computing
13. CNC Milling
14. CNC Turning
15. Concrete Construction Work
16. Cooking
17. Cyber Security
18. Digital Construction
19. Digital Interactive Media
20. Electrical Installations
21. Electronics
22. Fashion Technology
23. Floristry
24. Graphic Design Technology
25. Hairdressing
26. Health and Social Care
27. Hotel Reception
28. Industry 4.0
29. IT Network Systems Administration
30. Jewellery
31. Joinery
32. Landscape Gardening
33. Mechanical Engineering CAD
34. Mechatronics
35. Mobile Applications Development
36. Painting and Decorating
37. Plastering and Drywall Systems
38. Plumbing and Heating
39. Refrigeration and Air Conditioning
40. Renewable Energy
41. Restaurant Service
42. Retail Sales
43. Robot Systems Integration
44. Software Application Development
45. Software Testing
46. Visual Merchandising
47. Web Technologies
48. Welding

### Districts (26 Total)
All districts from Andhra Pradesh:

1. Srikakulam
2. Vizianagaram
3. Parvathipuram Manyam
4. Alluri Sitharama Raju
5. Visakhapatnam
6. Anakapalli
7. Konaseema
8. Kakinada
9. East Godavari
10. West Godavari
11. Eluru
12. Krishna
13. NTR Vijayawada
14. Guntur
15. Palnadu
16. Bapatla
17. Prakasam
18. Nellore
19. Chittoor
20. Tirupati
21. Y.S.R. Kadapa
22. Annamayya
23. Nandyal
24. Kurnool
25. Sri Sathya Sai
26. Ananthapuramu

### Centers
- 2-3 centers per district
- Total: ~65 centers
- Types: Skill Centers, ITIs, Training Hubs, Polytechnics

## 🔐 Test Credentials

### Admin Portal
**URL:** http://localhost:3001/admin.html
- **Username:** `admin`
- **Password:** `admin123`

### Student Portal
**URL:** http://localhost:3000

#### Test Students (50 students for first 10 trades)

**Common DOB for all test students:** `2000-01-15`

**Admit Card Pattern:** `2025XXX0001` to `2025XXX0050`
- Where XXX is the district code (first 3 letters of district name)

**Sample Login Credentials:**

| Admit Card ID | Name | Trade | District |
|---------------|------|-------|----------|
| 2025SRI0001 | Raj Kumar | 3D Digital Game Art | Srikakulam |
| 2025VIZ0002 | Priya Reddy | 3D Digital Game Art | Vizianagaram |
| 2025PAR0003 | Arun Rao | 3D Digital Game Art | Parvathipuram Manyam |
| 2025SRI0006 | Raj Kumar | Additive Manufacturing | Srikakulam |
| 2025VIS0007 | Priya Reddy | Additive Manufacturing | Visakhapatnam |

**Quick Test Login:**
- **Admit Card:** `2025SRI0001`
- **DOB:** `2000-01-15`

## 🚀 How to Setup

### Option 1: Full India Skills Setup
```batch
start-india-skills.bat
```
This will:
- Stop any running servers
- Delete old database
- Create fresh database with all 48 trades and 26 districts
- Create ~65 centers
- Generate 50 test students (5 per trade for first 10 trades)
- Upload existing question sets (3 trades with real questions)
- Generate questions for remaining 45 trades (auto-generated)
- Start both servers

**Result: ALL 48 trades ready with questions!**

### Option 2: Quick Setup
```batch
reinit-and-start.bat
```

## 📊 Database Statistics

- **Trades:** 48 (all India Skills 2025 competitions)
- **Districts:** 26 (all Andhra Pradesh districts)
- **Centers:** ~65 (2-3 per district)
- **Test Students:** 50 (distributed across districts)
- **Exam Duration:** 90-120 minutes (depending on trade)
- **Questions:** 30 per exam
- **Marks:** 4 per question (Total: 120 marks)

## 🎯 Testing Scenarios

### Scenario 1: Test Student Login
1. Go to http://localhost:3000
2. Enter Admit Card: `2025SRI0001`
3. Enter DOB: `2000-01-15`
4. Login and take exam

**Note:** ALL students can now take exams! All 48 trades have question sets available.

### Scenario 2: Admin Monitoring
1. Go to http://localhost:3001/admin.html
2. Login with admin/admin123
3. View all students, centers, trades
4. Monitor active exams

### Scenario 3: Multiple Students
Test with different admit card IDs from 2025SRI0001 to 2025XXX0050

## 📚 Available Question Sets

**ALL 48 TRADES NOW HAVE QUESTIONS!**

The system automatically:
1. Uploads existing high-quality question sets for:
   - Electronics (30 questions)
   - Software Application Development (60 questions - 2 sets)
   - Web Technologies (30 questions)

2. Generates questions for remaining 45 trades:
   - Each trade gets 30 MCQ questions
   - Questions are categorized by trade type (Technical, Computer, Creative, Service, Manufacturing)
   - Context-appropriate questions for each trade

**Total:** 48 question sets with 1,440 questions

All students can now take exams regardless of their assigned trade!

## 📝 Notes

- First 10 trades have test students
- **ALL 48 trades have question sets** - everyone can take exams!
- Students are randomly distributed across centers
- All students use DOB: 2000-01-15 for easy testing
- Admit card format: 2025 + District Code (3 letters) + Sequential Number (4 digits)
- 3 trades have hand-crafted questions, 45 have auto-generated contextual questions

## 🔧 Troubleshooting

### Database locked error?
```batch
kill-servers.bat
```
Then run `start-india-skills.bat` again

### Port already in use?
Kill Node processes and restart:
```batch
taskkill /F /IM node.exe
start-india-skills.bat
```

### Need to reset everything?
```batch
start-india-skills.bat
```
This automatically handles cleanup and fresh setup.
