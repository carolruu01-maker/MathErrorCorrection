import {
  buildClassAnalytics,
  createInitialStore,
  createRecognizedQuestions,
} from "./mock-data";
import type {
  AppDataStore,
  ClassAnalytics,
  PracticeGenerateConfig,
  PracticeItem,
  PracticeSet,
  QuestionType,
  ReviewStatus,
  Submission,
  User,
  UserRole,
  WorksheetTask,
  WrongQuestion,
} from "./types";
import { canSelectForPractice, delay, estimateMinutes, uid } from "./utils";

const STORAGE_KEY = "wrong_question_hub_v1";

type Listener = () => void;

class LocalStore {
  private data: AppDataStore | null = null;
  private listeners: Set<Listener> = new Set();

  private ensure(): AppDataStore {
    if (this.data) return this.data;
    if (typeof window === "undefined") {
      this.data = createInitialStore();
      return this.data;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppDataStore;
        if (parsed.version === 1) {
          this.data = parsed;
          return this.data;
        }
      }
    } catch {
      // fall through to seed
    }
    this.data = createInitialStore();
    this.persist();
    return this.data;
  }

  private persist(): void {
    if (typeof window === "undefined" || !this.data) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): AppDataStore {
    return this.ensure();
  }

  resetDemo(): void {
    this.data = createInitialStore();
    this.persist();
  }

  setCurrentUser(userId: string): void {
    const store = this.ensure();
    store.currentUserId = userId;
    this.persist();
  }

  getCurrentUser(): User {
    const store = this.ensure();
    const user = store.users.find((u) => u.id === store.currentUserId);
    if (!user) throw new Error("当前用户不存在");
    return user;
  }

  switchRole(role: UserRole): User {
    const store = this.ensure();
    const user = store.users.find((u) => u.role === role);
    if (!user) throw new Error("演示角色不存在");
    store.currentUserId = user.id;
    this.persist();
    return user;
  }

  listTasks(): WorksheetTask[] {
    return [...this.ensure().tasks].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  getTask(id: string): WorksheetTask | undefined {
    return this.ensure().tasks.find((t) => t.id === id);
  }

  listPracticeSets(): PracticeSet[] {
    return [...this.ensure().practiceSets].sort((a, b) => {
      const aTime = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
      const bTime = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  getPracticeSet(id: string): PracticeSet | undefined {
    return this.ensure().practiceSets.find((p) => p.id === id);
  }

  getSubmissionByPractice(practiceSetId: string): Submission | undefined {
    return this.ensure().submissions.find((s) => s.practiceSetId === practiceSetId);
  }

  getStudent(id: string) {
    return this.ensure().students.find((s) => s.id === id);
  }

  listStudents() {
    return this.ensure().students;
  }

  listNotifications(userId: string) {
    return this.ensure()
      .notifications.filter((n) => n.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  markNotificationRead(id: string): void {
    const store = this.ensure();
    const item = store.notifications.find((n) => n.id === id);
    if (item) item.read = true;
    this.persist();
  }

  async createUploadTask(input: {
    studentId: string;
    fileName: string;
    imageDataUrl: string;
    uploadedBy: string;
  }): Promise<WorksheetTask> {
    await delay(600);
    const store = this.ensure();
    const task: WorksheetTask = {
      id: uid("task"),
      studentId: input.studentId,
      sourceImageUrl: input.imageDataUrl,
      sourceFileName: input.fileName,
      subject: "数学",
      uploadedAt: new Date().toISOString(),
      uploadedBy: input.uploadedBy,
      status: "uploaded",
      saveStatus: "pending",
      questions: [],
      practiceSetIds: [],
    };
    store.tasks.unshift(task);
    this.persist();
    return task;
  }

  async recognizeTask(taskId: string): Promise<WorksheetTask> {
    const store = this.ensure();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("任务不存在");
    task.status = "recognizing";
    this.persist();
    await delay(1800);
    task.questions = createRecognizedQuestions(taskId);
    task.status = "needs_confirmation";
    this.persist();
    return { ...task, questions: [...task.questions] };
  }

  async failRecognize(taskId: string): Promise<void> {
    const store = this.ensure();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("任务不存在");
    task.status = "uploaded";
    this.persist();
    await delay(400);
    throw new Error("AI识别服务暂时不可用，请重试");
  }

  updateQuestion(
    taskId: string,
    questionId: string,
    patch: Partial<WrongQuestion>
  ): WrongQuestion {
    const store = this.ensure();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("任务不存在");
    const q = task.questions.find((item) => item.id === questionId);
    if (!q) throw new Error("题目不存在");
    Object.assign(q, patch);
    this.persist();
    return { ...q };
  }

  confirmQuestions(taskId: string): WorksheetTask {
    const store = this.ensure();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("任务不存在");

    const hasPendingConflict = task.questions.some(
      (q) =>
        !q.isNotWrong &&
        (q.conflictStatus === "teacher_marking_conflict" ||
          q.conflictStatus === "needs_review") &&
        q.reviewStatus === "pending"
    );

    task.questions.forEach((q) => {
      if (q.isNotWrong) return;
      if (
        q.conflictStatus === "teacher_marking_conflict" ||
        q.conflictStatus === "needs_review"
      ) {
        if (q.reviewStatus === "pending") {
          q.selectedForPractice = false;
        }
        return;
      }
      if (q.reviewStatus === "pending") {
        q.reviewStatus = "parent_confirmed";
      }
    });

    if (hasPendingConflict) {
      task.status = "needs_teacher_review";
    } else {
      task.status = "ready_for_practice";
    }
    this.persist();
    return { ...task, questions: task.questions.map((q) => ({ ...q })) };
  }

  submitForTeacherReview(taskId: string, questionIds: string[]): WorksheetTask {
    const store = this.ensure();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("任务不存在");
    task.questions.forEach((q) => {
      if (questionIds.includes(q.id)) {
        q.selectedForPractice = false;
        if (q.conflictStatus === "none") {
          q.conflictStatus = "needs_review";
        }
      }
    });
    task.status = "needs_teacher_review";
    store.notifications.unshift({
      id: uid("notif"),
      userId: "user_teacher_wang",
      title: "新的复核请求",
      body: `有家长提交了《${task.sourceFileName}》的复核请求。`,
      createdAt: new Date().toISOString(),
      read: false,
      href: `/teacher/review/${task.id}`,
    });
    this.persist();
    return { ...task, questions: task.questions.map((q) => ({ ...q })) };
  }

  async syncToHistory(taskId: string, forceFail = false): Promise<WorksheetTask> {
    const store = this.ensure();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("任务不存在");
    task.saveStatus = "pending";
    this.persist();
    await delay(1000);
    if (forceFail || task.id === "task_save_failed") {
      task.saveStatus = "failed";
      task.saveErrorMessage = "飞书多维表格同步超时，请稍后重试";
      if (task.status !== "needs_teacher_review") {
        task.status = "ready_for_practice";
      }
      this.persist();
      return { ...task, questions: task.questions.map((q) => ({ ...q })) };
    }
    task.saveStatus = "success";
    task.saveErrorMessage = undefined;
    this.persist();
    return { ...task, questions: task.questions.map((q) => ({ ...q })) };
  }

  async retrySync(taskId: string): Promise<WorksheetTask> {
    const store = this.ensure();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("任务不存在");
    task.saveStatus = "pending";
    this.persist();
    await delay(1200);
    // Demo: retry succeeds unless still the seeded failed id on first try pattern
    task.saveStatus = "success";
    task.saveErrorMessage = undefined;
    this.persist();
    return { ...task, questions: task.questions.map((q) => ({ ...q })) };
  }

  async generatePractice(
    taskId: string,
    config: PracticeGenerateConfig,
    assignedBy: string
  ): Promise<PracticeSet> {
    const store = this.ensure();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("任务不存在");

    const selected = task.questions.filter(
      (q) => q.selectedForPractice && canSelectForPractice(q) && !q.isNotWrong
    );
    if (selected.length === 0) {
      throw new Error("请至少选择一道可练习的错题（冲突题需老师复核后才能选择）");
    }

    task.status = "generating";
    this.persist();
    await delay(1400);

    const items: PracticeItem[] = [];
    let no = 1;
    selected.forEach((q) => {
      for (let i = 0; i < config.questionsPerWrong; i += 1) {
        const type =
          config.questionTypes[i % config.questionTypes.length] ?? "blank";
        items.push(buildPracticeItem(q, no, type, config.difficulty));
        no += 1;
      }
    });

    if (config.includeHistoricalWeakPoints) {
      items.push({
        id: uid("pi"),
        questionNo: String(no),
        questionType: "choice",
        questionText: "历史薄弱点巩固：|-3| + 2 = ?",
        options: ["1", "5", "-1", "6"],
        correctAnswer: "5",
        explanation: "绝对值先求再运算：3 + 2 = 5。",
        knowledgePoint: "绝对值",
        difficulty: config.difficulty,
      });
    }

    const practice: PracticeSet = {
      id: uid("practice"),
      studentId: task.studentId,
      worksheetId: task.id,
      title: `${task.subject}针对性练习`,
      knowledgePoints: Array.from(
        new Set(items.map((i) => i.knowledgePoint).filter(Boolean))
      ),
      totalQuestions: items.length,
      difficulty: config.difficulty,
      status: "assigned",
      assignedBy,
      assignedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedMinutes: estimateMinutes(items.length, config.difficulty),
      items,
    };

    store.practiceSets.unshift(practice);
    task.practiceSetIds.push(practice.id);
    task.status = "assigned";
    if (task.saveStatus === "failed") {
      // keep failed warning but allow progression
    }

    store.notifications.unshift({
      id: uid("notif"),
      userId: "user_student_liming",
      title: "新练习已生成",
      body: `《${practice.title}》已布置，共 ${practice.totalQuestions} 题。`,
      createdAt: new Date().toISOString(),
      read: false,
      href: `/student/practice/${practice.id}`,
    });

    this.persist();
    return { ...practice, items: practice.items.map((i) => ({ ...i })) };
  }

  saveDraftAnswers(
    practiceSetId: string,
    studentId: string,
    answers: Record<string, string>,
    handwritingUrls?: Record<string, string>
  ): Submission {
    const store = this.ensure();
    let submission = store.submissions.find(
      (s) => s.practiceSetId === practiceSetId && !s.submittedAt
    );
    const practice = store.practiceSets.find((p) => p.id === practiceSetId);
    if (practice && practice.status === "assigned") {
      practice.status = "in_progress";
      const task = store.tasks.find((t) => t.id === practice.worksheetId);
      if (task && task.status === "assigned") task.status = "in_progress";
    }
    if (!submission) {
      submission = {
        id: uid("sub"),
        practiceSetId,
        studentId,
        answers: { ...answers },
        handwritingUrls: handwritingUrls ? { ...handwritingUrls } : {},
      };
      store.submissions.push(submission);
    } else {
      submission.answers = { ...answers };
      if (handwritingUrls) {
        submission.handwritingUrls = { ...handwritingUrls };
      }
    }
    this.persist();
    return { ...submission, answers: { ...submission.answers } };
  }

  submitPractice(practiceSetId: string, studentId: string): Submission {
    const store = this.ensure();
    const practice = store.practiceSets.find((p) => p.id === practiceSetId);
    if (!practice) throw new Error("练习不存在");
    let submission = store.submissions.find(
      (s) => s.practiceSetId === practiceSetId && s.studentId === studentId
    );
    if (!submission) {
      submission = {
        id: uid("sub"),
        practiceSetId,
        studentId,
        answers: {},
      };
      store.submissions.push(submission);
    }

    const results = practice.items.map((item) => {
      const studentAnswer = (submission!.answers[item.id] ?? "").trim();
      const isCorrect = normalizeAnswer(studentAnswer) === normalizeAnswer(item.correctAnswer);
      return {
        practiceItemId: item.id,
        studentAnswer: studentAnswer || "（未作答）",
        correctAnswer: item.correctAnswer,
        isCorrect,
        explanation: item.explanation,
      };
    });
    const correctCount = results.filter((r) => r.isCorrect).length;
    submission.results = results;
    submission.submittedAt = new Date().toISOString();
    submission.score = Math.round((correctCount / practice.items.length) * 100);
    practice.status = "completed";
    const task = store.tasks.find((t) => t.id === practice.worksheetId);
    if (task) {
      task.status = "completed";
    }
    this.persist();
    return {
      ...submission,
      answers: { ...submission.answers },
      results: submission.results.map((r) => ({ ...r })),
    };
  }

  teacherReviewQuestion(
    taskId: string,
    questionId: string,
    patch: Partial<WrongQuestion> & { reviewStatus: ReviewStatus }
  ): WrongQuestion {
    const store = this.ensure();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("任务不存在");
    const q = task.questions.find((item) => item.id === questionId);
    if (!q) throw new Error("题目不存在");
    Object.assign(q, patch);
    if (
      patch.reviewStatus === "teacher_confirmed" ||
      patch.reviewStatus === "teacher_corrected"
    ) {
      q.conflictStatus = "student_error";
      q.selectedForPractice = true;
    }
    const stillPending = task.questions.some(
      (item) =>
        !item.isNotWrong &&
        (item.conflictStatus === "teacher_marking_conflict" ||
          item.conflictStatus === "needs_review" ||
          item.recognitionConfidence === "low") &&
        item.reviewStatus === "pending"
    );
    if (!stillPending) {
      task.status = "ready_for_practice";
    }
    this.persist();
    return { ...q };
  }

  rejectRecognition(taskId: string, questionId: string): void {
    const store = this.ensure();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("任务不存在");
    task.questions = task.questions.filter((q) => q.id !== questionId);
    this.persist();
  }

  async assignPracticeByTeacher(input: {
    studentIds: string[];
    knowledgePoints: string[];
    difficulty: PracticeSet["difficulty"];
    questionCount: number;
    questionTypes: QuestionType[];
    dueAt: string;
    assignedBy: string;
    sourceQuestionIds?: string[];
  }): Promise<PracticeSet[]> {
    await delay(1000);
    const store = this.ensure();
    const created: PracticeSet[] = [];
    input.studentIds.forEach((studentId) => {
      const items: PracticeItem[] = Array.from({
        length: input.questionCount,
      }).map((_, idx) => {
        const kp =
          input.knowledgePoints[idx % input.knowledgePoints.length] ??
          "综合练习";
        const type =
          input.questionTypes[idx % input.questionTypes.length] ?? "blank";
        return {
          id: uid("pi"),
          questionNo: String(idx + 1),
          questionType: type,
          questionText: `关于「${kp}」的练习题 ${idx + 1}`,
          options:
            type === "choice"
              ? ["选项A", "选项B", "选项C", "选项D"]
              : undefined,
          correctAnswer: type === "choice" ? "选项A" : "示例答案",
          explanation: `本题考查${kp}，请注意关键步骤与符号变化。`,
          knowledgePoint: kp,
          difficulty: input.difficulty,
        };
      });
      const practice: PracticeSet = {
        id: uid("practice"),
        studentId,
        worksheetId: store.tasks.find((t) => t.studentId === studentId)?.id ?? "",
        title: "老师布置的专项练习",
        knowledgePoints: input.knowledgePoints,
        totalQuestions: items.length,
        difficulty: input.difficulty,
        status: "assigned",
        assignedBy: input.assignedBy,
        assignedAt: new Date().toISOString(),
        dueAt: input.dueAt,
        estimatedMinutes: estimateMinutes(items.length, input.difficulty),
        items,
      };
      store.practiceSets.unshift(practice);
      created.push(practice);
      if (studentId === "stu_liming") {
        store.notifications.unshift({
          id: uid("notif"),
          userId: "user_student_liming",
          title: "老师布置了新练习",
          body: `《${practice.title}》截止时间请留意。`,
          createdAt: new Date().toISOString(),
          read: false,
          href: `/student/practice/${practice.id}`,
        });
      }
    });
    this.persist();
    return created;
  }

  getClassAnalytics(): ClassAnalytics {
    const store = this.ensure();
    return buildClassAnalytics(store.tasks, store.practiceSets, store.submissions);
  }
}

function normalizeAnswer(value: string): string {
  return value.replace(/\s+/g, "").replace(/＝/g, "=").toLowerCase();
}

function buildPracticeItem(
  q: WrongQuestion,
  no: number,
  type: QuestionType,
  difficulty: PracticeSet["difficulty"]
): PracticeItem {
  const kp = q.knowledgePoint ?? "综合";
  if (type === "choice") {
    return {
      id: uid("pi"),
      questionNo: String(no),
      questionType: "choice",
      questionText: `（巩固）${q.questionText.replace(/\?$/, "")} 的正确结果是？`,
      options: [
        q.verifiedCorrectAnswer ?? "正确答案",
        "干扰项A",
        "干扰项B",
        "干扰项C",
      ],
      correctAnswer: q.verifiedCorrectAnswer ?? "正确答案",
      explanation:
        q.knowledgeExplanation ??
        `本题对应知识点「${kp}」，请对照标准解法复查计算步骤。`,
      knowledgePoint: kp,
      difficulty,
    };
  }
  if (type === "solution") {
    return {
      id: uid("pi"),
      questionNo: String(no),
      questionType: "solution",
      questionText: `请写出完整步骤：${q.questionText}`,
      correctAnswer: q.verifiedCorrectAnswer ?? "",
      explanation:
        q.knowledgeExplanation ??
        `注意检查符号与移项，对应知识点：${kp}。`,
      knowledgePoint: kp,
      difficulty,
    };
  }
  return {
    id: uid("pi"),
    questionNo: String(no),
    questionType: "blank",
    questionText: `${q.questionText} 请填空。`,
    correctAnswer: q.verifiedCorrectAnswer ?? "",
    explanation:
      q.knowledgeExplanation ?? `请回顾「${kp}」的基本方法。`,
    knowledgePoint: kp,
    difficulty,
  };
}

export const repository = new LocalStore();

/**
 * Service layer — swap implementations here when connecting real APIs / Feishu Bitable.
 * All UI should call these functions rather than touching localStorage directly.
 */
export const dataService = {
  subscribe: (listener: Listener) => repository.subscribe(listener),
  getSnapshot: () => repository.getSnapshot(),
  resetDemo: () => repository.resetDemo(),
  getCurrentUser: () => repository.getCurrentUser(),
  switchRole: (role: UserRole) => repository.switchRole(role),
  listTasks: () => repository.listTasks(),
  getTask: (id: string) => repository.getTask(id),
  listPracticeSets: () => repository.listPracticeSets(),
  getPracticeSet: (id: string) => repository.getPracticeSet(id),
  getSubmissionByPractice: (id: string) => repository.getSubmissionByPractice(id),
  getStudent: (id: string) => repository.getStudent(id),
  listStudents: () => repository.listStudents(),
  listNotifications: (userId: string) => repository.listNotifications(userId),
  markNotificationRead: (id: string) => repository.markNotificationRead(id),
  createUploadTask: (input: {
    studentId: string;
    fileName: string;
    imageDataUrl: string;
    uploadedBy: string;
  }) => repository.createUploadTask(input),
  recognizeTask: (taskId: string) => repository.recognizeTask(taskId),
  updateQuestion: (
    taskId: string,
    questionId: string,
    patch: Partial<WrongQuestion>
  ) => repository.updateQuestion(taskId, questionId, patch),
  confirmQuestions: (taskId: string) => repository.confirmQuestions(taskId),
  submitForTeacherReview: (taskId: string, questionIds: string[]) =>
    repository.submitForTeacherReview(taskId, questionIds),
  syncToHistory: (taskId: string, forceFail?: boolean) =>
    repository.syncToHistory(taskId, forceFail),
  retrySync: (taskId: string) => repository.retrySync(taskId),
  generatePractice: (
    taskId: string,
    config: PracticeGenerateConfig,
    assignedBy: string
  ) => repository.generatePractice(taskId, config, assignedBy),
  saveDraftAnswers: (
    practiceSetId: string,
    studentId: string,
    answers: Record<string, string>,
    handwritingUrls?: Record<string, string>
  ) =>
    repository.saveDraftAnswers(
      practiceSetId,
      studentId,
      answers,
      handwritingUrls
    ),
  submitPractice: (practiceSetId: string, studentId: string) =>
    repository.submitPractice(practiceSetId, studentId),
  teacherReviewQuestion: (
    taskId: string,
    questionId: string,
    patch: Partial<WrongQuestion> & { reviewStatus: ReviewStatus }
  ) => repository.teacherReviewQuestion(taskId, questionId, patch),
  rejectRecognition: (taskId: string, questionId: string) =>
    repository.rejectRecognition(taskId, questionId),
  assignPracticeByTeacher: (input: {
    studentIds: string[];
    knowledgePoints: string[];
    difficulty: PracticeSet["difficulty"];
    questionCount: number;
    questionTypes: QuestionType[];
    dueAt: string;
    assignedBy: string;
    sourceQuestionIds?: string[];
  }) => repository.assignPracticeByTeacher(input),
  getClassAnalytics: () => repository.getClassAnalytics(),
};
