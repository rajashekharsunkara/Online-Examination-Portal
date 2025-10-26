"""
Exam management endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
import csv
import io
from app.core.database import get_db
from app.api.dependencies import get_current_active_user, require_any_role
from app.models.user import User
from app.models.exam import (
    Exam, Question, QuestionBank, Trade, ExamQuestion,
    QuestionType, DifficultyLevel
)
from app.schemas.exam import (
    Trade as TradeSchema,
    TradeCreate,
    TradeUpdate,
    QuestionBank as QuestionBankSchema,
    QuestionBankCreate,
    QuestionBankUpdate,
    Question as QuestionSchema,
    QuestionCreate,
    QuestionUpdate,
    QuestionCSVImport,
    Exam as ExamSchema,
    ExamCreate,
    ExamUpdate,
    ExamWithQuestions,
    ExamQTI,
)

router = APIRouter(prefix="/exams", tags=["Exams"])


# ==================== Trade Endpoints ====================

@router.post("/trades", response_model=TradeSchema, status_code=status.HTTP_201_CREATED)
async def create_trade(
    trade: TradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hall_in_charge"))
):
    """
    Create a new trade/course
    
    Requires: admin or hall_in_charge role
    """
    # Check if trade code already exists
    existing_trade = db.query(Trade).filter(Trade.code == trade.code).first()
    if existing_trade:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trade with code {trade.code} already exists"
        )
    
    db_trade = Trade(**trade.dict())
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    
    return TradeSchema.from_orm(db_trade)


@router.get("/trades", response_model=List[TradeSchema])
async def list_trades(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all trades
    """
    query = db.query(Trade)
    
    if active_only:
        query = query.filter(Trade.is_active == True)
    
    trades = query.offset(skip).limit(limit).all()
    return [TradeSchema.from_orm(t) for t in trades]


@router.get("/trades/{trade_id}", response_model=TradeSchema)
async def get_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific trade by ID"""
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )
    return TradeSchema.from_orm(trade)


@router.put("/trades/{trade_id}", response_model=TradeSchema)
async def update_trade(
    trade_id: int,
    trade_update: TradeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hall_in_charge"))
):
    """Update a trade"""
    db_trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not db_trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )
    
    # Update fields
    for field, value in trade_update.dict(exclude_unset=True).items():
        setattr(db_trade, field, value)
    
    db.commit()
    db.refresh(db_trade)
    return TradeSchema.from_orm(db_trade)


@router.delete("/trades/{trade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin"))
):
    """Delete a trade (admin only)"""
    db_trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not db_trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )
    
    db.delete(db_trade)
    db.commit()
    return None


# ==================== Question Bank Endpoints ====================

@router.post("/question-banks", response_model=QuestionBankSchema, status_code=status.HTTP_201_CREATED)
async def create_question_bank(
    qbank: QuestionBankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hall_in_charge"))
):
    """Create a new question bank"""
    # Verify trade exists
    trade = db.query(Trade).filter(Trade.id == qbank.trade_id).first()
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )
    
    db_qbank = QuestionBank(**qbank.dict())
    db.add(db_qbank)
    db.commit()
    db.refresh(db_qbank)
    
    return QuestionBankSchema.from_orm(db_qbank)


@router.get("/question-banks", response_model=List[QuestionBankSchema])
async def list_question_banks(
    skip: int = 0,
    limit: int = 100,
    trade_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all question banks"""
    query = db.query(QuestionBank)
    
    if trade_id:
        query = query.filter(QuestionBank.trade_id == trade_id)
    
    qbanks = query.offset(skip).limit(limit).all()
    return [QuestionBankSchema.from_orm(qb) for qb in qbanks]


# ==================== Question Endpoints ====================

@router.post("/questions", response_model=QuestionSchema, status_code=status.HTTP_201_CREATED)
async def create_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hall_in_charge"))
):
    """Create a new question"""
    # Verify question bank exists
    qbank = db.query(QuestionBank).filter(QuestionBank.id == question.question_bank_id).first()
    if not qbank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question bank not found"
        )
    
    db_question = Question(**question.dict())
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    return QuestionSchema.from_orm(db_question)


