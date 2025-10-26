--
-- PostgreSQL database dump
--

\restrict cYO3yjqeWGP5uZnWmy4cZF8QF2ziRzaD4i7CHUIc93InaoMpHqmSUK0XfBjMI1O

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: attemptstatus; Type: TYPE; Schema: public; Owner: exam_user
--

CREATE TYPE public.attemptstatus AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'SUBMITTED',
    'GRADED',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public.attemptstatus OWNER TO exam_user;

--
-- Name: difficultylevel; Type: TYPE; Schema: public; Owner: exam_user
--

CREATE TYPE public.difficultylevel AS ENUM (
    'EASY',
    'MEDIUM',
    'HARD'
);


ALTER TYPE public.difficultylevel OWNER TO exam_user;

--
-- Name: examstatus; Type: TYPE; Schema: public; Owner: exam_user
--

CREATE TYPE public.examstatus AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ACTIVE',
    'COMPLETED',
    'ARCHIVED'
);


ALTER TYPE public.examstatus OWNER TO exam_user;

--
-- Name: questiontype; Type: TYPE; Schema: public; Owner: exam_user
--

CREATE TYPE public.questiontype AS ENUM (
    'MULTIPLE_CHOICE',
    'TRUE_FALSE',
    'SHORT_ANSWER',
    'ESSAY'
);


ALTER TYPE public.questiontype OWNER TO exam_user;

--
-- Name: rubrictype; Type: TYPE; Schema: public; Owner: exam_user
--

CREATE TYPE public.rubrictype AS ENUM (
    'ANALYTICAL',
    'HOLISTIC',
    'CHECKLIST'
);


ALTER TYPE public.rubrictype OWNER TO exam_user;

--
-- Name: scoringmethod; Type: TYPE; Schema: public; Owner: exam_user
--

CREATE TYPE public.scoringmethod AS ENUM (
    'POINTS',
    'PERCENTAGE',
    'LEVELS'
);


ALTER TYPE public.scoringmethod OWNER TO exam_user;

--
-- Name: transferstatus; Type: TYPE; Schema: public; Owner: exam_user
--

CREATE TYPE public.transferstatus AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public.transferstatus OWNER TO exam_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    event_type character varying(50) NOT NULL,
    event_category character varying(50) NOT NULL,
    user_id integer,
    username character varying(255),
    attempt_id integer,
    exam_id integer,
    transfer_id integer,
    description text NOT NULL,
    details json,
    ip_address character varying(45),
    user_agent character varying(500),
    success integer NOT NULL,
    error_message text,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO exam_user;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_logs_id_seq OWNER TO exam_user;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: centers; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.centers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    address character varying(500),
    city character varying(100),
    state character varying(100),
    district character varying(100),
    pincode character varying(20),
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.centers OWNER TO exam_user;

--
-- Name: centers_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.centers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.centers_id_seq OWNER TO exam_user;

--
-- Name: centers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.centers_id_seq OWNED BY public.centers.id;


