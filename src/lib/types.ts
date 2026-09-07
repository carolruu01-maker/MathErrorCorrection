export type UserRole = "student" | "parent" | "teacher";

export type TaskStatus =
  | "uploaded"
  | "recognizing"
  | "needs_confirmation"
  | "needs_teacher_review"
  | "confirmed"
  | "save_failed"
  | "ready_for_practice"
  | "generating"
  | "assigned"
  | "in_progress"
  | "submitted"
  | "completed";

export type MarkingResult = "correct" | "incorrect" | "unclear";

export type MathVerdict =
  | "correct"
  | "incorrect"
  | "insufficient_information";

export type ConflictStatus =
  | "none"
  | "student_error"
  | "teacher_marking_conflict"
  | "needs_review";

export type ReviewStatus =
  | "pending"
  | "parent_confirmed"
  | "teacher_confirmed"
  | "teacher_corrected";

export type SaveStatus = "pending" | "success" | "failed";

export type RecognitionConfidence = "high" | "medium" | "low";

export type PracticeDifficulty = "basic" | "standard" | "advanced";

export type PracticeStatus =
  | "draft"
  | "assigned"
  | "in_progress"
  | "submitted"
  | "completed";

export type QuestionType = "choice" | "blank" | "solution";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  linkedStudentIds?: string[];
}

export interface Student {
  id: string;
  name: string;
  className: string;
  grade: string;
  guardianIds: string[];
  teacherIds: string[];
}

export interface WrongQuestion {
  id: string;
  worksheetId: string;
  questionNo: string;
  questionText: string;
  studentWork: string;
  teacherMarkingResult: MarkingResult;
  teacherWrittenAnswer?: string;
  aiMathVerdict: MathVerdict;
  verifiedCorrectAnswer?: string;
  conflictStatus: ConflictStatus;
  errorType?: string;
  knowledgePoint?: string;
  knowledgeExplanation?: string;
  recognitionConfidence: RecognitionConfidence;
  reviewStatus: ReviewStatus;
  selectedForPractice: boolean;
  isNotWrong?: boolean;
}

export interface WorksheetTask {
  id: string;
  studentId: string;
  sourceImageUrl: string;
  sourceFileName: string;
  subject: string;
  uploadedAt: string;
  uploadedBy: string;
  status: TaskStatus;
  saveStatus: SaveStatus;
  saveErrorMessage?: string;
  questions: WrongQuestion[];
  practiceSetIds: string[];
}

export interface PracticeItem {
  id: string;
  questionNo: string;
  questionType: QuestionType;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  knowledgePoint: string;
  difficulty: PracticeDifficulty;
  handwritingImageUrl?: string;
}

export interface PracticeSet {
  id: string;
  studentId: string;
  worksheetId: string;
  title: string;
  knowledgePoints: string[];
  totalQuestions: number;
  difficulty: PracticeDifficulty;
  status: PracticeStatus;
  assignedBy?: string;
  assignedAt?: string;
  dueAt?: string;
  estimatedMinutes?: number;
  items: PracticeItem[];
}

export interface SubmissionResult {
  practiceItemId: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface Submission {
  id: string;
  practiceSetId: string;
  studentId: string;
  answers: Record<string, string>;
  handwritingUrls?: Record<string, string>;
  submittedAt?: string;
  score?: number;
  results?: SubmissionResult[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export interface PracticeGenerateConfig {
  questionsPerWrong: 1 | 2 | 3 | 5;
  difficulty: PracticeDifficulty;
  questionTypes: QuestionType[];
  includeHistoricalWeakPoints: boolean;
}

export interface ClassAnalytics {
  className: string;
  totalWrongQuestions: number;
  studentCoverage: number;
  pendingReviewCount: number;
  practiceCompletionRate: number;
  accuracyChange: number;
  knowledgeRanking: { name: string; count: number }[];
  errorTypeDistribution: { name: string; value: number }[];
  trend7d: { date: string; wrongCount: number; accuracy: number }[];
  trend30d: { date: string; wrongCount: number; accuracy: number }[];
  studentKnowledgeMatrix: {
    studentName: string;
    knowledgePoint: string;
    wrongCount: number;
  }[];
}

export interface AppDataStore {
  users: User[];
  students: Student[];
  tasks: WorksheetTask[];
  practiceSets: PracticeSet[];
  submissions: Submission[];
  notifications: NotificationItem[];
  currentUserId: string;
  version: number;
}