@router.get("/questions", response_model=List[QuestionSchema])
async def list_questions(
    skip: int = 0,
    limit: int = 100,
    question_bank_id: Optional[int] = None,
    difficulty: Optional[DifficultyLevel] = None,
    question_type: Optional[QuestionType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List questions with filters"""
    query = db.query(Question)
    
    if question_bank_id:
        query = query.filter(Question.question_bank_id == question_bank_id)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if question_type:
        query = query.filter(Question.question_type == question_type)
    
    questions = query.offset(skip).limit(limit).all()
    return [QuestionSchema.from_orm(q) for q in questions]


@router.get("/questions/{question_id}", response_model=QuestionSchema)
async def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific question"""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    return QuestionSchema.from_orm(question)


@router.put("/questions/{question_id}", response_model=QuestionSchema)
async def update_question(
    question_id: int,
    question_update: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hall_in_charge"))
):
    """Update a question"""
    db_question = db.query(Question).filter(Question.id == question_id).first()
    if not db_question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    for field, value in question_update.dict(exclude_unset=True).items():
        setattr(db_question, field, value)
    
    db.commit()
    db.refresh(db_question)
    return QuestionSchema.from_orm(db_question)


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hall_in_charge"))
):
    """Delete a question"""
    db_question = db.query(Question).filter(Question.id == question_id).first()
    if not db_question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    db.delete(db_question)
    db.commit()
    return None


# ==================== CSV Import ====================

@router.post("/question-banks/{qbank_id}/import-csv")
async def import_questions_csv(
    qbank_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hall_in_charge"))
):
    """
    Import questions from CSV file
    
    CSV format:
    question_text,question_type,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty,marks,negative_marks,tags
    """
    # Verify question bank exists
    qbank = db.query(QuestionBank).filter(QuestionBank.id == qbank_id).first()
    if not qbank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question bank not found"
        )
    
    # Read CSV content
    contents = await file.read()
    csv_content = contents.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(csv_content))
    
    imported_count = 0
    errors = []
    
    for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 (header is 1)
        try:
            # Build options dict
            options = {}
            if row.get('option_a'):
                options['A'] = row['option_a']
            if row.get('option_b'):
                options['B'] = row['option_b']
            if row.get('option_c'):
                options['C'] = row['option_c']
            if row.get('option_d'):
                options['D'] = row['option_d']
            
            # Parse correct answer
            correct_answer = [ans.strip() for ans in row['correct_answer'].split(',')]
            
            # Parse tags
            tags = None
            if row.get('tags'):
                tags = [tag.strip() for tag in row['tags'].split(',')]
            
            # Create question
            question = Question(
                question_bank_id=qbank_id,
                question_text=row['question_text'],
                question_type=QuestionType(row.get('question_type', 'multiple_choice')),
                options=options if options else None,
                correct_answer=correct_answer,
                explanation=row.get('explanation'),
                difficulty=DifficultyLevel(row.get('difficulty', 'medium')),
                marks=float(row.get('marks', 1.0)),
                negative_marks=float(row.get('negative_marks', 0.0)),
                tags=tags
            )
            
            db.add(question)
            imported_count += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving questions: {str(e)}"
        )
    
    return {
        "imported": imported_count,
        "errors": errors,
        "question_bank_id": qbank_id
    }


# ==================== Exam Endpoints ====================

@router.post("/", response_model=ExamSchema, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hall_in_charge"))
):
    """Create a new exam"""
    # Verify trade exists
    trade = db.query(Trade).filter(Trade.id == exam.trade_id).first()
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )
    
    # Create exam
    exam_data = exam.dict(exclude={'question_ids'})
    db_exam = Exam(**exam_data, created_by=current_user.id)
    db.add(db_exam)
    db.flush()
    
    # Attach questions
    if exam.question_ids:
        for idx, question_id in enumerate(exam.question_ids, start=1):
            question = db.query(Question).filter(Question.id == question_id).first()
            if question:
                exam_question = ExamQuestion(
                    exam_id=db_exam.id,
                    question_id=question_id,
                    order_number=idx
                )
                db.add(exam_question)
    
    db.commit()
    db.refresh(db_exam)
    
    return ExamSchema.from_orm(db_exam)


@router.get("/", response_model=List[ExamSchema])
async def list_exams(
    skip: int = 0,
    limit: int = 100,
    trade_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all exams"""
    query = db.query(Exam)
    
    if trade_id:
        query = query.filter(Exam.trade_id == trade_id)
    if status_filter:
        query = query.filter(Exam.status == status_filter)
    
    exams = query.offset(skip).limit(limit).all()
    return [ExamSchema.from_orm(e) for e in exams]


@router.get("/{exam_id}", response_model=ExamWithQuestions)
async def get_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific exam with questions"""
    from sqlalchemy.orm import joinedload
    
    exam = db.query(Exam).options(
        joinedload(Exam.exam_questions).joinedload(ExamQuestion.question)
    ).filter(Exam.id == exam_id).first()
    
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    # Build response with questions in order
    exam_dict = {
        **ExamSchema.from_orm(exam).dict(),
        'questions': [
            QuestionSchema.from_orm(eq.question)
            for eq in sorted(exam.exam_questions, key=lambda x: x.order_number)
        ]
    }
    
    return exam_dict


@router.put("/{exam_id}", response_model=ExamSchema)
async def update_exam(
    exam_id: int,
    exam_update: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hall_in_charge"))
):
    """Update an exam"""
    db_exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not db_exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    for field, value in exam_update.dict(exclude_unset=True).items():
        setattr(db_exam, field, value)
    
    db.commit()
    db.refresh(db_exam)
    return ExamSchema.from_orm(db_exam)


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin"))
):
    """Delete an exam"""
    db_exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not db_exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    db.delete(db_exam)
    db.commit()
    return None


@router.get("/{exam_id}/export-qti", response_model=ExamQTI)
async def export_exam_qti(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hall_in_charge"))
):
    """Export exam in QTI-like JSON format"""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    # Get exam questions with details
    exam_questions = (
        db.query(ExamQuestion, Question)
        .join(Question)
        .filter(ExamQuestion.exam_id == exam_id)
        .order_by(ExamQuestion.order_number)
        .all()
    )
    
    questions_data = []
    for eq, q in exam_questions:
        questions_data.append({
            "order": eq.order_number,
            "question_text": q.question_text,
            "type": q.question_type.value,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "marks": eq.marks_override or q.marks,
            "difficulty": q.difficulty.value
        })
    
    return ExamQTI(
        exam_id=exam.id,
        title=exam.title,
        description=exam.description,
        duration_minutes=exam.duration_minutes,
        total_marks=exam.total_marks,
        questions=questions_data
    )
