/**
 * Multiple Choice Question Component
 * Handles both single and multiple selection
 */

import { useState, useEffect } from 'react';
import type { Question } from '../../types';
import './Question.css';

interface MCQQuestionProps {
  question: Question;
  value: string[] | string | null;
  onChange: (value: string[] | string) => void;
  disabled?: boolean;
}

export function MCQQuestion({ question, value, onChange, disabled }: MCQQuestionProps) {
  const isSingleChoice = question.question_type === 'mcq_single';
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    if (value) {
      setSelectedOptions(Array.isArray(value) ? value : [value]);
    } else {
      setSelectedOptions([]);
    }
  }, [value]);

  const handleOptionClick = (option: string) => {
    if (disabled) return;

    let newSelection: string[];

    if (isSingleChoice) {
      newSelection = [option];
    } else {
      if (selectedOptions.includes(option)) {
        newSelection = selectedOptions.filter((opt) => opt !== option);
      } else {
        newSelection = [...selectedOptions, option];
      }
    }

    setSelectedOptions(newSelection);
    onChange(isSingleChoice ? newSelection[0] || '' : newSelection);
  };

  const isOptionSelected = (option: string) => selectedOptions.includes(option);

  // Handle case where options might not be an array (defensive coding)
  const optionsArray = Array.isArray(question.options) 
    ? question.options 
    : question.options 
      ? Object.values(question.options)
      : [];

  if (optionsArray.length === 0) {
    return (
      <div className="mcq-question">
        <div className="question-text">{question.question_text}</div>
        <div className="error-message">No options available for this question.</div>
      </div>
    );
  }

  return (
    <div className="mcq-question">
      <div className="question-type-badge">
        {isSingleChoice ? 'Single Choice' : 'Multiple Choice'}
      </div>

      <div className="question-text">{question.question_text}</div>

      <div className="question-marks">
        Marks: <strong>{question.marks}</strong>
        {question.negative_marks > 0 && (
          <span className="negative-marks"> | Negative: -{question.negative_marks}</span>
        )}
      </div>

      <div className="options-container">
        {optionsArray.map((option, index) => {
          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
          const isSelected = isOptionSelected(option);

          return (
            <button
              key={index}
              className={`option-button ${isSelected ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option)}
              disabled={disabled}
            >
              <span className="option-label">{optionLabel}</span>
              <span className="option-text">{option}</span>
              {isSelected && <span className="check-mark">✓</span>}
            </button>
          );
        })}
      </div>

      {!isSingleChoice && (
        <div className="selection-hint">
          {selectedOptions.length === 0
            ? 'Select all that apply'
            : `${selectedOptions.length} option(s) selected`}
        </div>
      )}
    </div>
  );
}
