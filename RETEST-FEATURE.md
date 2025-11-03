# Retest Feature Documentation

## Overview
The Retest feature allows administrators to grant students the ability to retake an exam. This is useful for students who were disqualified or need to reattempt the exam.

## How It Works

### Admin Side
1. **Students Tab**: Each student who has completed or been kicked from an exam has an "Allow Retest" button
2. **Results Tab**: Each completed/kicked result row has a retest button (circular arrow icon)
3. When clicked, admin confirms the action via a popup dialog
4. The system clears all previous exam session data for that student

### Backend Process
When retest is triggered, the system:
- Deletes all `exam_sessions` records for the student
- Removes associated `session_questions` entries
- Clears `answers` data
- **Preserves** `results` records for audit/history purposes

### Student Side
After retest is granted:
1. Student can log in again with their admit card ID and DOB
2. System creates a new fresh exam session
3. Student gets a new random question set (from available active sets)
4. Previous violations/warnings are cleared
5. Student can complete the exam normally

## API Endpoint

### POST `/api/admin/retest`
**Request Body:**
```json
{
  "student_id": 123
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Retest allowed. Previous session cleared."
}
```

**Error Response:**
```json
{
  "error": "student_id required"
}
```

## UI Elements

### Students Tab
- Button appears for students with status: `completed` or `kicked`
- Button text: "Allow Retest"
- Color: Warning (yellow)
- Icon: Circular arrow (bi-arrow-clockwise)

### Results Tab
- Small icon button in the last column
- Only visible for completed/kicked exams
- Tooltip: "Allow student to retake exam"

## Confirmation Dialog
```
Allow retest for:

Student: [Student Name]
Admit Card: [Admit Card ID]

This will:
- Delete previous exam session
- Allow the student to take the exam again

Are you sure?
```

## Database Impact

### Tables Affected
1. `exam_sessions` - Records deleted
2. `session_questions` - Records deleted  
3. `answers` - Records deleted
4. `results` - **NOT deleted** (preserved for history)

### Data Preservation
The `results` table is intentionally preserved to maintain:
- Audit trail of all exam attempts
- Historical performance data
- Violation records
- Administrative oversight

## Testing the Feature

### Manual Test Steps
1. **Setup**: Have a student complete an exam
2. **Admin Login**: Access admin dashboard
3. **Navigate**: Go to Students or Results tab
4. **Locate**: Find the student who completed the exam
5. **Action**: Click "Allow Retest" button
6. **Confirm**: Accept the confirmation dialog
7. **Verify**: Check that success message appears
8. **Student Login**: Student logs in again
9. **New Session**: Verify student gets a fresh exam session

### API Test
```bash
curl -X POST http://localhost:3001/api/admin/retest \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1}'
```

Expected response:
```json
{"success":true,"message":"Retest allowed. Previous session cleared."}
```

### Database Verification
```sql
-- Check sessions cleared
SELECT COUNT(*) FROM exam_sessions WHERE student_id = 1;
-- Should return 0 after retest

-- Check results preserved
SELECT * FROM results WHERE student_id = 1;
-- Should still show historical results
```

## Error Handling

### Client Side
- Network errors: Shows "Network error while allowing retest"
- Server errors: Displays error message from server response
- Confirmation cancel: No action taken

### Server Side
- Missing student_id: Returns 400 error
- Database errors: Logged and returns 500 error
- Invalid student_id: Silently succeeds (no sessions to delete)

## Security Considerations
- Only accessible to authenticated admin users
- Requires explicit confirmation before execution
- Preserves audit trail in results table
- Logged in server console for monitoring

## Future Enhancements
- Option to preserve or delete previous results
- Limit number of retest attempts per student
- Notification to student when retest is granted
- Retest request from student (pending admin approval)
- Bulk retest for multiple students
