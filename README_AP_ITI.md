# 🎓 Andhra Pradesh ITI Examination Portal

## Overview
Center-based online examination system for ITI students in Andhra Pradesh, India.

## ✅ System Features

### 15 ITI Trades
IoT, Blockchain, COPA, Electrician, Fitter, Welder, Mechanic, Plumber, Carpenter, Electronics, Refrigeration, Draftsman, Machinist, Tool Maker, Painter

### 13 AP Districts  
Anantapur, Chittoor, East Godavari, Guntur, Krishna, Kurnool, Prakasam, Nellore, Srikakulam, Visakhapatnam, Vizianagaram, West Godavari, YSR Kadapa

### 26 Exam Centers
2 government ITI centers per district

### 50 Students
Distributed across trades, districts, and centers

## 🚀 Quick Start

### Student Login
```
URL: http://localhost:5173
Hall Ticket: AP20250001 to AP20250050
DOB: See AP_ITI_DEMO_COMPLETE.md for individual DOBs
Security Answer: kumar
```

### Sample Logins
| Hall Ticket | DOB | Trade | District |
|-------------|-----|-------|----------|
| AP20250001 | 02/02/2001 | Blockchain | Anantapur |
| AP20250002 | 03/03/2002 | COPA | Chittoor |
| AP20250003 | 04/04/2003 | Electrician | Chittoor |

### Admin Access
```
URL: http://localhost:5174
Username: admin
Password: admin123
```

## 📊 Data Summary

- **Trades:** 15
- **Districts:** 13  
- **Centers:** 26
- **Students:** 50
- **Exams:** 15 (one per trade)
- **Questions:** 150 (10 per exam)
- **Exam Attempts:** 50 (pre-assigned)

## 🎯 System Flow

1. Student arrives at exam center
2. Login with hall ticket + DOB + security answer
3. System loads trade-specific exam automatically
4. Student answers 10 MCQ questions (40 marks)
5. Auto-save every 15 seconds
6. Submit exam when complete

## 📈 Filtering & Reports

### Available Filters
- **By Trade:** Filter results by ITI trade (IoT, Blockchain, etc.)
- **By District:** Filter by AP district
- **By Center:** Filter by specific exam center
- **By Date:** Filter by exam date range

### Report Types
- Trade-wise performance
- District-wise performance
- Center-wise performance
- Student-wise detailed reports

## 🔧 Technical Stack

- **Backend:** FastAPI, Python 3.11
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Storage:** MinIO
- **Frontend:** React, TypeScript
- **Authentication:** JWT with hall ticket validation

## 📝 Documentation

See `AP_ITI_DEMO_COMPLETE.md` for complete details on:
- All student credentials
- Trade descriptions
- District mapping
- Center locations
- API endpoints
- Database schema
- Testing scenarios

## ✨ Status

🟢 **FULLY OPERATIONAL**

All core features implemented and tested. Ready for demonstration and production use.

---

**Last Updated:** October 26, 2025