--
-- Name: criterion_scores; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.criterion_scores (
    id integer NOT NULL,
    feedback_id integer NOT NULL,
    criterion_id integer NOT NULL,
    level_id integer,
    points_awarded double precision NOT NULL,
    comments text,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.criterion_scores OWNER TO exam_user;

--
-- Name: criterion_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.criterion_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.criterion_scores_id_seq OWNER TO exam_user;

--
-- Name: criterion_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.criterion_scores_id_seq OWNED BY public.criterion_scores.id;


--
-- Name: exam_questions; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.exam_questions (
    id integer NOT NULL,
    exam_id integer NOT NULL,
    question_id integer NOT NULL,
    order_number integer NOT NULL,
    marks_override double precision,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.exam_questions OWNER TO exam_user;

--
-- Name: exam_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.exam_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.exam_questions_id_seq OWNER TO exam_user;

--
-- Name: exam_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.exam_questions_id_seq OWNED BY public.exam_questions.id;


--
-- Name: exams; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.exams (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    trade_id integer NOT NULL,
    duration_minutes integer NOT NULL,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    total_marks double precision NOT NULL,
    passing_marks double precision NOT NULL,
    total_questions integer NOT NULL,
    shuffle_questions boolean NOT NULL,
    shuffle_options boolean NOT NULL,
    show_results_immediately boolean NOT NULL,
    allow_review boolean NOT NULL,
    status public.examstatus NOT NULL,
    instructions text,
    created_by integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.exams OWNER TO exam_user;

--
-- Name: exams_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.exams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.exams_id_seq OWNER TO exam_user;

--
-- Name: exams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.exams_id_seq OWNED BY public.exams.id;


--
-- Name: grading_feedback; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.grading_feedback (
    id integer NOT NULL,
    answer_id integer NOT NULL,
    rubric_id integer NOT NULL,
    graded_by integer NOT NULL,
    comments text,
    total_score double precision NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.grading_feedback OWNER TO exam_user;

--
-- Name: grading_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.grading_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.grading_feedback_id_seq OWNER TO exam_user;

--
-- Name: grading_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.grading_feedback_id_seq OWNED BY public.grading_feedback.id;


--
-- Name: proctoring_events; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.proctoring_events (
    id integer NOT NULL,
    attempt_id integer NOT NULL,
    event_type character varying(50) NOT NULL,
    event_timestamp timestamp without time zone NOT NULL,
    question_id integer,
    event_data json,
    user_agent text,
    ip_address character varying(45),
    severity character varying(20),
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.proctoring_events OWNER TO exam_user;

--
-- Name: proctoring_events_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.proctoring_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.proctoring_events_id_seq OWNER TO exam_user;

--
-- Name: proctoring_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.proctoring_events_id_seq OWNED BY public.proctoring_events.id;


--
-- Name: question_banks; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.question_banks (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    trade_id integer NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.question_banks OWNER TO exam_user;

--
-- Name: question_banks_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.question_banks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.question_banks_id_seq OWNER TO exam_user;

--
-- Name: question_banks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.question_banks_id_seq OWNED BY public.question_banks.id;


--
-- Name: question_rubrics; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.question_rubrics (
    id integer NOT NULL,
    question_id integer NOT NULL,
    rubric_id integer NOT NULL,
    is_required boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.question_rubrics OWNER TO exam_user;

--
-- Name: question_rubrics_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.question_rubrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.question_rubrics_id_seq OWNER TO exam_user;

--
-- Name: question_rubrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.question_rubrics_id_seq OWNED BY public.question_rubrics.id;


--
-- Name: question_timings; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.question_timings (
    id integer NOT NULL,
    attempt_id integer NOT NULL,
    question_id integer NOT NULL,
    first_viewed_at timestamp without time zone,
    last_viewed_at timestamp without time zone,
    total_time_seconds integer,
    answer_count integer,
    first_answered_at timestamp without time zone,
    last_answered_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.question_timings OWNER TO exam_user;

--
-- Name: question_timings_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.question_timings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.question_timings_id_seq OWNER TO exam_user;

--
-- Name: question_timings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.question_timings_id_seq OWNED BY public.question_timings.id;


--
-- Name: questions; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    question_bank_id integer NOT NULL,
    question_text text NOT NULL,
    question_type public.questiontype NOT NULL,
    options json,
    correct_answer json NOT NULL,
    explanation text,
    difficulty public.difficultylevel NOT NULL,
    marks double precision NOT NULL,
    negative_marks double precision NOT NULL,
    tags json,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.questions OWNER TO exam_user;

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.questions_id_seq OWNER TO exam_user;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(255),
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO exam_user;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO exam_user;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: rubric_criteria; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.rubric_criteria (
    id integer NOT NULL,
    rubric_id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    "order" integer,
    max_points double precision NOT NULL,
    weight double precision,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.rubric_criteria OWNER TO exam_user;

--
-- Name: rubric_criteria_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.rubric_criteria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rubric_criteria_id_seq OWNER TO exam_user;

--
-- Name: rubric_criteria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.rubric_criteria_id_seq OWNED BY public.rubric_criteria.id;


--
-- Name: rubric_levels; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.rubric_levels (
    id integer NOT NULL,
    criterion_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    points double precision NOT NULL,
    "order" integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.rubric_levels OWNER TO exam_user;

--
-- Name: rubric_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.rubric_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rubric_levels_id_seq OWNER TO exam_user;

--
-- Name: rubric_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.rubric_levels_id_seq OWNED BY public.rubric_levels.id;


--
-- Name: rubrics; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.rubrics (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    rubric_type public.rubrictype NOT NULL,
    scoring_method public.scoringmethod NOT NULL,
    max_score double precision NOT NULL,
    created_by integer NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.rubrics OWNER TO exam_user;

--
-- Name: rubrics_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.rubrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rubrics_id_seq OWNER TO exam_user;

--
-- Name: rubrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.rubrics_id_seq OWNED BY public.rubrics.id;


--
-- Name: student_answers; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.student_answers (
    id integer NOT NULL,
    attempt_id integer NOT NULL,
    question_id integer NOT NULL,
    answer json,
    is_flagged boolean,
    time_spent_seconds integer,
    answer_sequence integer,
    is_correct boolean,
    marks_awarded double precision,
    auto_graded boolean,
    first_answered_at timestamp with time zone,
    last_updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_answers OWNER TO exam_user;

--
-- Name: student_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.student_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.student_answers_id_seq OWNER TO exam_user;

--
-- Name: student_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.student_answers_id_seq OWNED BY public.student_answers.id;


--
-- Name: student_attempts; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.student_attempts (
    id integer NOT NULL,
    student_id integer NOT NULL,
    exam_id integer NOT NULL,
    status public.attemptstatus NOT NULL,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    submit_time timestamp with time zone,
    duration_minutes integer NOT NULL,
    time_remaining_seconds integer,
    last_activity_time timestamp with time zone,
    workstation_id character varying(100),
    initial_workstation_id character varying(100),
    transfer_count integer,
    current_question_id integer,
    questions_answered integer,
    questions_flagged json,
    total_marks double precision,
    marks_obtained double precision,
    percentage double precision,
    is_passed boolean,
    auto_graded boolean,
    graded_by integer,
    graded_at timestamp with time zone,
    browser_info json,
    ip_address character varying(45),
    notes text,
    encryption_salt character varying(64),
    encrypted_final_answers text,
    encryption_timestamp timestamp with time zone,
    encryption_checksum character varying(64),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_attempts OWNER TO exam_user;

--
-- Name: student_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.student_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.student_attempts_id_seq OWNER TO exam_user;

--
-- Name: student_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.student_attempts_id_seq OWNED BY public.student_attempts.id;


--
-- Name: trades; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.trades (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.trades OWNER TO exam_user;

--
-- Name: trades_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.trades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.trades_id_seq OWNER TO exam_user;

--
-- Name: trades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.trades_id_seq OWNED BY public.trades.id;


--
-- Name: transfers; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.transfers (
    id integer NOT NULL,
    attempt_id integer NOT NULL,
    from_workstation character varying(50) NOT NULL,
    to_workstation character varying(50) NOT NULL,
    requested_by_id integer NOT NULL,
    approved_by_id integer,
    status public.transferstatus NOT NULL,
    reason text NOT NULL,
    migration_checksum character varying(64),
    answers_transferred integer,
    error_message text,
    created_at timestamp without time zone NOT NULL,
    approved_at timestamp without time zone,
    rejected_at timestamp without time zone,
    completed_at timestamp without time zone
);


ALTER TABLE public.transfers OWNER TO exam_user;

--
-- Name: transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transfers_id_seq OWNER TO exam_user;

--
-- Name: transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.transfers_id_seq OWNED BY public.transfers.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO exam_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: exam_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    hall_ticket_number character varying(50),
    date_of_birth timestamp without time zone,
    security_question character varying(255),
    security_answer_hash character varying(255),
    trade_id integer,
    is_active boolean NOT NULL,
    is_verified boolean NOT NULL,
    center_id integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    last_login timestamp without time zone
);


ALTER TABLE public.users OWNER TO exam_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: exam_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO exam_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: exam_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: centers id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.centers ALTER COLUMN id SET DEFAULT nextval('public.centers_id_seq'::regclass);


--
-- Name: criterion_scores id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.criterion_scores ALTER COLUMN id SET DEFAULT nextval('public.criterion_scores_id_seq'::regclass);


--
-- Name: exam_questions id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.exam_questions ALTER COLUMN id SET DEFAULT nextval('public.exam_questions_id_seq'::regclass);


--
-- Name: exams id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.exams ALTER COLUMN id SET DEFAULT nextval('public.exams_id_seq'::regclass);


--
-- Name: grading_feedback id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.grading_feedback ALTER COLUMN id SET DEFAULT nextval('public.grading_feedback_id_seq'::regclass);


--
-- Name: proctoring_events id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.proctoring_events ALTER COLUMN id SET DEFAULT nextval('public.proctoring_events_id_seq'::regclass);


--
-- Name: question_banks id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.question_banks ALTER COLUMN id SET DEFAULT nextval('public.question_banks_id_seq'::regclass);


--
-- Name: question_rubrics id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.question_rubrics ALTER COLUMN id SET DEFAULT nextval('public.question_rubrics_id_seq'::regclass);


--
-- Name: question_timings id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.question_timings ALTER COLUMN id SET DEFAULT nextval('public.question_timings_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: rubric_criteria id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.rubric_criteria ALTER COLUMN id SET DEFAULT nextval('public.rubric_criteria_id_seq'::regclass);


--
-- Name: rubric_levels id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.rubric_levels ALTER COLUMN id SET DEFAULT nextval('public.rubric_levels_id_seq'::regclass);


--
-- Name: rubrics id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.rubrics ALTER COLUMN id SET DEFAULT nextval('public.rubrics_id_seq'::regclass);


--
-- Name: student_answers id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.student_answers ALTER COLUMN id SET DEFAULT nextval('public.student_answers_id_seq'::regclass);


--
-- Name: student_attempts id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.student_attempts ALTER COLUMN id SET DEFAULT nextval('public.student_attempts_id_seq'::regclass);


--
-- Name: trades id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.trades ALTER COLUMN id SET DEFAULT nextval('public.trades_id_seq'::regclass);


--
-- Name: transfers id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.transfers ALTER COLUMN id SET DEFAULT nextval('public.transfers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.audit_logs (id, event_type, event_category, user_id, username, attempt_id, exam_id, transfer_id, description, details, ip_address, user_agent, success, error_message, created_at) FROM stdin;
\.


--
-- Data for Name: centers; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.centers (id, name, code, address, city, state, district, pincode, is_active, created_at, updated_at) FROM stdin;
1	Government ITI Anantapur - Center 1	AP001	ITI Campus, Anantapur District	Anantapur	Andhra Pradesh	Anantapur	500001	t	2025-10-26 18:37:32.095577	2025-10-26 18:37:32.095579
2	Government ITI Anantapur - Center 2	AP002	ITI Campus, Anantapur District	Anantapur	Andhra Pradesh	Anantapur	500002	t	2025-10-26 18:37:32.09664	2025-10-26 18:37:32.096641
3	Government ITI Chittoor - Center 1	AP003	ITI Campus, Chittoor District	Chittoor	Andhra Pradesh	Chittoor	500003	t	2025-10-26 18:37:32.097221	2025-10-26 18:37:32.097222
4	Government ITI Chittoor - Center 2	AP004	ITI Campus, Chittoor District	Chittoor	Andhra Pradesh	Chittoor	500004	t	2025-10-26 18:37:32.09774	2025-10-26 18:37:32.097741
5	Government ITI East Godavari - Center 1	AP005	ITI Campus, East Godavari District	East Godavari	Andhra Pradesh	East Godavari	500005	t	2025-10-26 18:37:32.098257	2025-10-26 18:37:32.098258
6	Government ITI East Godavari - Center 2	AP006	ITI Campus, East Godavari District	East Godavari	Andhra Pradesh	East Godavari	500006	t	2025-10-26 18:37:32.098756	2025-10-26 18:37:32.098756
7	Government ITI Guntur - Center 1	AP007	ITI Campus, Guntur District	Guntur	Andhra Pradesh	Guntur	500007	t	2025-10-26 18:37:32.099249	2025-10-26 18:37:32.09925
8	Government ITI Guntur - Center 2	AP008	ITI Campus, Guntur District	Guntur	Andhra Pradesh	Guntur	500008	t	2025-10-26 18:37:32.099745	2025-10-26 18:37:32.099746
9	Government ITI Krishna - Center 1	AP009	ITI Campus, Krishna District	Krishna	Andhra Pradesh	Krishna	500009	t	2025-10-26 18:37:32.100264	2025-10-26 18:37:32.100265
10	Government ITI Krishna - Center 2	AP010	ITI Campus, Krishna District	Krishna	Andhra Pradesh	Krishna	500010	t	2025-10-26 18:37:32.100759	2025-10-26 18:37:32.10076
11	Government ITI Kurnool - Center 1	AP011	ITI Campus, Kurnool District	Kurnool	Andhra Pradesh	Kurnool	500011	t	2025-10-26 18:37:32.101249	2025-10-26 18:37:32.10125
12	Government ITI Kurnool - Center 2	AP012	ITI Campus, Kurnool District	Kurnool	Andhra Pradesh	Kurnool	500012	t	2025-10-26 18:37:32.101721	2025-10-26 18:37:32.101721
13	Government ITI Prakasam - Center 1	AP013	ITI Campus, Prakasam District	Prakasam	Andhra Pradesh	Prakasam	500013	t	2025-10-26 18:37:32.102223	2025-10-26 18:37:32.102223
14	Government ITI Prakasam - Center 2	AP014	ITI Campus, Prakasam District	Prakasam	Andhra Pradesh	Prakasam	500014	t	2025-10-26 18:37:32.102745	2025-10-26 18:37:32.102746
15	Government ITI Nellore - Center 1	AP015	ITI Campus, Nellore District	Nellore	Andhra Pradesh	Nellore	500015	t	2025-10-26 18:37:32.103257	2025-10-26 18:37:32.103258
16	Government ITI Nellore - Center 2	AP016	ITI Campus, Nellore District	Nellore	Andhra Pradesh	Nellore	500016	t	2025-10-26 18:37:32.103871	2025-10-26 18:37:32.103872
17	Government ITI Srikakulam - Center 1	AP017	ITI Campus, Srikakulam District	Srikakulam	Andhra Pradesh	Srikakulam	500017	t	2025-10-26 18:37:32.104581	2025-10-26 18:37:32.104582
18	Government ITI Srikakulam - Center 2	AP018	ITI Campus, Srikakulam District	Srikakulam	Andhra Pradesh	Srikakulam	500018	t	2025-10-26 18:37:32.105281	2025-10-26 18:37:32.105282
19	Government ITI Visakhapatnam - Center 1	AP019	ITI Campus, Visakhapatnam District	Visakhapatnam	Andhra Pradesh	Visakhapatnam	500019	t	2025-10-26 18:37:32.105942	2025-10-26 18:37:32.105943
20	Government ITI Visakhapatnam - Center 2	AP020	ITI Campus, Visakhapatnam District	Visakhapatnam	Andhra Pradesh	Visakhapatnam	500020	t	2025-10-26 18:37:32.106651	2025-10-26 18:37:32.106652
21	Government ITI Vizianagaram - Center 1	AP021	ITI Campus, Vizianagaram District	Vizianagaram	Andhra Pradesh	Vizianagaram	500021	t	2025-10-26 18:37:32.107352	2025-10-26 18:37:32.107354
22	Government ITI Vizianagaram - Center 2	AP022	ITI Campus, Vizianagaram District	Vizianagaram	Andhra Pradesh	Vizianagaram	500022	t	2025-10-26 18:37:32.108071	2025-10-26 18:37:32.108072
23	Government ITI West Godavari - Center 1	AP023	ITI Campus, West Godavari District	West Godavari	Andhra Pradesh	West Godavari	500023	t	2025-10-26 18:37:32.108848	2025-10-26 18:37:32.108849
24	Government ITI West Godavari - Center 2	AP024	ITI Campus, West Godavari District	West Godavari	Andhra Pradesh	West Godavari	500024	t	2025-10-26 18:37:32.109573	2025-10-26 18:37:32.109574
25	Government ITI YSR Kadapa - Center 1	AP025	ITI Campus, YSR Kadapa District	YSR Kadapa	Andhra Pradesh	YSR Kadapa	500025	t	2025-10-26 18:37:32.110264	2025-10-26 18:37:32.110265
26	Government ITI YSR Kadapa - Center 2	AP026	ITI Campus, YSR Kadapa District	YSR Kadapa	Andhra Pradesh	YSR Kadapa	500026	t	2025-10-26 18:37:32.110931	2025-10-26 18:37:32.110932
\.


--
-- Data for Name: criterion_scores; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.criterion_scores (id, feedback_id, criterion_id, level_id, points_awarded, comments, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: exam_questions; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.exam_questions (id, exam_id, question_id, order_number, marks_override, created_at) FROM stdin;
1	1	1	1	\N	2025-10-26 18:37:32.212639
2	1	2	2	\N	2025-10-26 18:37:32.214268
3	1	3	3	\N	2025-10-26 18:37:32.215078
4	1	4	4	\N	2025-10-26 18:37:32.215835
5	1	5	5	\N	2025-10-26 18:37:32.216588
6	1	6	6	\N	2025-10-26 18:37:32.217356
7	1	7	7	\N	2025-10-26 18:37:32.218119
8	1	8	8	\N	2025-10-26 18:37:32.218816
9	1	9	9	\N	2025-10-26 18:37:32.219531
10	1	10	10	\N	2025-10-26 18:37:32.220229
11	2	11	1	\N	2025-10-26 18:37:32.222323
12	2	12	2	\N	2025-10-26 18:37:32.223035
13	2	13	3	\N	2025-10-26 18:37:32.22366
14	2	14	4	\N	2025-10-26 18:37:32.224344
15	2	15	5	\N	2025-10-26 18:37:32.225087
16	2	16	6	\N	2025-10-26 18:37:32.225916
17	2	17	7	\N	2025-10-26 18:37:32.226726
18	2	18	8	\N	2025-10-26 18:37:32.227413
19	2	19	9	\N	2025-10-26 18:37:32.22814
20	2	20	10	\N	2025-10-26 18:37:32.228847
21	3	21	1	\N	2025-10-26 18:37:32.230755
22	3	22	2	\N	2025-10-26 18:37:32.231428
23	3	23	3	\N	2025-10-26 18:37:32.232099
24	3	24	4	\N	2025-10-26 18:37:32.232797
25	3	25	5	\N	2025-10-26 18:37:32.233459
26	3	26	6	\N	2025-10-26 18:37:32.234113
27	3	27	7	\N	2025-10-26 18:37:32.234801
28	3	28	8	\N	2025-10-26 18:37:32.235483
29	3	29	9	\N	2025-10-26 18:37:32.236172
30	3	30	10	\N	2025-10-26 18:37:32.236879
31	4	31	1	\N	2025-10-26 18:37:32.238842
32	4	32	2	\N	2025-10-26 18:37:32.239604
33	4	33	3	\N	2025-10-26 18:37:32.2403
34	4	34	4	\N	2025-10-26 18:37:32.24102
35	4	35	5	\N	2025-10-26 18:37:32.241704
36	4	36	6	\N	2025-10-26 18:37:32.242596
37	4	37	7	\N	2025-10-26 18:37:32.243453
38	4	38	8	\N	2025-10-26 18:37:32.244164
39	4	39	9	\N	2025-10-26 18:37:32.244887
40	4	40	10	\N	2025-10-26 18:37:32.245586
41	5	41	1	\N	2025-10-26 18:37:32.247544
42	5	42	2	\N	2025-10-26 18:37:32.248257
43	5	43	3	\N	2025-10-26 18:37:32.248943
44	5	44	4	\N	2025-10-26 18:37:32.249635
45	5	45	5	\N	2025-10-26 18:37:32.250347
46	5	46	6	\N	2025-10-26 18:37:32.251042
47	5	47	7	\N	2025-10-26 18:37:32.251728
48	5	48	8	\N	2025-10-26 18:37:32.252421
49	5	49	9	\N	2025-10-26 18:37:32.253129
50	5	50	10	\N	2025-10-26 18:37:32.253843
51	6	51	1	\N	2025-10-26 18:37:32.255844
52	6	52	2	\N	2025-10-26 18:37:32.256558
53	6	53	3	\N	2025-10-26 18:37:32.257259
54	6	54	4	\N	2025-10-26 18:37:32.257957
55	6	55	5	\N	2025-10-26 18:37:32.258781
56	6	56	6	\N	2025-10-26 18:37:32.259668
57	6	57	7	\N	2025-10-26 18:37:32.260456
58	6	58	8	\N	2025-10-26 18:37:32.261162
59	6	59	9	\N	2025-10-26 18:37:32.261851
60	6	60	10	\N	2025-10-26 18:37:32.262559
61	7	61	1	\N	2025-10-26 18:37:32.264516
62	7	62	2	\N	2025-10-26 18:37:32.265244
63	7	63	3	\N	2025-10-26 18:37:32.265963
64	7	64	4	\N	2025-10-26 18:37:32.266679
65	7	65	5	\N	2025-10-26 18:37:32.267368
66	7	66	6	\N	2025-10-26 18:37:32.268085
67	7	67	7	\N	2025-10-26 18:37:32.268792
68	7	68	8	\N	2025-10-26 18:37:32.269474
69	7	69	9	\N	2025-10-26 18:37:32.270186
70	7	70	10	\N	2025-10-26 18:37:32.270907
71	8	71	1	\N	2025-10-26 18:37:32.273116
72	8	72	2	\N	2025-10-26 18:37:32.274258
73	8	73	3	\N	2025-10-26 18:37:32.275534
74	8	74	4	\N	2025-10-26 18:37:32.276844
75	8	75	5	\N	2025-10-26 18:37:32.277909
76	8	76	6	\N	2025-10-26 18:37:32.278971
77	8	77	7	\N	2025-10-26 18:37:32.279955
78	8	78	8	\N	2025-10-26 18:37:32.280923
79	8	79	9	\N	2025-10-26 18:37:32.281867
80	8	80	10	\N	2025-10-26 18:37:32.282818
81	9	81	1	\N	2025-10-26 18:37:32.285473
82	9	82	2	\N	2025-10-26 18:37:32.286502
83	9	83	3	\N	2025-10-26 18:37:32.287478
84	9	84	4	\N	2025-10-26 18:37:32.288459
85	9	85	5	\N	2025-10-26 18:37:32.289603
86	9	86	6	\N	2025-10-26 18:37:32.290445
87	9	87	7	\N	2025-10-26 18:37:32.291828
88	9	88	8	\N	2025-10-26 18:37:32.292963
89	9	89	9	\N	2025-10-26 18:37:32.293856
90	9	90	10	\N	2025-10-26 18:37:32.294515
91	10	91	1	\N	2025-10-26 18:37:32.296366
92	10	92	2	\N	2025-10-26 18:37:32.296941
93	10	93	3	\N	2025-10-26 18:37:32.297454
94	10	94	4	\N	2025-10-26 18:37:32.298006
95	10	95	5	\N	2025-10-26 18:37:32.298544
96	10	96	6	\N	2025-10-26 18:37:32.299088
97	10	97	7	\N	2025-10-26 18:37:32.299632
98	10	98	8	\N	2025-10-26 18:37:32.300161
99	10	99	9	\N	2025-10-26 18:37:32.300681
100	10	100	10	\N	2025-10-26 18:37:32.301248
101	11	101	1	\N	2025-10-26 18:37:32.302813
102	11	102	2	\N	2025-10-26 18:37:32.303323
103	11	103	3	\N	2025-10-26 18:37:32.303849
104	11	104	4	\N	2025-10-26 18:37:32.304344
105	11	105	5	\N	2025-10-26 18:37:32.304901
106	11	106	6	\N	2025-10-26 18:37:32.305429
107	11	107	7	\N	2025-10-26 18:37:32.306014
108	11	108	8	\N	2025-10-26 18:37:32.306525
109	11	109	9	\N	2025-10-26 18:37:32.307083
110	11	110	10	\N	2025-10-26 18:37:32.307695
111	12	111	1	\N	2025-10-26 18:37:32.309774
112	12	112	2	\N	2025-10-26 18:37:32.310394
113	12	113	3	\N	2025-10-26 18:37:32.310949
114	12	114	4	\N	2025-10-26 18:37:32.311468
115	12	115	5	\N	2025-10-26 18:37:32.311987
116	12	116	6	\N	2025-10-26 18:37:32.312505
117	12	117	7	\N	2025-10-26 18:37:32.313055
118	12	118	8	\N	2025-10-26 18:37:32.313569
119	12	119	9	\N	2025-10-26 18:37:32.314088
120	12	120	10	\N	2025-10-26 18:37:32.314605
121	13	121	1	\N	2025-10-26 18:37:32.316197
122	13	122	2	\N	2025-10-26 18:37:32.316787
123	13	123	3	\N	2025-10-26 18:37:32.317297
124	13	124	4	\N	2025-10-26 18:37:32.317824
125	13	125	5	\N	2025-10-26 18:37:32.318326
126	13	126	6	\N	2025-10-26 18:37:32.318847
127	13	127	7	\N	2025-10-26 18:37:32.319359
128	13	128	8	\N	2025-10-26 18:37:32.319905
129	13	129	9	\N	2025-10-26 18:37:32.320398
130	13	130	10	\N	2025-10-26 18:37:32.321851
131	14	131	1	\N	2025-10-26 18:37:32.325369
132	14	132	2	\N	2025-10-26 18:37:32.326876
133	14	133	3	\N	2025-10-26 18:37:32.328011
134	14	134	4	\N	2025-10-26 18:37:32.329032
135	14	135	5	\N	2025-10-26 18:37:32.329868
136	14	136	6	\N	2025-10-26 18:37:32.330427
137	14	137	7	\N	2025-10-26 18:37:32.331004
138	14	138	8	\N	2025-10-26 18:37:32.331516
139	14	139	9	\N	2025-10-26 18:37:32.332034
140	14	140	10	\N	2025-10-26 18:37:32.332576
141	15	141	1	\N	2025-10-26 18:37:32.334204
142	15	142	2	\N	2025-10-26 18:37:32.334772
143	15	143	3	\N	2025-10-26 18:37:32.335283
144	15	144	4	\N	2025-10-26 18:37:32.335797
145	15	145	5	\N	2025-10-26 18:37:32.33628
146	15	146	6	\N	2025-10-26 18:37:32.336794
147	15	147	7	\N	2025-10-26 18:37:32.337316
148	15	148	8	\N	2025-10-26 18:37:32.337854
149	15	149	9	\N	2025-10-26 18:37:32.338369
150	15	150	10	\N	2025-10-26 18:37:32.338901
\.


--
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.exams (id, title, description, trade_id, duration_minutes, start_time, end_time, total_marks, passing_marks, total_questions, shuffle_questions, shuffle_options, show_results_immediately, allow_review, status, instructions, created_by, created_at, updated_at) FROM stdin;
1	AP ITI IoT Technician (Smart City) Annual Examination 2025	Annual examination for IoT Technician (Smart City) trade students	1	120	2025-10-26 18:37:32.207366	2025-11-25 18:37:32.207367	40	16	10	f	f	f	t	PUBLISHED	\n## IoT Technician (Smart City) Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** IoT Technician (Smart City)  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.209699	2025-10-26 18:37:32.2097
2	AP ITI Blockchain Technology Annual Examination 2025	Annual examination for Blockchain Technology trade students	2	120	2025-10-26 18:37:32.221104	2025-11-25 18:37:32.221105	40	16	10	f	f	f	t	PUBLISHED	\n## Blockchain Technology Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Blockchain Technology  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.221302	2025-10-26 18:37:32.221302
3	AP ITI Computer Operator & Programming Assistant Annual Examination 2025	Annual examination for Computer Operator & Programming Assistant trade students	3	120	2025-10-26 18:37:32.229697	2025-11-25 18:37:32.229698	40	16	10	f	f	f	t	PUBLISHED	\n## Computer Operator & Programming Assistant Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Computer Operator & Programming Assistant  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.2299	2025-10-26 18:37:32.2299
4	AP ITI Electrician Annual Examination 2025	Annual examination for Electrician trade students	4	120	2025-10-26 18:37:32.237729	2025-11-25 18:37:32.237729	40	16	10	f	f	f	t	PUBLISHED	\n## Electrician Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Electrician  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.237924	2025-10-26 18:37:32.237925
5	AP ITI Fitter Annual Examination 2025	Annual examination for Fitter trade students	5	120	2025-10-26 18:37:32.246441	2025-11-25 18:37:32.246442	40	16	10	f	f	f	t	PUBLISHED	\n## Fitter Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Fitter  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.246631	2025-10-26 18:37:32.246632
6	AP ITI Welder (Gas & Electric) Annual Examination 2025	Annual examination for Welder (Gas & Electric) trade students	6	120	2025-10-26 18:37:32.254686	2025-11-25 18:37:32.254686	40	16	10	f	f	f	t	PUBLISHED	\n## Welder (Gas & Electric) Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Welder (Gas & Electric)  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.254893	2025-10-26 18:37:32.254894
7	AP ITI Mechanic Motor Vehicle Annual Examination 2025	Annual examination for Mechanic Motor Vehicle trade students	7	120	2025-10-26 18:37:32.263445	2025-11-25 18:37:32.263446	40	16	10	f	f	f	t	PUBLISHED	\n## Mechanic Motor Vehicle Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Mechanic Motor Vehicle  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.263637	2025-10-26 18:37:32.263638
8	AP ITI Plumber Annual Examination 2025	Annual examination for Plumber trade students	8	120	2025-10-26 18:37:32.271892	2025-11-25 18:37:32.271893	40	16	10	f	f	f	t	PUBLISHED	\n## Plumber Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Plumber  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.272093	2025-10-26 18:37:32.272094
9	AP ITI Carpenter Annual Examination 2025	Annual examination for Carpenter trade students	9	120	2025-10-26 18:37:32.283987	2025-11-25 18:37:32.283988	40	16	10	f	f	f	t	PUBLISHED	\n## Carpenter Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Carpenter  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.28425	2025-10-26 18:37:32.284251
10	AP ITI Electronics Mechanic Annual Examination 2025	Annual examination for Electronics Mechanic trade students	10	120	2025-10-26 18:37:32.295299	2025-11-25 18:37:32.2953	40	16	10	f	f	f	t	PUBLISHED	\n## Electronics Mechanic Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Electronics Mechanic  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.29549	2025-10-26 18:37:32.295491
11	AP ITI Refrigeration & Air Conditioning Annual Examination 2025	Annual examination for Refrigeration & Air Conditioning trade students	11	120	2025-10-26 18:37:32.301915	2025-11-25 18:37:32.301915	40	16	10	f	f	f	t	PUBLISHED	\n## Refrigeration & Air Conditioning Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Refrigeration & Air Conditioning  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.302094	2025-10-26 18:37:32.302094
12	AP ITI Draughtsman Civil Annual Examination 2025	Annual examination for Draughtsman Civil trade students	12	120	2025-10-26 18:37:32.308441	2025-11-25 18:37:32.308442	40	16	10	f	f	f	t	PUBLISHED	\n## Draughtsman Civil Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Draughtsman Civil  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.308682	2025-10-26 18:37:32.308682
13	AP ITI Machinist Annual Examination 2025	Annual examination for Machinist trade students	13	120	2025-10-26 18:37:32.31528	2025-11-25 18:37:32.315281	40	16	10	f	f	f	t	PUBLISHED	\n## Machinist Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Machinist  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.315455	2025-10-26 18:37:32.315456
14	AP ITI Tool & Die Maker Annual Examination 2025	Annual examination for Tool & Die Maker trade students	14	120	2025-10-26 18:37:32.323382	2025-11-25 18:37:32.323384	40	16	10	f	f	f	t	PUBLISHED	\n## Tool & Die Maker Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Tool & Die Maker  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.323694	2025-10-26 18:37:32.323696
15	AP ITI Painter General Annual Examination 2025	Annual examination for Painter General trade students	15	120	2025-10-26 18:37:32.333296	2025-11-25 18:37:32.333296	40	16	10	f	f	f	t	PUBLISHED	\n## Painter General Examination Instructions\n\n1. **Duration:** 120 minutes (2 hours)\n2. **Total Questions:** 10 (All mandatory)\n3. **Marking Scheme:**\n   - Correct Answer: +4 marks\n   - Wrong Answer: -1 mark (Negative marking)\n   - Unattempted: 0 marks\n\n4. **Important Guidelines:**\n   - Read each question carefully\n   - Choose the best answer\n   - You can review and change answers before submission\n   - Auto-save happens every 15 seconds\n   - Do not refresh the browser during exam\n\n**Trade:** Painter General  \n**Total Marks:** 40  \n**Passing Marks:** 16 (40%)\n\n**Best of luck!**\n                    	1	2025-10-26 18:37:32.333475	2025-10-26 18:37:32.333476
\.


--
-- Data for Name: grading_feedback; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.grading_feedback (id, answer_id, rubric_id, graded_by, comments, total_score, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: proctoring_events; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.proctoring_events (id, attempt_id, event_type, event_timestamp, question_id, event_data, user_agent, ip_address, severity, created_at) FROM stdin;
\.


--
-- Data for Name: question_banks; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.question_banks (id, name, description, trade_id, is_active, created_at, updated_at) FROM stdin;
1	IoT Technician (Smart City) Question Bank	Questions for IoT Technician (Smart City) trade	1	t	2025-10-26 18:37:32.116614	2025-10-26 18:37:32.116616
2	Blockchain Technology Question Bank	Questions for Blockchain Technology trade	2	t	2025-10-26 18:37:32.118095	2025-10-26 18:37:32.118096
3	Computer Operator & Programming Assistant Question Bank	Questions for Computer Operator & Programming Assistant trade	3	t	2025-10-26 18:37:32.119156	2025-10-26 18:37:32.119158
4	Electrician Question Bank	Questions for Electrician trade	4	t	2025-10-26 18:37:32.120175	2025-10-26 18:37:32.120176
5	Fitter Question Bank	Questions for Fitter trade	5	t	2025-10-26 18:37:32.121223	2025-10-26 18:37:32.121224
6	Welder (Gas & Electric) Question Bank	Questions for Welder (Gas & Electric) trade	6	t	2025-10-26 18:37:32.122275	2025-10-26 18:37:32.122277
7	Mechanic Motor Vehicle Question Bank	Questions for Mechanic Motor Vehicle trade	7	t	2025-10-26 18:37:32.123471	2025-10-26 18:37:32.123472
8	Plumber Question Bank	Questions for Plumber trade	8	t	2025-10-26 18:37:32.124593	2025-10-26 18:37:32.124596
9	Carpenter Question Bank	Questions for Carpenter trade	9	t	2025-10-26 18:37:32.125758	2025-10-26 18:37:32.12576
10	Electronics Mechanic Question Bank	Questions for Electronics Mechanic trade	10	t	2025-10-26 18:37:32.126815	2025-10-26 18:37:32.126817
11	Refrigeration & Air Conditioning Question Bank	Questions for Refrigeration & Air Conditioning trade	11	t	2025-10-26 18:37:32.127829	2025-10-26 18:37:32.12783
12	Draughtsman Civil Question Bank	Questions for Draughtsman Civil trade	12	t	2025-10-26 18:37:32.128807	2025-10-26 18:37:32.128808
13	Machinist Question Bank	Questions for Machinist trade	13	t	2025-10-26 18:37:32.129814	2025-10-26 18:37:32.129815
14	Tool & Die Maker Question Bank	Questions for Tool & Die Maker trade	14	t	2025-10-26 18:37:32.130801	2025-10-26 18:37:32.130802
15	Painter General Question Bank	Questions for Painter General trade	15	t	2025-10-26 18:37:32.131786	2025-10-26 18:37:32.131787
\.


--
-- Data for Name: question_rubrics; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.question_rubrics (id, question_id, rubric_id, is_required, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: question_timings; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.question_timings (id, attempt_id, question_id, first_viewed_at, last_viewed_at, total_time_seconds, answer_count, first_answered_at, last_answered_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.questions (id, question_bank_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, negative_marks, tags, is_active, created_at, updated_at) FROM stdin;
1	1	IoT Technician (Smart City) - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q1", "B": "Option B for IoT Technician (Smart City) Q1 (Correct)", "C": "Option C for IoT Technician (Smart City) Q1", "D": "Option D for IoT Technician (Smart City) Q1"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.136295	2025-10-26 18:37:32.136297
2	1	IoT Technician (Smart City) - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q2", "B": "Option B for IoT Technician (Smart City) Q2 (Correct)", "C": "Option C for IoT Technician (Smart City) Q2", "D": "Option D for IoT Technician (Smart City) Q2"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.137486	2025-10-26 18:37:32.137487
3	1	IoT Technician (Smart City) - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q3", "B": "Option B for IoT Technician (Smart City) Q3 (Correct)", "C": "Option C for IoT Technician (Smart City) Q3", "D": "Option D for IoT Technician (Smart City) Q3"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.137969	2025-10-26 18:37:32.13797
4	1	IoT Technician (Smart City) - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q4", "B": "Option B for IoT Technician (Smart City) Q4 (Correct)", "C": "Option C for IoT Technician (Smart City) Q4", "D": "Option D for IoT Technician (Smart City) Q4"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.13834	2025-10-26 18:37:32.13834
5	1	IoT Technician (Smart City) - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q5", "B": "Option B for IoT Technician (Smart City) Q5 (Correct)", "C": "Option C for IoT Technician (Smart City) Q5", "D": "Option D for IoT Technician (Smart City) Q5"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.138707	2025-10-26 18:37:32.138707
6	1	IoT Technician (Smart City) - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q6", "B": "Option B for IoT Technician (Smart City) Q6 (Correct)", "C": "Option C for IoT Technician (Smart City) Q6", "D": "Option D for IoT Technician (Smart City) Q6"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.139046	2025-10-26 18:37:32.139046
7	1	IoT Technician (Smart City) - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q7", "B": "Option B for IoT Technician (Smart City) Q7 (Correct)", "C": "Option C for IoT Technician (Smart City) Q7", "D": "Option D for IoT Technician (Smart City) Q7"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.139365	2025-10-26 18:37:32.139365
8	1	IoT Technician (Smart City) - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q8", "B": "Option B for IoT Technician (Smart City) Q8 (Correct)", "C": "Option C for IoT Technician (Smart City) Q8", "D": "Option D for IoT Technician (Smart City) Q8"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.139669	2025-10-26 18:37:32.13967
9	1	IoT Technician (Smart City) - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q9", "B": "Option B for IoT Technician (Smart City) Q9 (Correct)", "C": "Option C for IoT Technician (Smart City) Q9", "D": "Option D for IoT Technician (Smart City) Q9"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.139986	2025-10-26 18:37:32.139986
10	1	IoT Technician (Smart City) - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q10", "B": "Option B for IoT Technician (Smart City) Q10 (Correct)", "C": "Option C for IoT Technician (Smart City) Q10", "D": "Option D for IoT Technician (Smart City) Q10"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.140326	2025-10-26 18:37:32.140326
11	2	Blockchain Technology - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q1", "B": "Option B for Blockchain Technology Q1 (Correct)", "C": "Option C for Blockchain Technology Q1", "D": "Option D for Blockchain Technology Q1"}	["B"]	Correct answer is B for Blockchain Technology question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.141478	2025-10-26 18:37:32.141479
12	2	Blockchain Technology - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q2", "B": "Option B for Blockchain Technology Q2 (Correct)", "C": "Option C for Blockchain Technology Q2", "D": "Option D for Blockchain Technology Q2"}	["B"]	Correct answer is B for Blockchain Technology question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.141922	2025-10-26 18:37:32.141923
13	2	Blockchain Technology - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q3", "B": "Option B for Blockchain Technology Q3 (Correct)", "C": "Option C for Blockchain Technology Q3", "D": "Option D for Blockchain Technology Q3"}	["B"]	Correct answer is B for Blockchain Technology question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.142249	2025-10-26 18:37:32.14225
14	2	Blockchain Technology - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q4", "B": "Option B for Blockchain Technology Q4 (Correct)", "C": "Option C for Blockchain Technology Q4", "D": "Option D for Blockchain Technology Q4"}	["B"]	Correct answer is B for Blockchain Technology question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.142543	2025-10-26 18:37:32.142544
15	2	Blockchain Technology - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q5", "B": "Option B for Blockchain Technology Q5 (Correct)", "C": "Option C for Blockchain Technology Q5", "D": "Option D for Blockchain Technology Q5"}	["B"]	Correct answer is B for Blockchain Technology question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.142836	2025-10-26 18:37:32.142837
16	2	Blockchain Technology - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q6", "B": "Option B for Blockchain Technology Q6 (Correct)", "C": "Option C for Blockchain Technology Q6", "D": "Option D for Blockchain Technology Q6"}	["B"]	Correct answer is B for Blockchain Technology question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.143112	2025-10-26 18:37:32.143113
89	9	Carpenter - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q9", "B": "Option B for Carpenter Q9 (Correct)", "C": "Option C for Carpenter Q9", "D": "Option D for Carpenter Q9"}	["B"]	Correct answer is B for Carpenter question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.172646	2025-10-26 18:37:32.172646
17	2	Blockchain Technology - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q7", "B": "Option B for Blockchain Technology Q7 (Correct)", "C": "Option C for Blockchain Technology Q7", "D": "Option D for Blockchain Technology Q7"}	["B"]	Correct answer is B for Blockchain Technology question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.143569	2025-10-26 18:37:32.14357
18	2	Blockchain Technology - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q8", "B": "Option B for Blockchain Technology Q8 (Correct)", "C": "Option C for Blockchain Technology Q8", "D": "Option D for Blockchain Technology Q8"}	["B"]	Correct answer is B for Blockchain Technology question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.14411	2025-10-26 18:37:32.144111
19	2	Blockchain Technology - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q9", "B": "Option B for Blockchain Technology Q9 (Correct)", "C": "Option C for Blockchain Technology Q9", "D": "Option D for Blockchain Technology Q9"}	["B"]	Correct answer is B for Blockchain Technology question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.144512	2025-10-26 18:37:32.144513
20	2	Blockchain Technology - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q10", "B": "Option B for Blockchain Technology Q10 (Correct)", "C": "Option C for Blockchain Technology Q10", "D": "Option D for Blockchain Technology Q10"}	["B"]	Correct answer is B for Blockchain Technology question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.144901	2025-10-26 18:37:32.144902
21	3	Computer Operator & Programming Assistant - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q1", "B": "Option B for Computer Operator & Programming Assistant Q1 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q1", "D": "Option D for Computer Operator & Programming Assistant Q1"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.146012	2025-10-26 18:37:32.146013
22	3	Computer Operator & Programming Assistant - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q2", "B": "Option B for Computer Operator & Programming Assistant Q2 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q2", "D": "Option D for Computer Operator & Programming Assistant Q2"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.146419	2025-10-26 18:37:32.14642
23	3	Computer Operator & Programming Assistant - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q3", "B": "Option B for Computer Operator & Programming Assistant Q3 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q3", "D": "Option D for Computer Operator & Programming Assistant Q3"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.146822	2025-10-26 18:37:32.146823
24	3	Computer Operator & Programming Assistant - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q4", "B": "Option B for Computer Operator & Programming Assistant Q4 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q4", "D": "Option D for Computer Operator & Programming Assistant Q4"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.147283	2025-10-26 18:37:32.147285
25	3	Computer Operator & Programming Assistant - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q5", "B": "Option B for Computer Operator & Programming Assistant Q5 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q5", "D": "Option D for Computer Operator & Programming Assistant Q5"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.147733	2025-10-26 18:37:32.147735
26	3	Computer Operator & Programming Assistant - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q6", "B": "Option B for Computer Operator & Programming Assistant Q6 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q6", "D": "Option D for Computer Operator & Programming Assistant Q6"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.148281	2025-10-26 18:37:32.148283
27	3	Computer Operator & Programming Assistant - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q7", "B": "Option B for Computer Operator & Programming Assistant Q7 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q7", "D": "Option D for Computer Operator & Programming Assistant Q7"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.148763	2025-10-26 18:37:32.148765
28	3	Computer Operator & Programming Assistant - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q8", "B": "Option B for Computer Operator & Programming Assistant Q8 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q8", "D": "Option D for Computer Operator & Programming Assistant Q8"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.149255	2025-10-26 18:37:32.149256
29	3	Computer Operator & Programming Assistant - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q9", "B": "Option B for Computer Operator & Programming Assistant Q9 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q9", "D": "Option D for Computer Operator & Programming Assistant Q9"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.149679	2025-10-26 18:37:32.14968
30	3	Computer Operator & Programming Assistant - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q10", "B": "Option B for Computer Operator & Programming Assistant Q10 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q10", "D": "Option D for Computer Operator & Programming Assistant Q10"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.150018	2025-10-26 18:37:32.150019
31	4	Electrician - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q1", "B": "Option B for Electrician Q1 (Correct)", "C": "Option C for Electrician Q1", "D": "Option D for Electrician Q1"}	["B"]	Correct answer is B for Electrician question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.151083	2025-10-26 18:37:32.151084
32	4	Electrician - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q2", "B": "Option B for Electrician Q2 (Correct)", "C": "Option C for Electrician Q2", "D": "Option D for Electrician Q2"}	["B"]	Correct answer is B for Electrician question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.151467	2025-10-26 18:37:32.151468
33	4	Electrician - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q3", "B": "Option B for Electrician Q3 (Correct)", "C": "Option C for Electrician Q3", "D": "Option D for Electrician Q3"}	["B"]	Correct answer is B for Electrician question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.151833	2025-10-26 18:37:32.151834
34	4	Electrician - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q4", "B": "Option B for Electrician Q4 (Correct)", "C": "Option C for Electrician Q4", "D": "Option D for Electrician Q4"}	["B"]	Correct answer is B for Electrician question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.152147	2025-10-26 18:37:32.152148
35	4	Electrician - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q5", "B": "Option B for Electrician Q5 (Correct)", "C": "Option C for Electrician Q5", "D": "Option D for Electrician Q5"}	["B"]	Correct answer is B for Electrician question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.152451	2025-10-26 18:37:32.152452
36	4	Electrician - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q6", "B": "Option B for Electrician Q6 (Correct)", "C": "Option C for Electrician Q6", "D": "Option D for Electrician Q6"}	["B"]	Correct answer is B for Electrician question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.152749	2025-10-26 18:37:32.152754
37	4	Electrician - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q7", "B": "Option B for Electrician Q7 (Correct)", "C": "Option C for Electrician Q7", "D": "Option D for Electrician Q7"}	["B"]	Correct answer is B for Electrician question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.153073	2025-10-26 18:37:32.153074
38	4	Electrician - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q8", "B": "Option B for Electrician Q8 (Correct)", "C": "Option C for Electrician Q8", "D": "Option D for Electrician Q8"}	["B"]	Correct answer is B for Electrician question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.153362	2025-10-26 18:37:32.153363
39	4	Electrician - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q9", "B": "Option B for Electrician Q9 (Correct)", "C": "Option C for Electrician Q9", "D": "Option D for Electrician Q9"}	["B"]	Correct answer is B for Electrician question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.153635	2025-10-26 18:37:32.153636
40	4	Electrician - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q10", "B": "Option B for Electrician Q10 (Correct)", "C": "Option C for Electrician Q10", "D": "Option D for Electrician Q10"}	["B"]	Correct answer is B for Electrician question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.153916	2025-10-26 18:37:32.153916
41	5	Fitter - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q1", "B": "Option B for Fitter Q1 (Correct)", "C": "Option C for Fitter Q1", "D": "Option D for Fitter Q1"}	["B"]	Correct answer is B for Fitter question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.154842	2025-10-26 18:37:32.154843
42	5	Fitter - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q2", "B": "Option B for Fitter Q2 (Correct)", "C": "Option C for Fitter Q2", "D": "Option D for Fitter Q2"}	["B"]	Correct answer is B for Fitter question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.15522	2025-10-26 18:37:32.155221
43	5	Fitter - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q3", "B": "Option B for Fitter Q3 (Correct)", "C": "Option C for Fitter Q3", "D": "Option D for Fitter Q3"}	["B"]	Correct answer is B for Fitter question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.155546	2025-10-26 18:37:32.155546
44	5	Fitter - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q4", "B": "Option B for Fitter Q4 (Correct)", "C": "Option C for Fitter Q4", "D": "Option D for Fitter Q4"}	["B"]	Correct answer is B for Fitter question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.155866	2025-10-26 18:37:32.155867
45	5	Fitter - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q5", "B": "Option B for Fitter Q5 (Correct)", "C": "Option C for Fitter Q5", "D": "Option D for Fitter Q5"}	["B"]	Correct answer is B for Fitter question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.156182	2025-10-26 18:37:32.156183
46	5	Fitter - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q6", "B": "Option B for Fitter Q6 (Correct)", "C": "Option C for Fitter Q6", "D": "Option D for Fitter Q6"}	["B"]	Correct answer is B for Fitter question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.156494	2025-10-26 18:37:32.156495
47	5	Fitter - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q7", "B": "Option B for Fitter Q7 (Correct)", "C": "Option C for Fitter Q7", "D": "Option D for Fitter Q7"}	["B"]	Correct answer is B for Fitter question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.156802	2025-10-26 18:37:32.156803
48	5	Fitter - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q8", "B": "Option B for Fitter Q8 (Correct)", "C": "Option C for Fitter Q8", "D": "Option D for Fitter Q8"}	["B"]	Correct answer is B for Fitter question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.157111	2025-10-26 18:37:32.157112
49	5	Fitter - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q9", "B": "Option B for Fitter Q9 (Correct)", "C": "Option C for Fitter Q9", "D": "Option D for Fitter Q9"}	["B"]	Correct answer is B for Fitter question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.157411	2025-10-26 18:37:32.157412
50	5	Fitter - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q10", "B": "Option B for Fitter Q10 (Correct)", "C": "Option C for Fitter Q10", "D": "Option D for Fitter Q10"}	["B"]	Correct answer is B for Fitter question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.157692	2025-10-26 18:37:32.157692
51	6	Welder (Gas & Electric) - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q1", "B": "Option B for Welder (Gas & Electric) Q1 (Correct)", "C": "Option C for Welder (Gas & Electric) Q1", "D": "Option D for Welder (Gas & Electric) Q1"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.159139	2025-10-26 18:37:32.159142
52	6	Welder (Gas & Electric) - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q2", "B": "Option B for Welder (Gas & Electric) Q2 (Correct)", "C": "Option C for Welder (Gas & Electric) Q2", "D": "Option D for Welder (Gas & Electric) Q2"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.159711	2025-10-26 18:37:32.159712
53	6	Welder (Gas & Electric) - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q3", "B": "Option B for Welder (Gas & Electric) Q3 (Correct)", "C": "Option C for Welder (Gas & Electric) Q3", "D": "Option D for Welder (Gas & Electric) Q3"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.160157	2025-10-26 18:37:32.160157
54	6	Welder (Gas & Electric) - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q4", "B": "Option B for Welder (Gas & Electric) Q4 (Correct)", "C": "Option C for Welder (Gas & Electric) Q4", "D": "Option D for Welder (Gas & Electric) Q4"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.160463	2025-10-26 18:37:32.160464
55	6	Welder (Gas & Electric) - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q5", "B": "Option B for Welder (Gas & Electric) Q5 (Correct)", "C": "Option C for Welder (Gas & Electric) Q5", "D": "Option D for Welder (Gas & Electric) Q5"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.160758	2025-10-26 18:37:32.160758
56	6	Welder (Gas & Electric) - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q6", "B": "Option B for Welder (Gas & Electric) Q6 (Correct)", "C": "Option C for Welder (Gas & Electric) Q6", "D": "Option D for Welder (Gas & Electric) Q6"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.161053	2025-10-26 18:37:32.161053
57	6	Welder (Gas & Electric) - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q7", "B": "Option B for Welder (Gas & Electric) Q7 (Correct)", "C": "Option C for Welder (Gas & Electric) Q7", "D": "Option D for Welder (Gas & Electric) Q7"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.161338	2025-10-26 18:37:32.161339
58	6	Welder (Gas & Electric) - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q8", "B": "Option B for Welder (Gas & Electric) Q8 (Correct)", "C": "Option C for Welder (Gas & Electric) Q8", "D": "Option D for Welder (Gas & Electric) Q8"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.161606	2025-10-26 18:37:32.161606
59	6	Welder (Gas & Electric) - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q9", "B": "Option B for Welder (Gas & Electric) Q9 (Correct)", "C": "Option C for Welder (Gas & Electric) Q9", "D": "Option D for Welder (Gas & Electric) Q9"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.161883	2025-10-26 18:37:32.161883
60	6	Welder (Gas & Electric) - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q10", "B": "Option B for Welder (Gas & Electric) Q10 (Correct)", "C": "Option C for Welder (Gas & Electric) Q10", "D": "Option D for Welder (Gas & Electric) Q10"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.162151	2025-10-26 18:37:32.162152
61	7	Mechanic Motor Vehicle - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q1", "B": "Option B for Mechanic Motor Vehicle Q1 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q1", "D": "Option D for Mechanic Motor Vehicle Q1"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.163088	2025-10-26 18:37:32.163089
62	7	Mechanic Motor Vehicle - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q2", "B": "Option B for Mechanic Motor Vehicle Q2 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q2", "D": "Option D for Mechanic Motor Vehicle Q2"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.16341	2025-10-26 18:37:32.16341
63	7	Mechanic Motor Vehicle - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q3", "B": "Option B for Mechanic Motor Vehicle Q3 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q3", "D": "Option D for Mechanic Motor Vehicle Q3"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.163709	2025-10-26 18:37:32.16371
64	7	Mechanic Motor Vehicle - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q4", "B": "Option B for Mechanic Motor Vehicle Q4 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q4", "D": "Option D for Mechanic Motor Vehicle Q4"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.164	2025-10-26 18:37:32.164001
65	7	Mechanic Motor Vehicle - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q5", "B": "Option B for Mechanic Motor Vehicle Q5 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q5", "D": "Option D for Mechanic Motor Vehicle Q5"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.164289	2025-10-26 18:37:32.16429
66	7	Mechanic Motor Vehicle - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q6", "B": "Option B for Mechanic Motor Vehicle Q6 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q6", "D": "Option D for Mechanic Motor Vehicle Q6"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.164565	2025-10-26 18:37:32.164566
67	7	Mechanic Motor Vehicle - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q7", "B": "Option B for Mechanic Motor Vehicle Q7 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q7", "D": "Option D for Mechanic Motor Vehicle Q7"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.164865	2025-10-26 18:37:32.164866
68	7	Mechanic Motor Vehicle - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q8", "B": "Option B for Mechanic Motor Vehicle Q8 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q8", "D": "Option D for Mechanic Motor Vehicle Q8"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.165147	2025-10-26 18:37:32.165147
69	7	Mechanic Motor Vehicle - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q9", "B": "Option B for Mechanic Motor Vehicle Q9 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q9", "D": "Option D for Mechanic Motor Vehicle Q9"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.165423	2025-10-26 18:37:32.165424
70	7	Mechanic Motor Vehicle - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q10", "B": "Option B for Mechanic Motor Vehicle Q10 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q10", "D": "Option D for Mechanic Motor Vehicle Q10"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.165733	2025-10-26 18:37:32.165734
71	8	Plumber - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q1", "B": "Option B for Plumber Q1 (Correct)", "C": "Option C for Plumber Q1", "D": "Option D for Plumber Q1"}	["B"]	Correct answer is B for Plumber question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.166782	2025-10-26 18:37:32.166783
72	8	Plumber - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q2", "B": "Option B for Plumber Q2 (Correct)", "C": "Option C for Plumber Q2", "D": "Option D for Plumber Q2"}	["B"]	Correct answer is B for Plumber question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.167116	2025-10-26 18:37:32.167116
73	8	Plumber - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q3", "B": "Option B for Plumber Q3 (Correct)", "C": "Option C for Plumber Q3", "D": "Option D for Plumber Q3"}	["B"]	Correct answer is B for Plumber question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.167441	2025-10-26 18:37:32.167442
74	8	Plumber - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q4", "B": "Option B for Plumber Q4 (Correct)", "C": "Option C for Plumber Q4", "D": "Option D for Plumber Q4"}	["B"]	Correct answer is B for Plumber question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.167732	2025-10-26 18:37:32.167733
75	8	Plumber - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q5", "B": "Option B for Plumber Q5 (Correct)", "C": "Option C for Plumber Q5", "D": "Option D for Plumber Q5"}	["B"]	Correct answer is B for Plumber question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.168042	2025-10-26 18:37:32.168043
76	8	Plumber - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q6", "B": "Option B for Plumber Q6 (Correct)", "C": "Option C for Plumber Q6", "D": "Option D for Plumber Q6"}	["B"]	Correct answer is B for Plumber question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.168333	2025-10-26 18:37:32.168334
77	8	Plumber - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q7", "B": "Option B for Plumber Q7 (Correct)", "C": "Option C for Plumber Q7", "D": "Option D for Plumber Q7"}	["B"]	Correct answer is B for Plumber question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.168609	2025-10-26 18:37:32.168609
78	8	Plumber - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q8", "B": "Option B for Plumber Q8 (Correct)", "C": "Option C for Plumber Q8", "D": "Option D for Plumber Q8"}	["B"]	Correct answer is B for Plumber question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.168894	2025-10-26 18:37:32.168895
79	8	Plumber - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q9", "B": "Option B for Plumber Q9 (Correct)", "C": "Option C for Plumber Q9", "D": "Option D for Plumber Q9"}	["B"]	Correct answer is B for Plumber question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.169176	2025-10-26 18:37:32.169177
80	8	Plumber - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q10", "B": "Option B for Plumber Q10 (Correct)", "C": "Option C for Plumber Q10", "D": "Option D for Plumber Q10"}	["B"]	Correct answer is B for Plumber question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.169458	2025-10-26 18:37:32.169458
81	9	Carpenter - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q1", "B": "Option B for Carpenter Q1 (Correct)", "C": "Option C for Carpenter Q1", "D": "Option D for Carpenter Q1"}	["B"]	Correct answer is B for Carpenter question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.170318	2025-10-26 18:37:32.170319
82	9	Carpenter - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q2", "B": "Option B for Carpenter Q2 (Correct)", "C": "Option C for Carpenter Q2", "D": "Option D for Carpenter Q2"}	["B"]	Correct answer is B for Carpenter question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.170648	2025-10-26 18:37:32.170648
83	9	Carpenter - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q3", "B": "Option B for Carpenter Q3 (Correct)", "C": "Option C for Carpenter Q3", "D": "Option D for Carpenter Q3"}	["B"]	Correct answer is B for Carpenter question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.170943	2025-10-26 18:37:32.170943
84	9	Carpenter - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q4", "B": "Option B for Carpenter Q4 (Correct)", "C": "Option C for Carpenter Q4", "D": "Option D for Carpenter Q4"}	["B"]	Correct answer is B for Carpenter question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.171227	2025-10-26 18:37:32.171228
85	9	Carpenter - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q5", "B": "Option B for Carpenter Q5 (Correct)", "C": "Option C for Carpenter Q5", "D": "Option D for Carpenter Q5"}	["B"]	Correct answer is B for Carpenter question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.171521	2025-10-26 18:37:32.171521
86	9	Carpenter - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q6", "B": "Option B for Carpenter Q6 (Correct)", "C": "Option C for Carpenter Q6", "D": "Option D for Carpenter Q6"}	["B"]	Correct answer is B for Carpenter question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.17181	2025-10-26 18:37:32.171811
87	9	Carpenter - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q7", "B": "Option B for Carpenter Q7 (Correct)", "C": "Option C for Carpenter Q7", "D": "Option D for Carpenter Q7"}	["B"]	Correct answer is B for Carpenter question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.172078	2025-10-26 18:37:32.172078
88	9	Carpenter - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q8", "B": "Option B for Carpenter Q8 (Correct)", "C": "Option C for Carpenter Q8", "D": "Option D for Carpenter Q8"}	["B"]	Correct answer is B for Carpenter question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.172365	2025-10-26 18:37:32.172366
90	9	Carpenter - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q10", "B": "Option B for Carpenter Q10 (Correct)", "C": "Option C for Carpenter Q10", "D": "Option D for Carpenter Q10"}	["B"]	Correct answer is B for Carpenter question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.173084	2025-10-26 18:37:32.173085
91	10	Electronics Mechanic - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q1", "B": "Option B for Electronics Mechanic Q1 (Correct)", "C": "Option C for Electronics Mechanic Q1", "D": "Option D for Electronics Mechanic Q1"}	["B"]	Correct answer is B for Electronics Mechanic question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.174289	2025-10-26 18:37:32.17429
92	10	Electronics Mechanic - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q2", "B": "Option B for Electronics Mechanic Q2 (Correct)", "C": "Option C for Electronics Mechanic Q2", "D": "Option D for Electronics Mechanic Q2"}	["B"]	Correct answer is B for Electronics Mechanic question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.174739	2025-10-26 18:37:32.17474
93	10	Electronics Mechanic - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q3", "B": "Option B for Electronics Mechanic Q3 (Correct)", "C": "Option C for Electronics Mechanic Q3", "D": "Option D for Electronics Mechanic Q3"}	["B"]	Correct answer is B for Electronics Mechanic question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.175241	2025-10-26 18:37:32.175242
94	10	Electronics Mechanic - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q4", "B": "Option B for Electronics Mechanic Q4 (Correct)", "C": "Option C for Electronics Mechanic Q4", "D": "Option D for Electronics Mechanic Q4"}	["B"]	Correct answer is B for Electronics Mechanic question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.175682	2025-10-26 18:37:32.175684
95	10	Electronics Mechanic - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q5", "B": "Option B for Electronics Mechanic Q5 (Correct)", "C": "Option C for Electronics Mechanic Q5", "D": "Option D for Electronics Mechanic Q5"}	["B"]	Correct answer is B for Electronics Mechanic question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.176171	2025-10-26 18:37:32.176172
96	10	Electronics Mechanic - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q6", "B": "Option B for Electronics Mechanic Q6 (Correct)", "C": "Option C for Electronics Mechanic Q6", "D": "Option D for Electronics Mechanic Q6"}	["B"]	Correct answer is B for Electronics Mechanic question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.176576	2025-10-26 18:37:32.176577
97	10	Electronics Mechanic - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q7", "B": "Option B for Electronics Mechanic Q7 (Correct)", "C": "Option C for Electronics Mechanic Q7", "D": "Option D for Electronics Mechanic Q7"}	["B"]	Correct answer is B for Electronics Mechanic question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.176963	2025-10-26 18:37:32.176964
98	10	Electronics Mechanic - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q8", "B": "Option B for Electronics Mechanic Q8 (Correct)", "C": "Option C for Electronics Mechanic Q8", "D": "Option D for Electronics Mechanic Q8"}	["B"]	Correct answer is B for Electronics Mechanic question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.177342	2025-10-26 18:37:32.177343
99	10	Electronics Mechanic - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q9", "B": "Option B for Electronics Mechanic Q9 (Correct)", "C": "Option C for Electronics Mechanic Q9", "D": "Option D for Electronics Mechanic Q9"}	["B"]	Correct answer is B for Electronics Mechanic question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.177713	2025-10-26 18:37:32.177714
100	10	Electronics Mechanic - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q10", "B": "Option B for Electronics Mechanic Q10 (Correct)", "C": "Option C for Electronics Mechanic Q10", "D": "Option D for Electronics Mechanic Q10"}	["B"]	Correct answer is B for Electronics Mechanic question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.178112	2025-10-26 18:37:32.178113
101	11	Refrigeration & Air Conditioning - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q1", "B": "Option B for Refrigeration & Air Conditioning Q1 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q1", "D": "Option D for Refrigeration & Air Conditioning Q1"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.179291	2025-10-26 18:37:32.179292
102	11	Refrigeration & Air Conditioning - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q2", "B": "Option B for Refrigeration & Air Conditioning Q2 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q2", "D": "Option D for Refrigeration & Air Conditioning Q2"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.179719	2025-10-26 18:37:32.17972
103	11	Refrigeration & Air Conditioning - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q3", "B": "Option B for Refrigeration & Air Conditioning Q3 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q3", "D": "Option D for Refrigeration & Air Conditioning Q3"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.18015	2025-10-26 18:37:32.180151
104	11	Refrigeration & Air Conditioning - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q4", "B": "Option B for Refrigeration & Air Conditioning Q4 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q4", "D": "Option D for Refrigeration & Air Conditioning Q4"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.180555	2025-10-26 18:37:32.180556
105	11	Refrigeration & Air Conditioning - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q5", "B": "Option B for Refrigeration & Air Conditioning Q5 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q5", "D": "Option D for Refrigeration & Air Conditioning Q5"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.180949	2025-10-26 18:37:32.18095
106	11	Refrigeration & Air Conditioning - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q6", "B": "Option B for Refrigeration & Air Conditioning Q6 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q6", "D": "Option D for Refrigeration & Air Conditioning Q6"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.181342	2025-10-26 18:37:32.181342
107	11	Refrigeration & Air Conditioning - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q7", "B": "Option B for Refrigeration & Air Conditioning Q7 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q7", "D": "Option D for Refrigeration & Air Conditioning Q7"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.181726	2025-10-26 18:37:32.181727
108	11	Refrigeration & Air Conditioning - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q8", "B": "Option B for Refrigeration & Air Conditioning Q8 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q8", "D": "Option D for Refrigeration & Air Conditioning Q8"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.182158	2025-10-26 18:37:32.182159
109	11	Refrigeration & Air Conditioning - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q9", "B": "Option B for Refrigeration & Air Conditioning Q9 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q9", "D": "Option D for Refrigeration & Air Conditioning Q9"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.18255	2025-10-26 18:37:32.182551
110	11	Refrigeration & Air Conditioning - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q10", "B": "Option B for Refrigeration & Air Conditioning Q10 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q10", "D": "Option D for Refrigeration & Air Conditioning Q10"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.182939	2025-10-26 18:37:32.18294
111	12	Draughtsman Civil - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q1", "B": "Option B for Draughtsman Civil Q1 (Correct)", "C": "Option C for Draughtsman Civil Q1", "D": "Option D for Draughtsman Civil Q1"}	["B"]	Correct answer is B for Draughtsman Civil question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.184062	2025-10-26 18:37:32.184063
112	12	Draughtsman Civil - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q2", "B": "Option B for Draughtsman Civil Q2 (Correct)", "C": "Option C for Draughtsman Civil Q2", "D": "Option D for Draughtsman Civil Q2"}	["B"]	Correct answer is B for Draughtsman Civil question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.184473	2025-10-26 18:37:32.184474
113	12	Draughtsman Civil - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q3", "B": "Option B for Draughtsman Civil Q3 (Correct)", "C": "Option C for Draughtsman Civil Q3", "D": "Option D for Draughtsman Civil Q3"}	["B"]	Correct answer is B for Draughtsman Civil question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.184919	2025-10-26 18:37:32.18492
114	12	Draughtsman Civil - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q4", "B": "Option B for Draughtsman Civil Q4 (Correct)", "C": "Option C for Draughtsman Civil Q4", "D": "Option D for Draughtsman Civil Q4"}	["B"]	Correct answer is B for Draughtsman Civil question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.185344	2025-10-26 18:37:32.185345
115	12	Draughtsman Civil - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q5", "B": "Option B for Draughtsman Civil Q5 (Correct)", "C": "Option C for Draughtsman Civil Q5", "D": "Option D for Draughtsman Civil Q5"}	["B"]	Correct answer is B for Draughtsman Civil question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.185742	2025-10-26 18:37:32.185743
116	12	Draughtsman Civil - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q6", "B": "Option B for Draughtsman Civil Q6 (Correct)", "C": "Option C for Draughtsman Civil Q6", "D": "Option D for Draughtsman Civil Q6"}	["B"]	Correct answer is B for Draughtsman Civil question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.18614	2025-10-26 18:37:32.186141
117	12	Draughtsman Civil - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q7", "B": "Option B for Draughtsman Civil Q7 (Correct)", "C": "Option C for Draughtsman Civil Q7", "D": "Option D for Draughtsman Civil Q7"}	["B"]	Correct answer is B for Draughtsman Civil question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.186528	2025-10-26 18:37:32.186529
118	12	Draughtsman Civil - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q8", "B": "Option B for Draughtsman Civil Q8 (Correct)", "C": "Option C for Draughtsman Civil Q8", "D": "Option D for Draughtsman Civil Q8"}	["B"]	Correct answer is B for Draughtsman Civil question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.18693	2025-10-26 18:37:32.186931
119	12	Draughtsman Civil - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q9", "B": "Option B for Draughtsman Civil Q9 (Correct)", "C": "Option C for Draughtsman Civil Q9", "D": "Option D for Draughtsman Civil Q9"}	["B"]	Correct answer is B for Draughtsman Civil question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.187326	2025-10-26 18:37:32.187327
120	12	Draughtsman Civil - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q10", "B": "Option B for Draughtsman Civil Q10 (Correct)", "C": "Option C for Draughtsman Civil Q10", "D": "Option D for Draughtsman Civil Q10"}	["B"]	Correct answer is B for Draughtsman Civil question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.18773	2025-10-26 18:37:32.18773
121	13	Machinist - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q1", "B": "Option B for Machinist Q1 (Correct)", "C": "Option C for Machinist Q1", "D": "Option D for Machinist Q1"}	["B"]	Correct answer is B for Machinist question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.188909	2025-10-26 18:37:32.18891
122	13	Machinist - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q2", "B": "Option B for Machinist Q2 (Correct)", "C": "Option C for Machinist Q2", "D": "Option D for Machinist Q2"}	["B"]	Correct answer is B for Machinist question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.18937	2025-10-26 18:37:32.189372
123	13	Machinist - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q3", "B": "Option B for Machinist Q3 (Correct)", "C": "Option C for Machinist Q3", "D": "Option D for Machinist Q3"}	["B"]	Correct answer is B for Machinist question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.189781	2025-10-26 18:37:32.189782
124	13	Machinist - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q4", "B": "Option B for Machinist Q4 (Correct)", "C": "Option C for Machinist Q4", "D": "Option D for Machinist Q4"}	["B"]	Correct answer is B for Machinist question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.190178	2025-10-26 18:37:32.190179
125	13	Machinist - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q5", "B": "Option B for Machinist Q5 (Correct)", "C": "Option C for Machinist Q5", "D": "Option D for Machinist Q5"}	["B"]	Correct answer is B for Machinist question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.190574	2025-10-26 18:37:32.190575
126	13	Machinist - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q6", "B": "Option B for Machinist Q6 (Correct)", "C": "Option C for Machinist Q6", "D": "Option D for Machinist Q6"}	["B"]	Correct answer is B for Machinist question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.191021	2025-10-26 18:37:32.191022
127	13	Machinist - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q7", "B": "Option B for Machinist Q7 (Correct)", "C": "Option C for Machinist Q7", "D": "Option D for Machinist Q7"}	["B"]	Correct answer is B for Machinist question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.191443	2025-10-26 18:37:32.191445
128	13	Machinist - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q8", "B": "Option B for Machinist Q8 (Correct)", "C": "Option C for Machinist Q8", "D": "Option D for Machinist Q8"}	["B"]	Correct answer is B for Machinist question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.191881	2025-10-26 18:37:32.191882
129	13	Machinist - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q9", "B": "Option B for Machinist Q9 (Correct)", "C": "Option C for Machinist Q9", "D": "Option D for Machinist Q9"}	["B"]	Correct answer is B for Machinist question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.192282	2025-10-26 18:37:32.192283
130	13	Machinist - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q10", "B": "Option B for Machinist Q10 (Correct)", "C": "Option C for Machinist Q10", "D": "Option D for Machinist Q10"}	["B"]	Correct answer is B for Machinist question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.192719	2025-10-26 18:37:32.192721
131	14	Tool & Die Maker - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q1", "B": "Option B for Tool & Die Maker Q1 (Correct)", "C": "Option C for Tool & Die Maker Q1", "D": "Option D for Tool & Die Maker Q1"}	["B"]	Correct answer is B for Tool & Die Maker question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.193919	2025-10-26 18:37:32.193921
132	14	Tool & Die Maker - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q2", "B": "Option B for Tool & Die Maker Q2 (Correct)", "C": "Option C for Tool & Die Maker Q2", "D": "Option D for Tool & Die Maker Q2"}	["B"]	Correct answer is B for Tool & Die Maker question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.194334	2025-10-26 18:37:32.194335
133	14	Tool & Die Maker - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q3", "B": "Option B for Tool & Die Maker Q3 (Correct)", "C": "Option C for Tool & Die Maker Q3", "D": "Option D for Tool & Die Maker Q3"}	["B"]	Correct answer is B for Tool & Die Maker question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.194725	2025-10-26 18:37:32.194726
134	14	Tool & Die Maker - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q4", "B": "Option B for Tool & Die Maker Q4 (Correct)", "C": "Option C for Tool & Die Maker Q4", "D": "Option D for Tool & Die Maker Q4"}	["B"]	Correct answer is B for Tool & Die Maker question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.195121	2025-10-26 18:37:32.195122
135	14	Tool & Die Maker - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q5", "B": "Option B for Tool & Die Maker Q5 (Correct)", "C": "Option C for Tool & Die Maker Q5", "D": "Option D for Tool & Die Maker Q5"}	["B"]	Correct answer is B for Tool & Die Maker question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.195515	2025-10-26 18:37:32.195516
136	14	Tool & Die Maker - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q6", "B": "Option B for Tool & Die Maker Q6 (Correct)", "C": "Option C for Tool & Die Maker Q6", "D": "Option D for Tool & Die Maker Q6"}	["B"]	Correct answer is B for Tool & Die Maker question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.195928	2025-10-26 18:37:32.195929
137	14	Tool & Die Maker - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q7", "B": "Option B for Tool & Die Maker Q7 (Correct)", "C": "Option C for Tool & Die Maker Q7", "D": "Option D for Tool & Die Maker Q7"}	["B"]	Correct answer is B for Tool & Die Maker question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.196328	2025-10-26 18:37:32.196329
138	14	Tool & Die Maker - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q8", "B": "Option B for Tool & Die Maker Q8 (Correct)", "C": "Option C for Tool & Die Maker Q8", "D": "Option D for Tool & Die Maker Q8"}	["B"]	Correct answer is B for Tool & Die Maker question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.19672	2025-10-26 18:37:32.196721
139	14	Tool & Die Maker - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q9", "B": "Option B for Tool & Die Maker Q9 (Correct)", "C": "Option C for Tool & Die Maker Q9", "D": "Option D for Tool & Die Maker Q9"}	["B"]	Correct answer is B for Tool & Die Maker question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.197108	2025-10-26 18:37:32.197109
140	14	Tool & Die Maker - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q10", "B": "Option B for Tool & Die Maker Q10 (Correct)", "C": "Option C for Tool & Die Maker Q10", "D": "Option D for Tool & Die Maker Q10"}	["B"]	Correct answer is B for Tool & Die Maker question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.197492	2025-10-26 18:37:32.197492
141	15	Painter General - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q1", "B": "Option B for Painter General Q1 (Correct)", "C": "Option C for Painter General Q1", "D": "Option D for Painter General Q1"}	["B"]	Correct answer is B for Painter General question 1	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.198601	2025-10-26 18:37:32.198602
142	15	Painter General - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q2", "B": "Option B for Painter General Q2 (Correct)", "C": "Option C for Painter General Q2", "D": "Option D for Painter General Q2"}	["B"]	Correct answer is B for Painter General question 2	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.19902	2025-10-26 18:37:32.199021
143	15	Painter General - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q3", "B": "Option B for Painter General Q3 (Correct)", "C": "Option C for Painter General Q3", "D": "Option D for Painter General Q3"}	["B"]	Correct answer is B for Painter General question 3	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.199431	2025-10-26 18:37:32.199432
144	15	Painter General - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q4", "B": "Option B for Painter General Q4 (Correct)", "C": "Option C for Painter General Q4", "D": "Option D for Painter General Q4"}	["B"]	Correct answer is B for Painter General question 4	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.199846	2025-10-26 18:37:32.199847
145	15	Painter General - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q5", "B": "Option B for Painter General Q5 (Correct)", "C": "Option C for Painter General Q5", "D": "Option D for Painter General Q5"}	["B"]	Correct answer is B for Painter General question 5	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.200266	2025-10-26 18:37:32.200267
146	15	Painter General - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q6", "B": "Option B for Painter General Q6 (Correct)", "C": "Option C for Painter General Q6", "D": "Option D for Painter General Q6"}	["B"]	Correct answer is B for Painter General question 6	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.200645	2025-10-26 18:37:32.200646
147	15	Painter General - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q7", "B": "Option B for Painter General Q7 (Correct)", "C": "Option C for Painter General Q7", "D": "Option D for Painter General Q7"}	["B"]	Correct answer is B for Painter General question 7	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.201021	2025-10-26 18:37:32.201022
148	15	Painter General - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q8", "B": "Option B for Painter General Q8 (Correct)", "C": "Option C for Painter General Q8", "D": "Option D for Painter General Q8"}	["B"]	Correct answer is B for Painter General question 8	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.201392	2025-10-26 18:37:32.201393
149	15	Painter General - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q9", "B": "Option B for Painter General Q9 (Correct)", "C": "Option C for Painter General Q9", "D": "Option D for Painter General Q9"}	["B"]	Correct answer is B for Painter General question 9	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.201789	2025-10-26 18:37:32.201789
150	15	Painter General - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q10", "B": "Option B for Painter General Q10 (Correct)", "C": "Option C for Painter General Q10", "D": "Option D for Painter General Q10"}	["B"]	Correct answer is B for Painter General question 10	MEDIUM	4	1	\N	t	2025-10-26 18:37:32.202188	2025-10-26 18:37:32.202189
151	1	IoT Technician (Smart City) - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q1", "B": "Option B for IoT Technician (Smart City) Q1 (Correct)", "C": "Option C for IoT Technician (Smart City) Q1", "D": "Option D for IoT Technician (Smart City) Q1"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.742686	2025-10-26 18:38:03.742689
152	1	IoT Technician (Smart City) - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q2", "B": "Option B for IoT Technician (Smart City) Q2 (Correct)", "C": "Option C for IoT Technician (Smart City) Q2", "D": "Option D for IoT Technician (Smart City) Q2"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.744591	2025-10-26 18:38:03.744593
153	1	IoT Technician (Smart City) - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q3", "B": "Option B for IoT Technician (Smart City) Q3 (Correct)", "C": "Option C for IoT Technician (Smart City) Q3", "D": "Option D for IoT Technician (Smart City) Q3"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.745154	2025-10-26 18:38:03.745155
154	1	IoT Technician (Smart City) - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q4", "B": "Option B for IoT Technician (Smart City) Q4 (Correct)", "C": "Option C for IoT Technician (Smart City) Q4", "D": "Option D for IoT Technician (Smart City) Q4"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.745634	2025-10-26 18:38:03.745635
155	1	IoT Technician (Smart City) - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q5", "B": "Option B for IoT Technician (Smart City) Q5 (Correct)", "C": "Option C for IoT Technician (Smart City) Q5", "D": "Option D for IoT Technician (Smart City) Q5"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.7461	2025-10-26 18:38:03.7461
156	1	IoT Technician (Smart City) - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q6", "B": "Option B for IoT Technician (Smart City) Q6 (Correct)", "C": "Option C for IoT Technician (Smart City) Q6", "D": "Option D for IoT Technician (Smart City) Q6"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.746505	2025-10-26 18:38:03.746505
157	1	IoT Technician (Smart City) - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q7", "B": "Option B for IoT Technician (Smart City) Q7 (Correct)", "C": "Option C for IoT Technician (Smart City) Q7", "D": "Option D for IoT Technician (Smart City) Q7"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.746894	2025-10-26 18:38:03.746895
158	1	IoT Technician (Smart City) - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q8", "B": "Option B for IoT Technician (Smart City) Q8 (Correct)", "C": "Option C for IoT Technician (Smart City) Q8", "D": "Option D for IoT Technician (Smart City) Q8"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.747253	2025-10-26 18:38:03.747253
159	1	IoT Technician (Smart City) - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q9", "B": "Option B for IoT Technician (Smart City) Q9 (Correct)", "C": "Option C for IoT Technician (Smart City) Q9", "D": "Option D for IoT Technician (Smart City) Q9"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.74813	2025-10-26 18:38:03.748134
160	1	IoT Technician (Smart City) - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for IoT Technician (Smart City) Q10", "B": "Option B for IoT Technician (Smart City) Q10 (Correct)", "C": "Option C for IoT Technician (Smart City) Q10", "D": "Option D for IoT Technician (Smart City) Q10"}	["B"]	Correct answer is B for IoT Technician (Smart City) question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.749458	2025-10-26 18:38:03.749462
161	2	Blockchain Technology - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q1", "B": "Option B for Blockchain Technology Q1 (Correct)", "C": "Option C for Blockchain Technology Q1", "D": "Option D for Blockchain Technology Q1"}	["B"]	Correct answer is B for Blockchain Technology question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.752312	2025-10-26 18:38:03.752315
162	2	Blockchain Technology - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q2", "B": "Option B for Blockchain Technology Q2 (Correct)", "C": "Option C for Blockchain Technology Q2", "D": "Option D for Blockchain Technology Q2"}	["B"]	Correct answer is B for Blockchain Technology question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.753231	2025-10-26 18:38:03.753234
163	2	Blockchain Technology - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q3", "B": "Option B for Blockchain Technology Q3 (Correct)", "C": "Option C for Blockchain Technology Q3", "D": "Option D for Blockchain Technology Q3"}	["B"]	Correct answer is B for Blockchain Technology question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.753853	2025-10-26 18:38:03.753856
164	2	Blockchain Technology - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q4", "B": "Option B for Blockchain Technology Q4 (Correct)", "C": "Option C for Blockchain Technology Q4", "D": "Option D for Blockchain Technology Q4"}	["B"]	Correct answer is B for Blockchain Technology question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.754476	2025-10-26 18:38:03.754477
165	2	Blockchain Technology - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q5", "B": "Option B for Blockchain Technology Q5 (Correct)", "C": "Option C for Blockchain Technology Q5", "D": "Option D for Blockchain Technology Q5"}	["B"]	Correct answer is B for Blockchain Technology question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.755006	2025-10-26 18:38:03.755007
166	2	Blockchain Technology - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q6", "B": "Option B for Blockchain Technology Q6 (Correct)", "C": "Option C for Blockchain Technology Q6", "D": "Option D for Blockchain Technology Q6"}	["B"]	Correct answer is B for Blockchain Technology question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.755828	2025-10-26 18:38:03.755831
167	2	Blockchain Technology - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q7", "B": "Option B for Blockchain Technology Q7 (Correct)", "C": "Option C for Blockchain Technology Q7", "D": "Option D for Blockchain Technology Q7"}	["B"]	Correct answer is B for Blockchain Technology question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.757125	2025-10-26 18:38:03.757132
168	2	Blockchain Technology - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q8", "B": "Option B for Blockchain Technology Q8 (Correct)", "C": "Option C for Blockchain Technology Q8", "D": "Option D for Blockchain Technology Q8"}	["B"]	Correct answer is B for Blockchain Technology question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.758466	2025-10-26 18:38:03.758469
169	2	Blockchain Technology - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q9", "B": "Option B for Blockchain Technology Q9 (Correct)", "C": "Option C for Blockchain Technology Q9", "D": "Option D for Blockchain Technology Q9"}	["B"]	Correct answer is B for Blockchain Technology question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.759276	2025-10-26 18:38:03.759278
170	2	Blockchain Technology - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Blockchain Technology Q10", "B": "Option B for Blockchain Technology Q10 (Correct)", "C": "Option C for Blockchain Technology Q10", "D": "Option D for Blockchain Technology Q10"}	["B"]	Correct answer is B for Blockchain Technology question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.759903	2025-10-26 18:38:03.759904
171	3	Computer Operator & Programming Assistant - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q1", "B": "Option B for Computer Operator & Programming Assistant Q1 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q1", "D": "Option D for Computer Operator & Programming Assistant Q1"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.761316	2025-10-26 18:38:03.761317
172	3	Computer Operator & Programming Assistant - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q2", "B": "Option B for Computer Operator & Programming Assistant Q2 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q2", "D": "Option D for Computer Operator & Programming Assistant Q2"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.761795	2025-10-26 18:38:03.761796
173	3	Computer Operator & Programming Assistant - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q3", "B": "Option B for Computer Operator & Programming Assistant Q3 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q3", "D": "Option D for Computer Operator & Programming Assistant Q3"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.762207	2025-10-26 18:38:03.762208
174	3	Computer Operator & Programming Assistant - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q4", "B": "Option B for Computer Operator & Programming Assistant Q4 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q4", "D": "Option D for Computer Operator & Programming Assistant Q4"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.762628	2025-10-26 18:38:03.762629
175	3	Computer Operator & Programming Assistant - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q5", "B": "Option B for Computer Operator & Programming Assistant Q5 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q5", "D": "Option D for Computer Operator & Programming Assistant Q5"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.763035	2025-10-26 18:38:03.763035
176	3	Computer Operator & Programming Assistant - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q6", "B": "Option B for Computer Operator & Programming Assistant Q6 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q6", "D": "Option D for Computer Operator & Programming Assistant Q6"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.763431	2025-10-26 18:38:03.763432
177	3	Computer Operator & Programming Assistant - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q7", "B": "Option B for Computer Operator & Programming Assistant Q7 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q7", "D": "Option D for Computer Operator & Programming Assistant Q7"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.763834	2025-10-26 18:38:03.763835
178	3	Computer Operator & Programming Assistant - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q8", "B": "Option B for Computer Operator & Programming Assistant Q8 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q8", "D": "Option D for Computer Operator & Programming Assistant Q8"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.764254	2025-10-26 18:38:03.764255
179	3	Computer Operator & Programming Assistant - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q9", "B": "Option B for Computer Operator & Programming Assistant Q9 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q9", "D": "Option D for Computer Operator & Programming Assistant Q9"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.764648	2025-10-26 18:38:03.764649
180	3	Computer Operator & Programming Assistant - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Computer Operator & Programming Assistant Q10", "B": "Option B for Computer Operator & Programming Assistant Q10 (Correct)", "C": "Option C for Computer Operator & Programming Assistant Q10", "D": "Option D for Computer Operator & Programming Assistant Q10"}	["B"]	Correct answer is B for Computer Operator & Programming Assistant question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.765068	2025-10-26 18:38:03.765069
181	4	Electrician - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q1", "B": "Option B for Electrician Q1 (Correct)", "C": "Option C for Electrician Q1", "D": "Option D for Electrician Q1"}	["B"]	Correct answer is B for Electrician question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.76653	2025-10-26 18:38:03.766536
182	4	Electrician - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q2", "B": "Option B for Electrician Q2 (Correct)", "C": "Option C for Electrician Q2", "D": "Option D for Electrician Q2"}	["B"]	Correct answer is B for Electrician question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.76711	2025-10-26 18:38:03.767112
183	4	Electrician - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q3", "B": "Option B for Electrician Q3 (Correct)", "C": "Option C for Electrician Q3", "D": "Option D for Electrician Q3"}	["B"]	Correct answer is B for Electrician question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.767594	2025-10-26 18:38:03.767595
184	4	Electrician - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q4", "B": "Option B for Electrician Q4 (Correct)", "C": "Option C for Electrician Q4", "D": "Option D for Electrician Q4"}	["B"]	Correct answer is B for Electrician question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.76804	2025-10-26 18:38:03.768041
185	4	Electrician - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q5", "B": "Option B for Electrician Q5 (Correct)", "C": "Option C for Electrician Q5", "D": "Option D for Electrician Q5"}	["B"]	Correct answer is B for Electrician question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.768461	2025-10-26 18:38:03.768462
186	4	Electrician - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q6", "B": "Option B for Electrician Q6 (Correct)", "C": "Option C for Electrician Q6", "D": "Option D for Electrician Q6"}	["B"]	Correct answer is B for Electrician question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.768898	2025-10-26 18:38:03.768899
187	4	Electrician - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q7", "B": "Option B for Electrician Q7 (Correct)", "C": "Option C for Electrician Q7", "D": "Option D for Electrician Q7"}	["B"]	Correct answer is B for Electrician question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.76935	2025-10-26 18:38:03.769351
188	4	Electrician - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q8", "B": "Option B for Electrician Q8 (Correct)", "C": "Option C for Electrician Q8", "D": "Option D for Electrician Q8"}	["B"]	Correct answer is B for Electrician question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.769803	2025-10-26 18:38:03.769804
189	4	Electrician - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q9", "B": "Option B for Electrician Q9 (Correct)", "C": "Option C for Electrician Q9", "D": "Option D for Electrician Q9"}	["B"]	Correct answer is B for Electrician question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.77024	2025-10-26 18:38:03.770242
190	4	Electrician - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electrician Q10", "B": "Option B for Electrician Q10 (Correct)", "C": "Option C for Electrician Q10", "D": "Option D for Electrician Q10"}	["B"]	Correct answer is B for Electrician question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.770702	2025-10-26 18:38:03.770703
191	5	Fitter - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q1", "B": "Option B for Fitter Q1 (Correct)", "C": "Option C for Fitter Q1", "D": "Option D for Fitter Q1"}	["B"]	Correct answer is B for Fitter question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.772068	2025-10-26 18:38:03.772069
192	5	Fitter - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q2", "B": "Option B for Fitter Q2 (Correct)", "C": "Option C for Fitter Q2", "D": "Option D for Fitter Q2"}	["B"]	Correct answer is B for Fitter question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.772598	2025-10-26 18:38:03.7726
193	5	Fitter - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q3", "B": "Option B for Fitter Q3 (Correct)", "C": "Option C for Fitter Q3", "D": "Option D for Fitter Q3"}	["B"]	Correct answer is B for Fitter question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.773152	2025-10-26 18:38:03.773155
194	5	Fitter - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q4", "B": "Option B for Fitter Q4 (Correct)", "C": "Option C for Fitter Q4", "D": "Option D for Fitter Q4"}	["B"]	Correct answer is B for Fitter question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.773763	2025-10-26 18:38:03.773765
195	5	Fitter - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q5", "B": "Option B for Fitter Q5 (Correct)", "C": "Option C for Fitter Q5", "D": "Option D for Fitter Q5"}	["B"]	Correct answer is B for Fitter question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.774281	2025-10-26 18:38:03.774282
196	5	Fitter - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q6", "B": "Option B for Fitter Q6 (Correct)", "C": "Option C for Fitter Q6", "D": "Option D for Fitter Q6"}	["B"]	Correct answer is B for Fitter question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.774801	2025-10-26 18:38:03.774802
197	5	Fitter - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q7", "B": "Option B for Fitter Q7 (Correct)", "C": "Option C for Fitter Q7", "D": "Option D for Fitter Q7"}	["B"]	Correct answer is B for Fitter question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.775369	2025-10-26 18:38:03.77537
198	5	Fitter - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q8", "B": "Option B for Fitter Q8 (Correct)", "C": "Option C for Fitter Q8", "D": "Option D for Fitter Q8"}	["B"]	Correct answer is B for Fitter question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.775847	2025-10-26 18:38:03.775848
199	5	Fitter - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q9", "B": "Option B for Fitter Q9 (Correct)", "C": "Option C for Fitter Q9", "D": "Option D for Fitter Q9"}	["B"]	Correct answer is B for Fitter question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.776315	2025-10-26 18:38:03.776316
200	5	Fitter - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Fitter Q10", "B": "Option B for Fitter Q10 (Correct)", "C": "Option C for Fitter Q10", "D": "Option D for Fitter Q10"}	["B"]	Correct answer is B for Fitter question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.776789	2025-10-26 18:38:03.77679
201	6	Welder (Gas & Electric) - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q1", "B": "Option B for Welder (Gas & Electric) Q1 (Correct)", "C": "Option C for Welder (Gas & Electric) Q1", "D": "Option D for Welder (Gas & Electric) Q1"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.778157	2025-10-26 18:38:03.778158
202	6	Welder (Gas & Electric) - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q2", "B": "Option B for Welder (Gas & Electric) Q2 (Correct)", "C": "Option C for Welder (Gas & Electric) Q2", "D": "Option D for Welder (Gas & Electric) Q2"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.778639	2025-10-26 18:38:03.77864
203	6	Welder (Gas & Electric) - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q3", "B": "Option B for Welder (Gas & Electric) Q3 (Correct)", "C": "Option C for Welder (Gas & Electric) Q3", "D": "Option D for Welder (Gas & Electric) Q3"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.779105	2025-10-26 18:38:03.779106
204	6	Welder (Gas & Electric) - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q4", "B": "Option B for Welder (Gas & Electric) Q4 (Correct)", "C": "Option C for Welder (Gas & Electric) Q4", "D": "Option D for Welder (Gas & Electric) Q4"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.779578	2025-10-26 18:38:03.779579
205	6	Welder (Gas & Electric) - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q5", "B": "Option B for Welder (Gas & Electric) Q5 (Correct)", "C": "Option C for Welder (Gas & Electric) Q5", "D": "Option D for Welder (Gas & Electric) Q5"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.780047	2025-10-26 18:38:03.780048
206	6	Welder (Gas & Electric) - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q6", "B": "Option B for Welder (Gas & Electric) Q6 (Correct)", "C": "Option C for Welder (Gas & Electric) Q6", "D": "Option D for Welder (Gas & Electric) Q6"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.780493	2025-10-26 18:38:03.780494
207	6	Welder (Gas & Electric) - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q7", "B": "Option B for Welder (Gas & Electric) Q7 (Correct)", "C": "Option C for Welder (Gas & Electric) Q7", "D": "Option D for Welder (Gas & Electric) Q7"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.780944	2025-10-26 18:38:03.780945
208	6	Welder (Gas & Electric) - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q8", "B": "Option B for Welder (Gas & Electric) Q8 (Correct)", "C": "Option C for Welder (Gas & Electric) Q8", "D": "Option D for Welder (Gas & Electric) Q8"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.781384	2025-10-26 18:38:03.781385
209	6	Welder (Gas & Electric) - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q9", "B": "Option B for Welder (Gas & Electric) Q9 (Correct)", "C": "Option C for Welder (Gas & Electric) Q9", "D": "Option D for Welder (Gas & Electric) Q9"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.781847	2025-10-26 18:38:03.781849
210	6	Welder (Gas & Electric) - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Welder (Gas & Electric) Q10", "B": "Option B for Welder (Gas & Electric) Q10 (Correct)", "C": "Option C for Welder (Gas & Electric) Q10", "D": "Option D for Welder (Gas & Electric) Q10"}	["B"]	Correct answer is B for Welder (Gas & Electric) question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.782311	2025-10-26 18:38:03.782312
211	7	Mechanic Motor Vehicle - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q1", "B": "Option B for Mechanic Motor Vehicle Q1 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q1", "D": "Option D for Mechanic Motor Vehicle Q1"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.783562	2025-10-26 18:38:03.783563
212	7	Mechanic Motor Vehicle - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q2", "B": "Option B for Mechanic Motor Vehicle Q2 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q2", "D": "Option D for Mechanic Motor Vehicle Q2"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.784032	2025-10-26 18:38:03.784034
213	7	Mechanic Motor Vehicle - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q3", "B": "Option B for Mechanic Motor Vehicle Q3 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q3", "D": "Option D for Mechanic Motor Vehicle Q3"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.784487	2025-10-26 18:38:03.784488
214	7	Mechanic Motor Vehicle - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q4", "B": "Option B for Mechanic Motor Vehicle Q4 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q4", "D": "Option D for Mechanic Motor Vehicle Q4"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.784977	2025-10-26 18:38:03.784978
215	7	Mechanic Motor Vehicle - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q5", "B": "Option B for Mechanic Motor Vehicle Q5 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q5", "D": "Option D for Mechanic Motor Vehicle Q5"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.785422	2025-10-26 18:38:03.785423
216	7	Mechanic Motor Vehicle - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q6", "B": "Option B for Mechanic Motor Vehicle Q6 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q6", "D": "Option D for Mechanic Motor Vehicle Q6"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.785864	2025-10-26 18:38:03.785865
217	7	Mechanic Motor Vehicle - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q7", "B": "Option B for Mechanic Motor Vehicle Q7 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q7", "D": "Option D for Mechanic Motor Vehicle Q7"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.786294	2025-10-26 18:38:03.786295
218	7	Mechanic Motor Vehicle - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q8", "B": "Option B for Mechanic Motor Vehicle Q8 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q8", "D": "Option D for Mechanic Motor Vehicle Q8"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.786713	2025-10-26 18:38:03.786714
219	7	Mechanic Motor Vehicle - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q9", "B": "Option B for Mechanic Motor Vehicle Q9 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q9", "D": "Option D for Mechanic Motor Vehicle Q9"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.787148	2025-10-26 18:38:03.787149
220	7	Mechanic Motor Vehicle - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Mechanic Motor Vehicle Q10", "B": "Option B for Mechanic Motor Vehicle Q10 (Correct)", "C": "Option C for Mechanic Motor Vehicle Q10", "D": "Option D for Mechanic Motor Vehicle Q10"}	["B"]	Correct answer is B for Mechanic Motor Vehicle question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.787603	2025-10-26 18:38:03.787604
221	8	Plumber - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q1", "B": "Option B for Plumber Q1 (Correct)", "C": "Option C for Plumber Q1", "D": "Option D for Plumber Q1"}	["B"]	Correct answer is B for Plumber question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.788804	2025-10-26 18:38:03.788806
222	8	Plumber - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q2", "B": "Option B for Plumber Q2 (Correct)", "C": "Option C for Plumber Q2", "D": "Option D for Plumber Q2"}	["B"]	Correct answer is B for Plumber question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.789264	2025-10-26 18:38:03.789265
223	8	Plumber - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q3", "B": "Option B for Plumber Q3 (Correct)", "C": "Option C for Plumber Q3", "D": "Option D for Plumber Q3"}	["B"]	Correct answer is B for Plumber question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.789704	2025-10-26 18:38:03.789705
224	8	Plumber - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q4", "B": "Option B for Plumber Q4 (Correct)", "C": "Option C for Plumber Q4", "D": "Option D for Plumber Q4"}	["B"]	Correct answer is B for Plumber question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.790562	2025-10-26 18:38:03.790566
225	8	Plumber - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q5", "B": "Option B for Plumber Q5 (Correct)", "C": "Option C for Plumber Q5", "D": "Option D for Plumber Q5"}	["B"]	Correct answer is B for Plumber question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.791938	2025-10-26 18:38:03.791942
226	8	Plumber - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q6", "B": "Option B for Plumber Q6 (Correct)", "C": "Option C for Plumber Q6", "D": "Option D for Plumber Q6"}	["B"]	Correct answer is B for Plumber question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.79312	2025-10-26 18:38:03.793124
227	8	Plumber - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q7", "B": "Option B for Plumber Q7 (Correct)", "C": "Option C for Plumber Q7", "D": "Option D for Plumber Q7"}	["B"]	Correct answer is B for Plumber question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.793879	2025-10-26 18:38:03.793881
228	8	Plumber - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q8", "B": "Option B for Plumber Q8 (Correct)", "C": "Option C for Plumber Q8", "D": "Option D for Plumber Q8"}	["B"]	Correct answer is B for Plumber question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.794567	2025-10-26 18:38:03.794569
229	8	Plumber - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q9", "B": "Option B for Plumber Q9 (Correct)", "C": "Option C for Plumber Q9", "D": "Option D for Plumber Q9"}	["B"]	Correct answer is B for Plumber question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.795159	2025-10-26 18:38:03.795161
230	8	Plumber - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Plumber Q10", "B": "Option B for Plumber Q10 (Correct)", "C": "Option C for Plumber Q10", "D": "Option D for Plumber Q10"}	["B"]	Correct answer is B for Plumber question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.795725	2025-10-26 18:38:03.795727
231	9	Carpenter - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q1", "B": "Option B for Carpenter Q1 (Correct)", "C": "Option C for Carpenter Q1", "D": "Option D for Carpenter Q1"}	["B"]	Correct answer is B for Carpenter question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.797154	2025-10-26 18:38:03.797156
232	9	Carpenter - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q2", "B": "Option B for Carpenter Q2 (Correct)", "C": "Option C for Carpenter Q2", "D": "Option D for Carpenter Q2"}	["B"]	Correct answer is B for Carpenter question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.797819	2025-10-26 18:38:03.797821
233	9	Carpenter - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q3", "B": "Option B for Carpenter Q3 (Correct)", "C": "Option C for Carpenter Q3", "D": "Option D for Carpenter Q3"}	["B"]	Correct answer is B for Carpenter question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.798434	2025-10-26 18:38:03.798437
234	9	Carpenter - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q4", "B": "Option B for Carpenter Q4 (Correct)", "C": "Option C for Carpenter Q4", "D": "Option D for Carpenter Q4"}	["B"]	Correct answer is B for Carpenter question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.799079	2025-10-26 18:38:03.799081
235	9	Carpenter - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q5", "B": "Option B for Carpenter Q5 (Correct)", "C": "Option C for Carpenter Q5", "D": "Option D for Carpenter Q5"}	["B"]	Correct answer is B for Carpenter question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.799583	2025-10-26 18:38:03.799584
236	9	Carpenter - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q6", "B": "Option B for Carpenter Q6 (Correct)", "C": "Option C for Carpenter Q6", "D": "Option D for Carpenter Q6"}	["B"]	Correct answer is B for Carpenter question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.80006	2025-10-26 18:38:03.800061
237	9	Carpenter - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q7", "B": "Option B for Carpenter Q7 (Correct)", "C": "Option C for Carpenter Q7", "D": "Option D for Carpenter Q7"}	["B"]	Correct answer is B for Carpenter question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.800702	2025-10-26 18:38:03.800704
238	9	Carpenter - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q8", "B": "Option B for Carpenter Q8 (Correct)", "C": "Option C for Carpenter Q8", "D": "Option D for Carpenter Q8"}	["B"]	Correct answer is B for Carpenter question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.801359	2025-10-26 18:38:03.80136
239	9	Carpenter - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q9", "B": "Option B for Carpenter Q9 (Correct)", "C": "Option C for Carpenter Q9", "D": "Option D for Carpenter Q9"}	["B"]	Correct answer is B for Carpenter question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.801956	2025-10-26 18:38:03.801958
240	9	Carpenter - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Carpenter Q10", "B": "Option B for Carpenter Q10 (Correct)", "C": "Option C for Carpenter Q10", "D": "Option D for Carpenter Q10"}	["B"]	Correct answer is B for Carpenter question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.802535	2025-10-26 18:38:03.802536
241	10	Electronics Mechanic - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q1", "B": "Option B for Electronics Mechanic Q1 (Correct)", "C": "Option C for Electronics Mechanic Q1", "D": "Option D for Electronics Mechanic Q1"}	["B"]	Correct answer is B for Electronics Mechanic question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.804287	2025-10-26 18:38:03.804289
242	10	Electronics Mechanic - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q2", "B": "Option B for Electronics Mechanic Q2 (Correct)", "C": "Option C for Electronics Mechanic Q2", "D": "Option D for Electronics Mechanic Q2"}	["B"]	Correct answer is B for Electronics Mechanic question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.805021	2025-10-26 18:38:03.805023
243	10	Electronics Mechanic - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q3", "B": "Option B for Electronics Mechanic Q3 (Correct)", "C": "Option C for Electronics Mechanic Q3", "D": "Option D for Electronics Mechanic Q3"}	["B"]	Correct answer is B for Electronics Mechanic question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.805719	2025-10-26 18:38:03.805722
244	10	Electronics Mechanic - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q4", "B": "Option B for Electronics Mechanic Q4 (Correct)", "C": "Option C for Electronics Mechanic Q4", "D": "Option D for Electronics Mechanic Q4"}	["B"]	Correct answer is B for Electronics Mechanic question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.806428	2025-10-26 18:38:03.806431
245	10	Electronics Mechanic - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q5", "B": "Option B for Electronics Mechanic Q5 (Correct)", "C": "Option C for Electronics Mechanic Q5", "D": "Option D for Electronics Mechanic Q5"}	["B"]	Correct answer is B for Electronics Mechanic question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.807187	2025-10-26 18:38:03.807189
246	10	Electronics Mechanic - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q6", "B": "Option B for Electronics Mechanic Q6 (Correct)", "C": "Option C for Electronics Mechanic Q6", "D": "Option D for Electronics Mechanic Q6"}	["B"]	Correct answer is B for Electronics Mechanic question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.80784	2025-10-26 18:38:03.807842
247	10	Electronics Mechanic - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q7", "B": "Option B for Electronics Mechanic Q7 (Correct)", "C": "Option C for Electronics Mechanic Q7", "D": "Option D for Electronics Mechanic Q7"}	["B"]	Correct answer is B for Electronics Mechanic question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.808409	2025-10-26 18:38:03.80841
248	10	Electronics Mechanic - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q8", "B": "Option B for Electronics Mechanic Q8 (Correct)", "C": "Option C for Electronics Mechanic Q8", "D": "Option D for Electronics Mechanic Q8"}	["B"]	Correct answer is B for Electronics Mechanic question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.808987	2025-10-26 18:38:03.808989
249	10	Electronics Mechanic - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q9", "B": "Option B for Electronics Mechanic Q9 (Correct)", "C": "Option C for Electronics Mechanic Q9", "D": "Option D for Electronics Mechanic Q9"}	["B"]	Correct answer is B for Electronics Mechanic question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.809554	2025-10-26 18:38:03.809555
250	10	Electronics Mechanic - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Electronics Mechanic Q10", "B": "Option B for Electronics Mechanic Q10 (Correct)", "C": "Option C for Electronics Mechanic Q10", "D": "Option D for Electronics Mechanic Q10"}	["B"]	Correct answer is B for Electronics Mechanic question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.810124	2025-10-26 18:38:03.810125
251	11	Refrigeration & Air Conditioning - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q1", "B": "Option B for Refrigeration & Air Conditioning Q1 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q1", "D": "Option D for Refrigeration & Air Conditioning Q1"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.81169	2025-10-26 18:38:03.811691
252	11	Refrigeration & Air Conditioning - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q2", "B": "Option B for Refrigeration & Air Conditioning Q2 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q2", "D": "Option D for Refrigeration & Air Conditioning Q2"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.812297	2025-10-26 18:38:03.812298
253	11	Refrigeration & Air Conditioning - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q3", "B": "Option B for Refrigeration & Air Conditioning Q3 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q3", "D": "Option D for Refrigeration & Air Conditioning Q3"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.812887	2025-10-26 18:38:03.812889
254	11	Refrigeration & Air Conditioning - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q4", "B": "Option B for Refrigeration & Air Conditioning Q4 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q4", "D": "Option D for Refrigeration & Air Conditioning Q4"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.813402	2025-10-26 18:38:03.813403
255	11	Refrigeration & Air Conditioning - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q5", "B": "Option B for Refrigeration & Air Conditioning Q5 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q5", "D": "Option D for Refrigeration & Air Conditioning Q5"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.814023	2025-10-26 18:38:03.814024
256	11	Refrigeration & Air Conditioning - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q6", "B": "Option B for Refrigeration & Air Conditioning Q6 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q6", "D": "Option D for Refrigeration & Air Conditioning Q6"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.814546	2025-10-26 18:38:03.814547
257	11	Refrigeration & Air Conditioning - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q7", "B": "Option B for Refrigeration & Air Conditioning Q7 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q7", "D": "Option D for Refrigeration & Air Conditioning Q7"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.815073	2025-10-26 18:38:03.815074
258	11	Refrigeration & Air Conditioning - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q8", "B": "Option B for Refrigeration & Air Conditioning Q8 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q8", "D": "Option D for Refrigeration & Air Conditioning Q8"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.815596	2025-10-26 18:38:03.815597
259	11	Refrigeration & Air Conditioning - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q9", "B": "Option B for Refrigeration & Air Conditioning Q9 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q9", "D": "Option D for Refrigeration & Air Conditioning Q9"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.816056	2025-10-26 18:38:03.816057
260	11	Refrigeration & Air Conditioning - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Refrigeration & Air Conditioning Q10", "B": "Option B for Refrigeration & Air Conditioning Q10 (Correct)", "C": "Option C for Refrigeration & Air Conditioning Q10", "D": "Option D for Refrigeration & Air Conditioning Q10"}	["B"]	Correct answer is B for Refrigeration & Air Conditioning question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.81646	2025-10-26 18:38:03.816461
261	12	Draughtsman Civil - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q1", "B": "Option B for Draughtsman Civil Q1 (Correct)", "C": "Option C for Draughtsman Civil Q1", "D": "Option D for Draughtsman Civil Q1"}	["B"]	Correct answer is B for Draughtsman Civil question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.817472	2025-10-26 18:38:03.817473
262	12	Draughtsman Civil - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q2", "B": "Option B for Draughtsman Civil Q2 (Correct)", "C": "Option C for Draughtsman Civil Q2", "D": "Option D for Draughtsman Civil Q2"}	["B"]	Correct answer is B for Draughtsman Civil question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.817863	2025-10-26 18:38:03.817864
263	12	Draughtsman Civil - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q3", "B": "Option B for Draughtsman Civil Q3 (Correct)", "C": "Option C for Draughtsman Civil Q3", "D": "Option D for Draughtsman Civil Q3"}	["B"]	Correct answer is B for Draughtsman Civil question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.818244	2025-10-26 18:38:03.818245
264	12	Draughtsman Civil - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q4", "B": "Option B for Draughtsman Civil Q4 (Correct)", "C": "Option C for Draughtsman Civil Q4", "D": "Option D for Draughtsman Civil Q4"}	["B"]	Correct answer is B for Draughtsman Civil question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.81861	2025-10-26 18:38:03.818611
265	12	Draughtsman Civil - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q5", "B": "Option B for Draughtsman Civil Q5 (Correct)", "C": "Option C for Draughtsman Civil Q5", "D": "Option D for Draughtsman Civil Q5"}	["B"]	Correct answer is B for Draughtsman Civil question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.818985	2025-10-26 18:38:03.818985
266	12	Draughtsman Civil - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q6", "B": "Option B for Draughtsman Civil Q6 (Correct)", "C": "Option C for Draughtsman Civil Q6", "D": "Option D for Draughtsman Civil Q6"}	["B"]	Correct answer is B for Draughtsman Civil question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.819332	2025-10-26 18:38:03.819333
267	12	Draughtsman Civil - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q7", "B": "Option B for Draughtsman Civil Q7 (Correct)", "C": "Option C for Draughtsman Civil Q7", "D": "Option D for Draughtsman Civil Q7"}	["B"]	Correct answer is B for Draughtsman Civil question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.819679	2025-10-26 18:38:03.81968
268	12	Draughtsman Civil - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q8", "B": "Option B for Draughtsman Civil Q8 (Correct)", "C": "Option C for Draughtsman Civil Q8", "D": "Option D for Draughtsman Civil Q8"}	["B"]	Correct answer is B for Draughtsman Civil question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.820109	2025-10-26 18:38:03.82011
269	12	Draughtsman Civil - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q9", "B": "Option B for Draughtsman Civil Q9 (Correct)", "C": "Option C for Draughtsman Civil Q9", "D": "Option D for Draughtsman Civil Q9"}	["B"]	Correct answer is B for Draughtsman Civil question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.820483	2025-10-26 18:38:03.820484
270	12	Draughtsman Civil - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Draughtsman Civil Q10", "B": "Option B for Draughtsman Civil Q10 (Correct)", "C": "Option C for Draughtsman Civil Q10", "D": "Option D for Draughtsman Civil Q10"}	["B"]	Correct answer is B for Draughtsman Civil question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.820862	2025-10-26 18:38:03.820863
271	13	Machinist - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q1", "B": "Option B for Machinist Q1 (Correct)", "C": "Option C for Machinist Q1", "D": "Option D for Machinist Q1"}	["B"]	Correct answer is B for Machinist question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.821863	2025-10-26 18:38:03.821864
272	13	Machinist - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q2", "B": "Option B for Machinist Q2 (Correct)", "C": "Option C for Machinist Q2", "D": "Option D for Machinist Q2"}	["B"]	Correct answer is B for Machinist question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.822247	2025-10-26 18:38:03.822248
273	13	Machinist - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q3", "B": "Option B for Machinist Q3 (Correct)", "C": "Option C for Machinist Q3", "D": "Option D for Machinist Q3"}	["B"]	Correct answer is B for Machinist question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.822619	2025-10-26 18:38:03.82262
274	13	Machinist - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q4", "B": "Option B for Machinist Q4 (Correct)", "C": "Option C for Machinist Q4", "D": "Option D for Machinist Q4"}	["B"]	Correct answer is B for Machinist question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.823241	2025-10-26 18:38:03.823242
275	13	Machinist - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q5", "B": "Option B for Machinist Q5 (Correct)", "C": "Option C for Machinist Q5", "D": "Option D for Machinist Q5"}	["B"]	Correct answer is B for Machinist question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.82367	2025-10-26 18:38:03.823671
276	13	Machinist - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q6", "B": "Option B for Machinist Q6 (Correct)", "C": "Option C for Machinist Q6", "D": "Option D for Machinist Q6"}	["B"]	Correct answer is B for Machinist question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.824461	2025-10-26 18:38:03.824464
277	13	Machinist - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q7", "B": "Option B for Machinist Q7 (Correct)", "C": "Option C for Machinist Q7", "D": "Option D for Machinist Q7"}	["B"]	Correct answer is B for Machinist question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.825001	2025-10-26 18:38:03.825002
278	13	Machinist - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q8", "B": "Option B for Machinist Q8 (Correct)", "C": "Option C for Machinist Q8", "D": "Option D for Machinist Q8"}	["B"]	Correct answer is B for Machinist question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.825431	2025-10-26 18:38:03.825431
279	13	Machinist - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q9", "B": "Option B for Machinist Q9 (Correct)", "C": "Option C for Machinist Q9", "D": "Option D for Machinist Q9"}	["B"]	Correct answer is B for Machinist question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.825808	2025-10-26 18:38:03.825809
280	13	Machinist - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Machinist Q10", "B": "Option B for Machinist Q10 (Correct)", "C": "Option C for Machinist Q10", "D": "Option D for Machinist Q10"}	["B"]	Correct answer is B for Machinist question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.826172	2025-10-26 18:38:03.826172
281	14	Tool & Die Maker - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q1", "B": "Option B for Tool & Die Maker Q1 (Correct)", "C": "Option C for Tool & Die Maker Q1", "D": "Option D for Tool & Die Maker Q1"}	["B"]	Correct answer is B for Tool & Die Maker question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.827275	2025-10-26 18:38:03.827276
282	14	Tool & Die Maker - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q2", "B": "Option B for Tool & Die Maker Q2 (Correct)", "C": "Option C for Tool & Die Maker Q2", "D": "Option D for Tool & Die Maker Q2"}	["B"]	Correct answer is B for Tool & Die Maker question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.827658	2025-10-26 18:38:03.827659
283	14	Tool & Die Maker - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q3", "B": "Option B for Tool & Die Maker Q3 (Correct)", "C": "Option C for Tool & Die Maker Q3", "D": "Option D for Tool & Die Maker Q3"}	["B"]	Correct answer is B for Tool & Die Maker question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.828065	2025-10-26 18:38:03.828066
284	14	Tool & Die Maker - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q4", "B": "Option B for Tool & Die Maker Q4 (Correct)", "C": "Option C for Tool & Die Maker Q4", "D": "Option D for Tool & Die Maker Q4"}	["B"]	Correct answer is B for Tool & Die Maker question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.828431	2025-10-26 18:38:03.828432
285	14	Tool & Die Maker - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q5", "B": "Option B for Tool & Die Maker Q5 (Correct)", "C": "Option C for Tool & Die Maker Q5", "D": "Option D for Tool & Die Maker Q5"}	["B"]	Correct answer is B for Tool & Die Maker question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.828868	2025-10-26 18:38:03.828869
286	14	Tool & Die Maker - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q6", "B": "Option B for Tool & Die Maker Q6 (Correct)", "C": "Option C for Tool & Die Maker Q6", "D": "Option D for Tool & Die Maker Q6"}	["B"]	Correct answer is B for Tool & Die Maker question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.829233	2025-10-26 18:38:03.829234
287	14	Tool & Die Maker - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q7", "B": "Option B for Tool & Die Maker Q7 (Correct)", "C": "Option C for Tool & Die Maker Q7", "D": "Option D for Tool & Die Maker Q7"}	["B"]	Correct answer is B for Tool & Die Maker question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.829608	2025-10-26 18:38:03.829609
288	14	Tool & Die Maker - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q8", "B": "Option B for Tool & Die Maker Q8 (Correct)", "C": "Option C for Tool & Die Maker Q8", "D": "Option D for Tool & Die Maker Q8"}	["B"]	Correct answer is B for Tool & Die Maker question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.829975	2025-10-26 18:38:03.829976
289	14	Tool & Die Maker - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q9", "B": "Option B for Tool & Die Maker Q9 (Correct)", "C": "Option C for Tool & Die Maker Q9", "D": "Option D for Tool & Die Maker Q9"}	["B"]	Correct answer is B for Tool & Die Maker question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.830346	2025-10-26 18:38:03.830347
290	14	Tool & Die Maker - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Tool & Die Maker Q10", "B": "Option B for Tool & Die Maker Q10 (Correct)", "C": "Option C for Tool & Die Maker Q10", "D": "Option D for Tool & Die Maker Q10"}	["B"]	Correct answer is B for Tool & Die Maker question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.830947	2025-10-26 18:38:03.830948
291	15	Painter General - Question 1: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q1", "B": "Option B for Painter General Q1 (Correct)", "C": "Option C for Painter General Q1", "D": "Option D for Painter General Q1"}	["B"]	Correct answer is B for Painter General question 1	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.832019	2025-10-26 18:38:03.832019
292	15	Painter General - Question 2: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q2", "B": "Option B for Painter General Q2 (Correct)", "C": "Option C for Painter General Q2", "D": "Option D for Painter General Q2"}	["B"]	Correct answer is B for Painter General question 2	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.832402	2025-10-26 18:38:03.832403
293	15	Painter General - Question 3: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q3", "B": "Option B for Painter General Q3 (Correct)", "C": "Option C for Painter General Q3", "D": "Option D for Painter General Q3"}	["B"]	Correct answer is B for Painter General question 3	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.832776	2025-10-26 18:38:03.832776
294	15	Painter General - Question 4: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q4", "B": "Option B for Painter General Q4 (Correct)", "C": "Option C for Painter General Q4", "D": "Option D for Painter General Q4"}	["B"]	Correct answer is B for Painter General question 4	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.833181	2025-10-26 18:38:03.833182
295	15	Painter General - Question 5: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q5", "B": "Option B for Painter General Q5 (Correct)", "C": "Option C for Painter General Q5", "D": "Option D for Painter General Q5"}	["B"]	Correct answer is B for Painter General question 5	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.833552	2025-10-26 18:38:03.833553
296	15	Painter General - Question 6: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q6", "B": "Option B for Painter General Q6 (Correct)", "C": "Option C for Painter General Q6", "D": "Option D for Painter General Q6"}	["B"]	Correct answer is B for Painter General question 6	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.833927	2025-10-26 18:38:03.833932
297	15	Painter General - Question 7: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q7", "B": "Option B for Painter General Q7 (Correct)", "C": "Option C for Painter General Q7", "D": "Option D for Painter General Q7"}	["B"]	Correct answer is B for Painter General question 7	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.834282	2025-10-26 18:38:03.834283
298	15	Painter General - Question 8: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q8", "B": "Option B for Painter General Q8 (Correct)", "C": "Option C for Painter General Q8", "D": "Option D for Painter General Q8"}	["B"]	Correct answer is B for Painter General question 8	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.834627	2025-10-26 18:38:03.834628
299	15	Painter General - Question 9: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q9", "B": "Option B for Painter General Q9 (Correct)", "C": "Option C for Painter General Q9", "D": "Option D for Painter General Q9"}	["B"]	Correct answer is B for Painter General question 9	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.835001	2025-10-26 18:38:03.835002
300	15	Painter General - Question 10: Explain the key concepts and practical applications in this trade.	MULTIPLE_CHOICE	{"A": "Option A for Painter General Q10", "B": "Option B for Painter General Q10 (Correct)", "C": "Option C for Painter General Q10", "D": "Option D for Painter General Q10"}	["B"]	Correct answer is B for Painter General question 10	MEDIUM	4	1	\N	t	2025-10-26 18:38:03.835342	2025-10-26 18:38:03.835343
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.roles (id, name, description, created_at, updated_at) FROM stdin;
1	admin	System administrator with full access	2025-10-26 18:21:57.897927	2025-10-26 18:21:57.897956
2	hall_in_charge	Hall in-charge managing exam hall	2025-10-26 18:21:57.90136	2025-10-26 18:21:57.901365
3	hall_auth	Hall authenticator verifying candidates	2025-10-26 18:21:57.911347	2025-10-26 18:21:57.911355
4	technician	Technical support staff	2025-10-26 18:21:57.916164	2025-10-26 18:21:57.916169
5	student	Exam candidate/student	2025-10-26 18:21:57.917631	2025-10-26 18:21:57.917637
\.


--
-- Data for Name: rubric_criteria; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.rubric_criteria (id, rubric_id, name, description, "order", max_points, weight, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rubric_levels; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.rubric_levels (id, criterion_id, name, description, points, "order", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rubrics; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.rubrics (id, title, description, rubric_type, scoring_method, max_score, created_by, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: student_answers; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.student_answers (id, attempt_id, question_id, answer, is_flagged, time_spent_seconds, answer_sequence, is_correct, marks_awarded, auto_graded, first_answered_at, last_updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: student_attempts; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.student_attempts (id, student_id, exam_id, status, start_time, end_time, submit_time, duration_minutes, time_remaining_seconds, last_activity_time, workstation_id, initial_workstation_id, transfer_count, current_question_id, questions_answered, questions_flagged, total_marks, marks_obtained, percentage, is_passed, auto_graded, graded_by, graded_at, browser_info, ip_address, notes, encryption_salt, encrypted_final_answers, encryption_timestamp, encryption_checksum, created_at, updated_at) FROM stdin;
1	2	2	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
2	3	3	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
3	4	4	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
4	5	5	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
5	6	6	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
6	7	7	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
7	8	8	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
8	9	9	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
9	10	10	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
10	11	11	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
11	12	12	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
12	13	13	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
13	14	14	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
14	15	15	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
15	16	1	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
16	17	2	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
17	18	3	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
18	19	4	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
19	20	5	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
20	21	6	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
21	22	7	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
22	23	8	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
23	24	9	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
24	25	10	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
25	26	11	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
26	27	12	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
27	28	13	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
28	29	14	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
29	30	15	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
30	31	1	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
31	32	2	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
32	33	3	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
33	34	4	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
34	35	5	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
35	36	6	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
36	37	7	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
37	38	8	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
38	39	9	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
39	40	10	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
40	41	11	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
41	42	12	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
42	43	13	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
43	44	14	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
44	45	15	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
45	46	1	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
46	47	2	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
47	48	3	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
48	49	4	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
49	50	5	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
50	51	6	NOT_STARTED	\N	\N	\N	120	\N	\N	\N	\N	0	\N	0	[]	0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-26 18:37:52.921717+00	2025-10-26 18:37:52.921717+00
\.


--
-- Data for Name: trades; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.trades (id, name, code, description, is_active, created_at, updated_at) FROM stdin;
1	IoT Technician (Smart City)	IoT	ITI Trade: IoT Technician (Smart City)	t	2025-10-26 18:37:32.080353	2025-10-26 18:37:32.080355
2	Blockchain Technology	BCTECH	ITI Trade: Blockchain Technology	t	2025-10-26 18:37:32.081591	2025-10-26 18:37:32.081593
3	Computer Operator & Programming Assistant	COPA	ITI Trade: Computer Operator & Programming Assistant	t	2025-10-26 18:37:32.082463	2025-10-26 18:37:32.082464
4	Electrician	ELEC	ITI Trade: Electrician	t	2025-10-26 18:37:32.083204	2025-10-26 18:37:32.083206
5	Fitter	FITTER	ITI Trade: Fitter	t	2025-10-26 18:37:32.083938	2025-10-26 18:37:32.083939
6	Welder (Gas & Electric)	WELDER	ITI Trade: Welder (Gas & Electric)	t	2025-10-26 18:37:32.084645	2025-10-26 18:37:32.084646
7	Mechanic Motor Vehicle	MECH	ITI Trade: Mechanic Motor Vehicle	t	2025-10-26 18:37:32.085328	2025-10-26 18:37:32.085329
8	Plumber	PLUMB	ITI Trade: Plumber	t	2025-10-26 18:37:32.086049	2025-10-26 18:37:32.08605
9	Carpenter	CARP	ITI Trade: Carpenter	t	2025-10-26 18:37:32.086717	2025-10-26 18:37:32.086718
10	Electronics Mechanic	ELECN	ITI Trade: Electronics Mechanic	t	2025-10-26 18:37:32.08735	2025-10-26 18:37:32.087351
11	Refrigeration & Air Conditioning	REFRIG	ITI Trade: Refrigeration & Air Conditioning	t	2025-10-26 18:37:32.087998	2025-10-26 18:37:32.087999
12	Draughtsman Civil	DRFT	ITI Trade: Draughtsman Civil	t	2025-10-26 18:37:32.088607	2025-10-26 18:37:32.088608
13	Machinist	MACH	ITI Trade: Machinist	t	2025-10-26 18:37:32.089243	2025-10-26 18:37:32.089243
14	Tool & Die Maker	TOOL	ITI Trade: Tool & Die Maker	t	2025-10-26 18:37:32.089884	2025-10-26 18:37:32.089885
15	Painter General	PAINT	ITI Trade: Painter General	t	2025-10-26 18:37:32.090544	2025-10-26 18:37:32.090545
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.transfers (id, attempt_id, from_workstation, to_workstation, requested_by_id, approved_by_id, status, reason, migration_checksum, answers_transferred, error_message, created_at, approved_at, rejected_at, completed_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.user_roles (user_id, role_id) FROM stdin;
2	5
3	5
4	5
5	5
6	5
7	5
8	5
9	5
10	5
11	5
12	5
13	5
14	5
15	5
16	5
17	5
18	5
19	5
20	5
21	5
22	5
23	5
24	5
25	5
26	5
27	5
28	5
29	5
30	5
31	5
32	5
33	5
34	5
35	5
36	5
37	5
38	5
39	5
40	5
41	5
42	5
43	5
44	5
45	5
46	5
47	5
48	5
49	5
50	5
51	5
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: exam_user
--

COPY public.users (id, email, username, hashed_password, full_name, hall_ticket_number, date_of_birth, security_question, security_answer_hash, trade_id, is_active, is_verified, center_id, created_at, updated_at, last_login) FROM stdin;
1	admin@example.com	admin	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5OMdZXXJPeR2i	Admin User	\N	\N	\N	\N	\N	t	t	\N	2025-10-26 18:37:25.368726	2025-10-26 18:37:25.368726	\N
2	student0001@apiti.edu.in	apiti0001	$2b$12$lAs0B2eqrTtmhmaK.p/AL.GIlD.ph5J8p1SwOBu4hRJwxtNhBPojO	AP ITI Student 0001	AP20250001	2001-02-02 00:00:00	What is your mother's maiden name?	$2b$12$sPZGvRYbmrseQLm.5AlnFeJp2yD0XIB7JxqRbAOpY6JO0KFouy1B.	2	t	f	2	2025-10-26 18:37:32.559544	2025-10-26 18:38:04.074677	\N
3	student0002@apiti.edu.in	apiti0002	$2b$12$XSKjzj/gOI1uJ1OLnUcJQumW8fMjJnOpBaz.7fKIuQapuV/N9U89O	AP ITI Student 0002	AP20250002	2002-03-03 00:00:00	What is your mother's maiden name?	$2b$12$.Ewki8UsMsUUEZWarBk1mu3.7p0avd5y8tRyR9YW4ItSI98O4HOla	3	t	f	3	2025-10-26 18:37:32.954027	2025-10-26 18:38:04.270748	\N
4	student0003@apiti.edu.in	apiti0003	$2b$12$WQc96tJY2KSGmEOexCJLGuq7tPlU2iJyoY2inWiWD8LGYa4yTwsXO	AP ITI Student 0003	AP20250003	2003-04-04 00:00:00	What is your mother's maiden name?	$2b$12$90VSY.PmrPn1UWBRKwtXqeqIqd4WfStp2Z9/SMG6ASZR8tXW6QXv2	4	t	f	4	2025-10-26 18:37:33.348182	2025-10-26 18:38:04.470159	\N
5	student0004@apiti.edu.in	apiti0004	$2b$12$3CHQKtA0RjtWiPQlregZZ.M5AClF0YjICf2dBPWQ4J4zD9f5eAHbS	AP ITI Student 0004	AP20250004	2004-05-05 00:00:00	What is your mother's maiden name?	$2b$12$ceoTJQzhlzGfnTshiQi6HOcVr5ywIhdCjfntwxQCZNl8dFIRP6tSa	5	t	f	5	2025-10-26 18:37:33.743956	2025-10-26 18:38:04.673032	\N
6	student0005@apiti.edu.in	apiti0005	$2b$12$mkt9iVjHKDSMSA09hQW7EekAfMj6ZAQLWKcFHg6yQWrmLuaH1jSpy	AP ITI Student 0005	AP20250005	2000-06-06 00:00:00	What is your mother's maiden name?	$2b$12$GLdxs1mXD/dqVO5SRReA..ELb/3AWbfQfzSS2lEZz4gE3mNZx8PEO	6	t	f	6	2025-10-26 18:37:34.139959	2025-10-26 18:38:04.868509	\N
7	student0006@apiti.edu.in	apiti0006	$2b$12$alb7dzDf1yAviZg4nLrareyBQfy3SmS6ljlahLRad3C6/38O3m/xu	AP ITI Student 0006	AP20250006	2001-07-07 00:00:00	What is your mother's maiden name?	$2b$12$VKY8se7N7m9wEGxVBcy2r.Jwvwk3Oe.5eSDBXFmzlo4Ob/rM.fBd2	7	t	f	7	2025-10-26 18:37:34.548275	2025-10-26 18:38:05.061803	\N
8	student0007@apiti.edu.in	apiti0007	$2b$12$PGNHe8m6mooT.T9GY44bPeFo8O/gFr9DgUeNAdzuS02eLcoDnSXrG	AP ITI Student 0007	AP20250007	2002-08-08 00:00:00	What is your mother's maiden name?	$2b$12$nZ9XDFGS/Ksc/vQQYGEKguSy7uyA7M7RbfXtB.HzHHPdH5Wk9E7v6	8	t	f	8	2025-10-26 18:37:35.003167	2025-10-26 18:38:05.254853	\N
9	student0008@apiti.edu.in	apiti0008	$2b$12$Ns5UCwZ5.DT3hVsCiEqSWuTusSKWS037FBeoExdAQsCnUQVQ6C9bK	AP ITI Student 0008	AP20250008	2003-09-09 00:00:00	What is your mother's maiden name?	$2b$12$FI74Kxh.hCIx1pJoO4Y0q.dBe6ltcZ152BsZiXAs4m04VOTOGQh3W	9	t	f	9	2025-10-26 18:37:35.44608	2025-10-26 18:38:05.447967	\N
10	student0009@apiti.edu.in	apiti0009	$2b$12$RvoIPu5ehiJVAixOzsnFu.5D6NxqYR8NzWs93ybmJ12Rg3hFepwDC	AP ITI Student 0009	AP20250009	2004-10-10 00:00:00	What is your mother's maiden name?	$2b$12$.s8zngcL1OTNekqJ9KK4QeuveQuvvbz5CNiiKMNEugueoQiQNbmoK	10	t	f	10	2025-10-26 18:37:35.886014	2025-10-26 18:38:05.647693	\N
11	student0010@apiti.edu.in	apiti0010	$2b$12$.BBJoBKEHXzlxkvUyfdl7.e40pl/3xK7xul9sVAiO1FqmmWi8mIZq	AP ITI Student 0010	AP20250010	2000-11-11 00:00:00	What is your mother's maiden name?	$2b$12$L6Ca7rn0gMj7zOvY2JEHOe7KFH29XW7ko5NltNVLcYDA7BBf3DRty	11	t	f	11	2025-10-26 18:37:36.2892	2025-10-26 18:38:05.841307	\N
12	student0011@apiti.edu.in	apiti0011	$2b$12$G9eQevYV/sXjNYDNNZOxZeleTDw8X0tIHZFGeCgr1JtFCBFxZtKAG	AP ITI Student 0011	AP20250011	2001-12-12 00:00:00	What is your mother's maiden name?	$2b$12$PQNQsWklWLgRO.Vz9NhdbOI2pKozcD3FuBZqR5PMGrxtPwJ5IX1zO	12	t	f	12	2025-10-26 18:37:36.714573	2025-10-26 18:38:06.03914	\N
13	student0012@apiti.edu.in	apiti0012	$2b$12$AxWUcnFqjX4kAAf6wCTzKORQU8c73PmDxsCPo7fqU4kpwic6WYfsm	AP ITI Student 0012	AP20250012	2002-01-13 00:00:00	What is your mother's maiden name?	$2b$12$4YFKtO4ScEyZf6CNIf7uBuCwnrcqd/lI7CgKLT8XVsjGnauYvVav2	13	t	f	13	2025-10-26 18:37:37.145344	2025-10-26 18:38:06.236414	\N
14	student0013@apiti.edu.in	apiti0013	$2b$12$jwwafbxOCFFOnXQ0ZKReaeg.EdUT0OuEwxgawo89bTpS79HX39uGq	AP ITI Student 0013	AP20250013	2003-02-14 00:00:00	What is your mother's maiden name?	$2b$12$WKZJyWKXIyGnTNlRwQzS1uPFbYvOcNN601nAA9foGnMDMiuFSeiLK	14	t	f	14	2025-10-26 18:37:37.547488	2025-10-26 18:38:06.430311	\N
15	student0014@apiti.edu.in	apiti0014	$2b$12$c6LNxWaEcwk2Ein4xT/aBeY4ecoQNgR76YN311MFcTjPzbF1lDOeO	AP ITI Student 0014	AP20250014	2004-03-15 00:00:00	What is your mother's maiden name?	$2b$12$gvTNnOFoHcTBzn3/8jNYfu5bFDNhDeNynmSF1ZvhXhq797jSxqR2C	15	t	f	15	2025-10-26 18:37:37.952952	2025-10-26 18:38:06.633139	\N
16	student0015@apiti.edu.in	apiti0015	$2b$12$Ghv0YObBMZ.BSBQqv09gtueYxohP0R3WJhKyvURpBApVnej6ccAAy	AP ITI Student 0015	AP20250015	2000-04-16 00:00:00	What is your mother's maiden name?	$2b$12$9sykZowcWLODDnfU/KUwNub3zrKawwCZC7uGby8uuDAuI6FoUhGKu	1	t	f	16	2025-10-26 18:37:38.348719	2025-10-26 18:38:06.858327	\N
17	student0016@apiti.edu.in	apiti0016	$2b$12$tqfdjSEf0zRp/qyWUqBpPOny81AFANqXs2ChPeKM3iGygyox7/ggi	AP ITI Student 0016	AP20250016	2001-05-17 00:00:00	What is your mother's maiden name?	$2b$12$0OvQoeTBMdmufbHi/70tkOa3k60P4K/R04q4ob1ZsVjBv6tz1R6/K	2	t	f	17	2025-10-26 18:37:38.741592	2025-10-26 18:38:07.055846	\N
18	student0017@apiti.edu.in	apiti0017	$2b$12$0etBeEWpyv8DVbvUmvI9OeBw7Wawi799mq0qkGIb695FI3RqH0OgS	AP ITI Student 0017	AP20250017	2002-06-18 00:00:00	What is your mother's maiden name?	$2b$12$G7Q8JC4Kw58xzB0hGMpk9OtFdkQpx6GY0k/gO0yjSnGxY5hpH8M9C	3	t	f	18	2025-10-26 18:37:39.166897	2025-10-26 18:38:07.276848	\N
19	student0018@apiti.edu.in	apiti0018	$2b$12$9ymBSsrquANnrrP2UOUxhOFSnueCHOipTndQVJfDZVc8PgHuXhOuy	AP ITI Student 0018	AP20250018	2003-07-19 00:00:00	What is your mother's maiden name?	$2b$12$S3.Fg/NValJ8wPWLRnUox.dxaN3LxZm3HKqqLnwaSK5L4MUJ4e8Ii	4	t	f	19	2025-10-26 18:37:39.614628	2025-10-26 18:38:07.518382	\N
20	student0019@apiti.edu.in	apiti0019	$2b$12$uLVTqHxt5jqBHcj/UaE89ujuhyqk4XB4ylJQ4jtGj9UZZwz8/L0sK	AP ITI Student 0019	AP20250019	2004-08-20 00:00:00	What is your mother's maiden name?	$2b$12$TwcKFsklS4f/.DAtbA8ZBOwOGB38oYrm5ckEUOhdUA358pZWpXsSm	5	t	f	20	2025-10-26 18:37:40.039387	2025-10-26 18:38:07.758818	\N
21	student0020@apiti.edu.in	apiti0020	$2b$12$VtaiUuDS1dxyFNy3mmi9auJZVG1cG3KMFwB/0P1O/U7.er10Xbxoq	AP ITI Student 0020	AP20250020	2000-09-21 00:00:00	What is your mother's maiden name?	$2b$12$/ZvKGc2wAjvxxcQrfSShoOKJaIarFoVoOgR58yRpQaiU8mpB83Mme	6	t	f	21	2025-10-26 18:37:40.432025	2025-10-26 18:38:08.016394	\N
22	student0021@apiti.edu.in	apiti0021	$2b$12$hLRw3SRmj/4gUkW54r.NIeGPjOJnOU1PhAvTXwSXRjL6hlzzL9noG	AP ITI Student 0021	AP20250021	2001-10-22 00:00:00	What is your mother's maiden name?	$2b$12$lMRIvynMV7QLPTuYh5AVsemy/IfSQMa9QvCcqlkhEgbAe7L0Se6d2	7	t	f	22	2025-10-26 18:37:40.821482	2025-10-26 18:38:08.255551	\N
23	student0022@apiti.edu.in	apiti0022	$2b$12$uhLhwVu11oG.Votty.LieOgYl/sMEoWtJ6VfT925Hw26o15gnvKmC	AP ITI Student 0022	AP20250022	2002-11-23 00:00:00	What is your mother's maiden name?	$2b$12$hsyF0rKjwlAqnW/PFN7Y2uVecNlYV20jbpElQVwtagJnU/d0c/n/q	8	t	f	23	2025-10-26 18:37:41.21624	2025-10-26 18:38:08.468158	\N
24	student0023@apiti.edu.in	apiti0023	$2b$12$kL/QXMFlxd6vPoFvkyelgeAe8zevDMLsqOkrF5qHWdkOeYTaJvTni	AP ITI Student 0023	AP20250023	2003-12-24 00:00:00	What is your mother's maiden name?	$2b$12$Nd.wRx19wTjJW2pziQvgSO0/BvL.peyy59/DRvH31sPM0gqgSMFrO	9	t	f	24	2025-10-26 18:37:41.608866	2025-10-26 18:38:08.673541	\N
25	student0024@apiti.edu.in	apiti0024	$2b$12$Bdhj7Op2nZwJVDkczjFiZuLL5kKAxYGuzOh/IX/QP5DsW2RU8AvmO	AP ITI Student 0024	AP20250024	2004-01-25 00:00:00	What is your mother's maiden name?	$2b$12$vpfa8DBt.IeuZylNoZGYsuWRNHiGcyXX7nZoaEGyZsgBiw74sofuW	10	t	f	25	2025-10-26 18:37:42.000106	2025-10-26 18:38:08.872216	\N
26	student0025@apiti.edu.in	apiti0025	$2b$12$3wd7WHoLwspuINEp/4MW5.HGV7T8QdoAzaPR5e1vSkZXEBNZX0Yom	AP ITI Student 0025	AP20250025	2000-02-26 00:00:00	What is your mother's maiden name?	$2b$12$JbiZCk8EfHOwz9bgX2JqgO/vM/G/Tr3NeM6L8XWJrYUznXgkhepku	11	t	f	26	2025-10-26 18:37:42.440959	2025-10-26 18:38:09.068166	\N
27	student0026@apiti.edu.in	apiti0026	$2b$12$kXmCAcLPxzlsqIy88wdv6.coZkrP.lzhJYorjnR6YXNCAHgGQN9T2	AP ITI Student 0026	AP20250026	2001-03-27 00:00:00	What is your mother's maiden name?	$2b$12$AUWKiXKIQYE.LO0r8iZVDuqKgtRflVZGTpnkCmLcVnh/Y74Bt03nW	12	t	f	1	2025-10-26 18:37:42.836821	2025-10-26 18:38:09.283177	\N
28	student0027@apiti.edu.in	apiti0027	$2b$12$zLY4/qNH/D/e7Z4tpSJF.enNmmMvNor3qWdNN/dVftBi6gP5eDhzu	AP ITI Student 0027	AP20250027	2002-04-28 00:00:00	What is your mother's maiden name?	$2b$12$GpUBTpt80SSMi9ltT.yvu.Jf.lY.oYAUQduYghFeXfP1LSdSipYmC	13	t	f	2	2025-10-26 18:37:43.263388	2025-10-26 18:38:09.496834	\N
29	student0028@apiti.edu.in	apiti0028	$2b$12$LNdzpfzsogt12XCOiYbG.OC46zv2aIenY.OzbIKPgXJvU3S/h5ffG	AP ITI Student 0028	AP20250028	2003-05-01 00:00:00	What is your mother's maiden name?	$2b$12$9qaBIyyf.HFVyReNn48eA.b0XtuQmFkh2.X.XIRTkBsUPcs7UCHUe	14	t	f	3	2025-10-26 18:37:43.671317	2025-10-26 18:38:09.705257	\N
30	student0029@apiti.edu.in	apiti0029	$2b$12$FvREGozUsOqDVCvPubE8SOHpoPaRNwPAluH.UFEy/P9OqICLmukc6	AP ITI Student 0029	AP20250029	2004-06-02 00:00:00	What is your mother's maiden name?	$2b$12$cFRgKzA7PIh6L494UrMo3uAxU0ZN3e0PPVhBS9AYWxsnzTAXwADPy	15	t	f	4	2025-10-26 18:37:44.071447	2025-10-26 18:38:09.905152	\N
31	student0030@apiti.edu.in	apiti0030	$2b$12$0tConmaVFuPvtXLFJ3toQ.NGi1wFEeM5VidgzMFBQSRfzAwOt0EI2	AP ITI Student 0030	AP20250030	2000-07-03 00:00:00	What is your mother's maiden name?	$2b$12$PsoLqFIyGSF1qoFTV20WFOHIfRJj11CrgATnngXh92Ju88Ca3iIh2	1	t	f	5	2025-10-26 18:37:44.470432	2025-10-26 18:38:10.09745	\N
32	student0031@apiti.edu.in	apiti0031	$2b$12$Se5CjYdLQ01wUygy1oNX6uUBHex2qunBc6dtY0FuipZOVQnLb2iI6	AP ITI Student 0031	AP20250031	2001-08-04 00:00:00	What is your mother's maiden name?	$2b$12$yqQZz4vvWXYpNY31p5Lmp.LWJ1p1zxqRlZfp/PJ4kqvfzjRF.FpCO	2	t	f	6	2025-10-26 18:37:44.885926	2025-10-26 18:38:10.28923	\N
33	student0032@apiti.edu.in	apiti0032	$2b$12$tBh4qn7JljZNpnhO5E2VPO4k6wUEt0qoSizoOcLf.KVjBOc0JBYkS	AP ITI Student 0032	AP20250032	2002-09-05 00:00:00	What is your mother's maiden name?	$2b$12$7FhtpVPeEd./au2dYwm.Ju7a/hCTkFCHHGBFqL.j9F3PX339k5EUm	3	t	f	7	2025-10-26 18:37:45.321242	2025-10-26 18:38:10.480105	\N
34	student0033@apiti.edu.in	apiti0033	$2b$12$uTsvokjfMBEdT17EQWrZzumWyYw8l.7mqvW5x1FIeuJTbspi45L9O	AP ITI Student 0033	AP20250033	2003-10-06 00:00:00	What is your mother's maiden name?	$2b$12$6dighTjuKjQO.yUWrxwAM.xm.NdDiXLSGcyQTevSpkCSUQUlXaAHC	4	t	f	8	2025-10-26 18:37:45.7877	2025-10-26 18:38:10.674116	\N
35	student0034@apiti.edu.in	apiti0034	$2b$12$McHJY59VZnMzRJ/YXe52du/2SAd0dpSAL7jaP8zXn6lLttDCU5LcG	AP ITI Student 0034	AP20250034	2004-11-07 00:00:00	What is your mother's maiden name?	$2b$12$lG5pFAIc8AW/asTzPE9DIOSs9JhiWuAb1ub5FNqgs73RPrXlu8BcW	5	t	f	9	2025-10-26 18:37:46.212172	2025-10-26 18:38:10.868413	\N
36	student0035@apiti.edu.in	apiti0035	$2b$12$gJUULgTMpwwERbbN/azUdO6.f6Ni2cJIih/pHH0uVqzrjADDXDNUm	AP ITI Student 0035	AP20250035	2000-12-08 00:00:00	What is your mother's maiden name?	$2b$12$/sgpl93GWx./DWwyKShMm./mcWKaP0OsZ8kLSrciR.7PbBaQKVJbq	6	t	f	10	2025-10-26 18:37:46.618864	2025-10-26 18:38:11.070349	\N
37	student0036@apiti.edu.in	apiti0036	$2b$12$HViZWZzSF86awy5KgcOjNeRmzqXjBcnixo4EKgi.Vg/afZ.ctmZBi	AP ITI Student 0036	AP20250036	2001-01-09 00:00:00	What is your mother's maiden name?	$2b$12$2QLYed9cXRGHt/QXGStQEeEjszzxee2LfImjBBYVLjybDC0W/h9oO	7	t	f	11	2025-10-26 18:37:47.02277	2025-10-26 18:38:11.266033	\N
38	student0037@apiti.edu.in	apiti0037	$2b$12$DEeNTSixq9Ybls1JAOakJORTucj3noXIVMTek3N6G/mkCvyu/pHwi	AP ITI Student 0037	AP20250037	2002-02-10 00:00:00	What is your mother's maiden name?	$2b$12$O58NalZC317brCEL03TzqOhcc8n6uz4WqaG53PAYOVTxss86CKN.m	8	t	f	12	2025-10-26 18:37:47.413399	2025-10-26 18:38:11.459989	\N
39	student0038@apiti.edu.in	apiti0038	$2b$12$5/RHp7/vhl1RYqpHHHUA7uiPkf6CUGKHujnp8PNCMkQlNcfEu9VTe	AP ITI Student 0038	AP20250038	2003-03-11 00:00:00	What is your mother's maiden name?	$2b$12$cBmvciQs7OieWui.DckZb.CWe.iGRV038Swvi1nwiFvMBTkrQyX5e	9	t	f	13	2025-10-26 18:37:47.850049	2025-10-26 18:38:11.6526	\N
40	student0039@apiti.edu.in	apiti0039	$2b$12$tst5MALf7ZM6/wNnyzDiGeJAzXTrkDsl74lQU5jH/etluuJW9nhwy	AP ITI Student 0039	AP20250039	2004-04-12 00:00:00	What is your mother's maiden name?	$2b$12$I/eC4YrBWsJtMOTbEOk0FOfetd2Wq9B7S24ld7Yf2W5VCiy7QhSyK	10	t	f	14	2025-10-26 18:37:48.242	2025-10-26 18:38:11.846817	\N
41	student0040@apiti.edu.in	apiti0040	$2b$12$5TrXFB1tolqvR2yQPekWz.qKjdSEgFXddKvhdcTwapWpfIg4Y/AQa	AP ITI Student 0040	AP20250040	2000-05-13 00:00:00	What is your mother's maiden name?	$2b$12$tDUnk5S2bu5rqNqi92k0T.pozEVFEwxJktZFydV2h.dRJGZzeyHoe	11	t	f	15	2025-10-26 18:37:48.640511	2025-10-26 18:38:12.043669	\N
42	student0041@apiti.edu.in	apiti0041	$2b$12$clRnctsuyxoun5XPZzde3uz81lQHZp8CZVvXHqblwFfoCHeOjyMcK	AP ITI Student 0041	AP20250041	2001-06-14 00:00:00	What is your mother's maiden name?	$2b$12$FI7LtqJYVJ/nr16vMOPvluDMevXbHbIPKkvJCu3P9J9rq5B/56eqm	12	t	f	16	2025-10-26 18:37:49.032425	2025-10-26 18:38:12.242283	\N
43	student0042@apiti.edu.in	apiti0042	$2b$12$9vOcKewmhmuvoo7XPPuDF.Q1OXc32NPwwpxRjF6BiK4aMj1Tugv3O	AP ITI Student 0042	AP20250042	2002-07-15 00:00:00	What is your mother's maiden name?	$2b$12$wCCQG8glWVew2yP9sP6S3OZDpQQWQrhp4qtfgGbpmNC8e8Ruj1JQq	13	t	f	17	2025-10-26 18:37:49.431055	2025-10-26 18:38:12.437627	\N
44	student0043@apiti.edu.in	apiti0043	$2b$12$cpyvUxZAcHQiZBbcbjbm6OAIuGGw.pRkXEgb3T0wfILTKJ6HOYq.6	AP ITI Student 0043	AP20250043	2003-08-16 00:00:00	What is your mother's maiden name?	$2b$12$e8mcsjHyNEIUBep6RibfaOs18LkD7jqN0fwqyZP50m6S9dCkrZxB.	14	t	f	18	2025-10-26 18:37:49.826873	2025-10-26 18:38:12.643111	\N
45	student0044@apiti.edu.in	apiti0044	$2b$12$Rw9dlEVMcUF/DUFVuU4Rv.9At//VWA7J9P/EilWGEspIvLYb3Tt16	AP ITI Student 0044	AP20250044	2004-09-17 00:00:00	What is your mother's maiden name?	$2b$12$SptfXwRMOS66APn8Y1a1se4FqiBkAkHx87WtLRCIh1v.mgDZ6oBHe	15	t	f	19	2025-10-26 18:37:50.219622	2025-10-26 18:38:12.84612	\N
46	student0045@apiti.edu.in	apiti0045	$2b$12$fYcPSIk56hlXzMLsaqpi8OjWdd1gr6pfguOie8tGGyiL9RMCalDTm	AP ITI Student 0045	AP20250045	2000-10-18 00:00:00	What is your mother's maiden name?	$2b$12$Hk3yaWYaC2IwwgRKoYrNhe.Jz/Y0HTfj5WlmV6eOd4ufYj.CC2OcW	1	t	f	20	2025-10-26 18:37:50.618322	2025-10-26 18:38:13.036898	\N
47	student0046@apiti.edu.in	apiti0046	$2b$12$tTkDjpW66.pRBptF7zRZfel/TlQ5vqxd600H9PWb1Y1FyWWr6dW/m	AP ITI Student 0046	AP20250046	2001-11-19 00:00:00	What is your mother's maiden name?	$2b$12$UskHKzg.G/DxIy33AlFHve.P7L4weYL.IAGudTuFhaxdF.fKMly/e	2	t	f	21	2025-10-26 18:37:51.010585	2025-10-26 18:38:13.233114	\N
48	student0047@apiti.edu.in	apiti0047	$2b$12$bPzUlCxnXXbT73n0IYSQfeSG1DHYDo0KIyr3yGe9a/3zQOyyJW/qG	AP ITI Student 0047	AP20250047	2002-12-20 00:00:00	What is your mother's maiden name?	$2b$12$ntdwJ0YaDFIwWCISYMkhieOgopNNTCK4d9EpQe5m.f.8UpY/muV/e	3	t	f	22	2025-10-26 18:37:51.411016	2025-10-26 18:38:13.43967	\N
49	student0048@apiti.edu.in	apiti0048	$2b$12$9tTPOYpnp8SnDPm2.JZWL.KKGpPJaTBU7B5AK1milTfSH1iXis5Hm	AP ITI Student 0048	AP20250048	2003-01-21 00:00:00	What is your mother's maiden name?	$2b$12$vjCEgGIAAiec5VXpFBhchOiSHKdzszLdElBU4BhZdBVbug8d.9mQC	4	t	f	23	2025-10-26 18:37:51.807272	2025-10-26 18:38:13.641954	\N
50	student0049@apiti.edu.in	apiti0049	$2b$12$U5OSkl4TyM8wDGegt6gmcO8bM1zCId1QjjLRg3oPYSPUQ8DGdBCMO	AP ITI Student 0049	AP20250049	2004-02-22 00:00:00	What is your mother's maiden name?	$2b$12$.Fy9IdFRhleiZiMR.UVDYuFFvi7UM9B.X2e52WgT5ol8c6JYZBm4a	5	t	f	24	2025-10-26 18:37:52.216948	2025-10-26 18:38:13.844244	\N
51	student0050@apiti.edu.in	apiti0050	$2b$12$2H3J3ZBc3.sq85pv2FJ8JuSEF5P.UARdB3jgYxfY1egixiRFbmCWO	AP ITI Student 0050	AP20250050	2000-03-23 00:00:00	What is your mother's maiden name?	$2b$12$O2cd9gNWKmt8hu.m71BLfe0Aqn4D22/usyoEvNO8pYPGKJlahNvuu	6	t	f	25	2025-10-26 18:37:52.661146	2025-10-26 18:38:14.042738	\N
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: centers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.centers_id_seq', 26, true);


--
-- Name: criterion_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.criterion_scores_id_seq', 1, false);


--
-- Name: exam_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.exam_questions_id_seq', 150, true);


--
-- Name: exams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.exams_id_seq', 15, true);


--
-- Name: grading_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.grading_feedback_id_seq', 1, false);


--
-- Name: proctoring_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.proctoring_events_id_seq', 1, false);


--
-- Name: question_banks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.question_banks_id_seq', 15, true);


--
-- Name: question_rubrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.question_rubrics_id_seq', 1, false);


--
-- Name: question_timings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.question_timings_id_seq', 1, false);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.questions_id_seq', 300, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- Name: rubric_criteria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.rubric_criteria_id_seq', 1, false);


--
-- Name: rubric_levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.rubric_levels_id_seq', 1, false);


--
-- Name: rubrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.rubrics_id_seq', 1, false);


--
-- Name: student_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.student_answers_id_seq', 1, false);


--
-- Name: student_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.student_attempts_id_seq', 50, true);


--
-- Name: trades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.trades_id_seq', 15, true);


--
-- Name: transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.transfers_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: exam_user
--

SELECT pg_catalog.setval('public.users_id_seq', 51, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: centers centers_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.centers
    ADD CONSTRAINT centers_pkey PRIMARY KEY (id);


--
-- Name: criterion_scores criterion_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.criterion_scores
    ADD CONSTRAINT criterion_scores_pkey PRIMARY KEY (id);


--
-- Name: exam_questions exam_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.exam_questions
    ADD CONSTRAINT exam_questions_pkey PRIMARY KEY (id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: grading_feedback grading_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.grading_feedback
    ADD CONSTRAINT grading_feedback_pkey PRIMARY KEY (id);


--
-- Name: proctoring_events proctoring_events_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.proctoring_events
    ADD CONSTRAINT proctoring_events_pkey PRIMARY KEY (id);


--
-- Name: question_banks question_banks_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.question_banks
    ADD CONSTRAINT question_banks_pkey PRIMARY KEY (id);


--
-- Name: question_rubrics question_rubrics_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.question_rubrics
    ADD CONSTRAINT question_rubrics_pkey PRIMARY KEY (id);


--
-- Name: question_timings question_timings_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.question_timings
    ADD CONSTRAINT question_timings_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: rubric_criteria rubric_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.rubric_criteria
    ADD CONSTRAINT rubric_criteria_pkey PRIMARY KEY (id);


--
-- Name: rubric_levels rubric_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.rubric_levels
    ADD CONSTRAINT rubric_levels_pkey PRIMARY KEY (id);


--
-- Name: rubrics rubrics_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.rubrics
    ADD CONSTRAINT rubrics_pkey PRIMARY KEY (id);


--
-- Name: student_answers student_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT student_answers_pkey PRIMARY KEY (id);


--
-- Name: student_attempts student_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.student_attempts
    ADD CONSTRAINT student_attempts_pkey PRIMARY KEY (id);


--
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_audit_logs_created_at; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: ix_audit_logs_event_category; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_audit_logs_event_category ON public.audit_logs USING btree (event_category);


--
-- Name: ix_audit_logs_event_type; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_audit_logs_event_type ON public.audit_logs USING btree (event_type);


--
-- Name: ix_audit_logs_exam_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_audit_logs_exam_id ON public.audit_logs USING btree (exam_id);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_audit_logs_transfer_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_audit_logs_transfer_id ON public.audit_logs USING btree (transfer_id);


--
-- Name: ix_audit_logs_user_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: ix_centers_code; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE UNIQUE INDEX ix_centers_code ON public.centers USING btree (code);


--
-- Name: ix_centers_district; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_centers_district ON public.centers USING btree (district);


--
-- Name: ix_centers_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_centers_id ON public.centers USING btree (id);


--
-- Name: ix_criterion_scores_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_criterion_scores_id ON public.criterion_scores USING btree (id);


--
-- Name: ix_exam_questions_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_exam_questions_id ON public.exam_questions USING btree (id);


--
-- Name: ix_exams_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_exams_id ON public.exams USING btree (id);


--
-- Name: ix_grading_feedback_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_grading_feedback_id ON public.grading_feedback USING btree (id);


--
-- Name: ix_proctoring_events_attempt_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_proctoring_events_attempt_id ON public.proctoring_events USING btree (attempt_id);


--
-- Name: ix_proctoring_events_event_timestamp; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_proctoring_events_event_timestamp ON public.proctoring_events USING btree (event_timestamp);


--
-- Name: ix_proctoring_events_event_type; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_proctoring_events_event_type ON public.proctoring_events USING btree (event_type);


--
-- Name: ix_proctoring_events_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_proctoring_events_id ON public.proctoring_events USING btree (id);


--
-- Name: ix_question_banks_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_question_banks_id ON public.question_banks USING btree (id);


--
-- Name: ix_question_rubrics_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_question_rubrics_id ON public.question_rubrics USING btree (id);


--
-- Name: ix_question_timings_attempt_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_question_timings_attempt_id ON public.question_timings USING btree (attempt_id);


--
-- Name: ix_question_timings_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_question_timings_id ON public.question_timings USING btree (id);


--
-- Name: ix_questions_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_questions_id ON public.questions USING btree (id);


--
-- Name: ix_roles_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_roles_id ON public.roles USING btree (id);


--
-- Name: ix_roles_name; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE UNIQUE INDEX ix_roles_name ON public.roles USING btree (name);


--
-- Name: ix_rubric_criteria_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_rubric_criteria_id ON public.rubric_criteria USING btree (id);


--
-- Name: ix_rubric_levels_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_rubric_levels_id ON public.rubric_levels USING btree (id);


--
-- Name: ix_rubrics_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_rubrics_id ON public.rubrics USING btree (id);


--
-- Name: ix_student_answers_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_student_answers_id ON public.student_answers USING btree (id);


--
-- Name: ix_student_attempts_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_student_attempts_id ON public.student_attempts USING btree (id);


--
-- Name: ix_trades_code; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE UNIQUE INDEX ix_trades_code ON public.trades USING btree (code);


--
-- Name: ix_trades_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_trades_id ON public.trades USING btree (id);


--
-- Name: ix_trades_name; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE UNIQUE INDEX ix_trades_name ON public.trades USING btree (name);


--
-- Name: ix_transfers_attempt_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_transfers_attempt_id ON public.transfers USING btree (attempt_id);


--
-- Name: ix_transfers_from_workstation; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_transfers_from_workstation ON public.transfers USING btree (from_workstation);


--
-- Name: ix_transfers_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_transfers_id ON public.transfers USING btree (id);


--
-- Name: ix_transfers_status; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_transfers_status ON public.transfers USING btree (status);


--
-- Name: ix_transfers_to_workstation; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_transfers_to_workstation ON public.transfers USING btree (to_workstation);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_hall_ticket_number; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE UNIQUE INDEX ix_users_hall_ticket_number ON public.users USING btree (hall_ticket_number);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_trade_id; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE INDEX ix_users_trade_id ON public.users USING btree (trade_id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: exam_user
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: audit_logs audit_logs_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.student_attempts(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: criterion_scores criterion_scores_criterion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.criterion_scores
    ADD CONSTRAINT criterion_scores_criterion_id_fkey FOREIGN KEY (criterion_id) REFERENCES public.rubric_criteria(id);


--
-- Name: criterion_scores criterion_scores_feedback_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.criterion_scores
    ADD CONSTRAINT criterion_scores_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.grading_feedback(id);


--
-- Name: criterion_scores criterion_scores_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.criterion_scores
    ADD CONSTRAINT criterion_scores_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.rubric_levels(id);


--
-- Name: exam_questions exam_questions_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.exam_questions
    ADD CONSTRAINT exam_questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: exam_questions exam_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.exam_questions
    ADD CONSTRAINT exam_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: exams exams_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: exams exams_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id) ON DELETE RESTRICT;


--
-- Name: grading_feedback grading_feedback_answer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.grading_feedback
    ADD CONSTRAINT grading_feedback_answer_id_fkey FOREIGN KEY (answer_id) REFERENCES public.student_answers(id);


--
-- Name: grading_feedback grading_feedback_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.grading_feedback
    ADD CONSTRAINT grading_feedback_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.users(id);


--
-- Name: grading_feedback grading_feedback_rubric_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.grading_feedback
    ADD CONSTRAINT grading_feedback_rubric_id_fkey FOREIGN KEY (rubric_id) REFERENCES public.rubrics(id);


--
-- Name: proctoring_events proctoring_events_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.proctoring_events
    ADD CONSTRAINT proctoring_events_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.student_attempts(id) ON DELETE CASCADE;


--
-- Name: proctoring_events proctoring_events_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.proctoring_events
    ADD CONSTRAINT proctoring_events_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id);


--
-- Name: question_banks question_banks_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.question_banks
    ADD CONSTRAINT question_banks_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id) ON DELETE CASCADE;


--
-- Name: question_rubrics question_rubrics_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.question_rubrics
    ADD CONSTRAINT question_rubrics_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id);


--
-- Name: question_rubrics question_rubrics_rubric_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.question_rubrics
    ADD CONSTRAINT question_rubrics_rubric_id_fkey FOREIGN KEY (rubric_id) REFERENCES public.rubrics(id);


--
-- Name: question_timings question_timings_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.question_timings
    ADD CONSTRAINT question_timings_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.student_attempts(id) ON DELETE CASCADE;


--
-- Name: question_timings question_timings_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.question_timings
    ADD CONSTRAINT question_timings_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: questions questions_question_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_question_bank_id_fkey FOREIGN KEY (question_bank_id) REFERENCES public.question_banks(id) ON DELETE CASCADE;


--
-- Name: rubric_criteria rubric_criteria_rubric_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.rubric_criteria
    ADD CONSTRAINT rubric_criteria_rubric_id_fkey FOREIGN KEY (rubric_id) REFERENCES public.rubrics(id);


--
-- Name: rubric_levels rubric_levels_criterion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.rubric_levels
    ADD CONSTRAINT rubric_levels_criterion_id_fkey FOREIGN KEY (criterion_id) REFERENCES public.rubric_criteria(id);


--
-- Name: rubrics rubrics_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.rubrics
    ADD CONSTRAINT rubrics_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: student_answers student_answers_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT student_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.student_attempts(id) ON DELETE CASCADE;


--
-- Name: student_answers student_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT student_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: student_attempts student_attempts_current_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.student_attempts
    ADD CONSTRAINT student_attempts_current_question_id_fkey FOREIGN KEY (current_question_id) REFERENCES public.questions(id);


--
-- Name: student_attempts student_attempts_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.student_attempts
    ADD CONSTRAINT student_attempts_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: student_attempts student_attempts_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.student_attempts
    ADD CONSTRAINT student_attempts_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.users(id);


--
-- Name: student_attempts student_attempts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.student_attempts
    ADD CONSTRAINT student_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transfers transfers_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.users(id);


--
-- Name: transfers transfers_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.student_attempts(id) ON DELETE CASCADE;


--
-- Name: transfers transfers_requested_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id) ON DELETE SET NULL;


--
-- Name: users users_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: exam_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict cYO3yjqeWGP5uZnWmy4cZF8QF2ziRzaD4i7CHUIc93InaoMpHqmSUK0XfBjMI1O

