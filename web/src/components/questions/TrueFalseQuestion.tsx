/**
 * True/False Question Component
 */

import { useState, useEffect } from 'react';
import type { Question } from '../../types';
import './Question.css';

interface TrueFalseQuestionProps {
  question: Question;
  value: boolean | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function TrueFalseQuestion({
  question,
  value,
  onChange,
  disabled,
}: TrueFalseQuestionProps) {
  const [selected, setSelected] = useState<boolean | null>(null);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  const handleSelect = (answer: boolean) => {
    if (disabled) return;
    setSelected(answer);
    onChange(answer);
  };

  return (
    <div className="true-false-question">
      <div className="question-type-badge">True/False</div>

      <div className="question-text">{question.question_text}</div>

      <div className="question-marks">
        Marks: <strong>{question.marks}</strong>
        {question.negative_marks > 0 && (
          <span className="negative-marks"> | Negative: -{question.negative_marks}</span>
        )}
      </div>

      <div className="true-false-options">
        <button
          className={`tf-option ${selected === true ? 'selected' : ''}`}
          onClick={() => handleSelect(true)}
          disabled={disabled}
        >
          <span className="tf-icon">✓</span>
          <span className="tf-label">True</span>
          {selected === true && <span className="check-mark">✓</span>}
        </button>

        <button
          className={`tf-option ${selected === false ? 'selected' : ''}`}
          onClick={() => handleSelect(false)}
          disabled={disabled}
        >
          <span className="tf-icon">✗</span>
          <span className="tf-label">False</span>
          {selected === false && <span className="check-mark">✓</span>}
        </button>
      </div>
    </div>
  );
}
