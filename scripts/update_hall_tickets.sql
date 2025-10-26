-- Update existing students with hall ticket authentication data
UPDATE users 
SET 
    hall_ticket_number = 'HT2024' || LPAD(SUBSTRING(username FROM 8)::TEXT, 3, '0'),
    date_of_birth = '2000-01-01'::DATE,
    security_question = 'What is your mother''s maiden name?',
    security_answer_hash = '$2b$12$LlF8lN1k9oI5Uw5O5lzWFugZZx01OnHDUKgqCHGFgnNCb3fwVA7G2'
WHERE username LIKE 'student%';

-- Verify the update
SELECT username, hall_ticket_number, date_of_birth, security_question 
FROM users 
WHERE username LIKE 'student%' 
ORDER BY username 
LIMIT 10;
