/**
 * Text Answer Question Component
 * Handles both short and long answers
 */

import { useState, useEffect } from 'react';
import type { Question } from '../../types';
import './Question.css';

interface TextQuestionProps {
  question: Question;
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TextQuestion({ question, value, onChange, disabled }: TextQuestionProps) {
  const [text, setText] = useState('');
  const isLongAnswer = question.question_type === 'long_answer';
  const maxLength = isLongAnswer ? 5000 : 500;

  useEffect(() => {
    setText(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setText(newValue);
      onChange(newValue);
    }
  };

  return (
    <div className="text-question">
      <div className="question-type-badge">
        {isLongAnswer ? 'Long Answer' : 'Short Answer'}
      </div>

      <div className="question-text">{question.question_text}</div>

      <div className="question-marks">
        Marks: <strong>{question.marks}</strong>
      </div>

      <div className="text-input-container">
        {isLongAnswer ? (
          <textarea
            className="text-answer-input long"
            value={text}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Type your answer here..."
            rows={10}
          />
        ) : (
          <input
            type="text"
            className="text-answer-input short"
            value={text}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Type your answer here..."
          />
        )}

        <div className="character-count">
          {text.length} / {maxLength} characters
        </div>
      </div>
    </div>
  );
}
