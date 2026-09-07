import type {
  AppDataStore,
  ClassAnalytics,
  PracticeSet,
  Submission,
  WorksheetTask,
} from "./types";

const WORKSHEET_IMAGE =
  "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=900&q=80";

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();

export const MOCK_USERS = [
  {
    id: "user_student_liming",
    name: "李明",
    role: "student" as const,
    linkedStudentIds: ["stu_liming"],
  },
  {
    id: "user_parent_li",
    name: "李明妈妈",
    role: "parent" as const,
    linkedStudentIds: ["stu_liming"],
  },
  {
    id: "user_teacher_wang",
    name: "王老师",
    role: "teacher" as const,
    linkedStudentIds: ["stu_liming", "stu_zhanghua", "stu_chenxi", "stu_liuyang"],
  },
];

export const MOCK_STUDENTS = [
  {
    id: "stu_liming",
    name: "李明",
    className: "初一（3）班",
    grade: "七年级",
    guardianIds: ["user_parent_li"],
    teacherIds: ["user_teacher_wang"],
  },
  {
    id: "stu_zhanghua",
    name: "张华",
    className: "初一（3）班",
    grade: "七年级",
    guardianIds: [],
    teacherIds: ["user_teacher_wang"],
  },
  {
    id: "stu_chenxi",
    name: "陈希",
    className: "初一（3）班",
    grade: "七年级",
    guardianIds: [],
    teacherIds: ["user_teacher_wang"],
  },
  {
    id: "stu_liuyang",
    name: "刘洋",
    className: "初一（3）班",
    grade: "七年级",
    guardianIds: [],
    teacherIds: ["user_teacher_wang"],
  },
];

/** 任务1：含7题（5对1错1冲突），飞书同步失败，可继续生成练习 */
const taskSaveFailed: WorksheetTask = {
  id: "task_save_failed",
  studentId: "stu_liming",
  sourceImageUrl: WORKSHEET_IMAGE,
  sourceFileName: "七年级数学作业-有理数运算.jpg",
  subject: "数学",
  uploadedAt: hoursAgo(2),
  uploadedBy: "user_parent_li",
  status: "ready_for_practice",
  saveStatus: "failed",
  saveErrorMessage: "飞书多维表格同步超时，请稍后重试",
  practiceSetIds: [],
  questions: [
    {
      id: "q_sf_1",
      worksheetId: "task_save_failed",
      questionNo: "1",
      questionText: "计算：(-3) + 5 = ?",
      studentWork: "2",
      teacherMarkingResult: "correct",
      aiMathVerdict: "correct",
      verifiedCorrectAnswer: "2",
      conflictStatus: "none",
      knowledgePoint: "有理数加减",
      recognitionConfidence: "high",
      reviewStatus: "parent_confirmed",
      selectedForPractice: false,
    },
    {
      id: "q_sf_2",
      worksheetId: "task_save_failed",
      questionNo: "2",
      questionText: "计算：(-2) × 4 = ?",
      studentWork: "-8",
      teacherMarkingResult: "correct",
      aiMathVerdict: "correct",
      verifiedCorrectAnswer: "-8",
      conflictStatus: "none",
      knowledgePoint: "有理数乘除",
      recognitionConfidence: "high",
      reviewStatus: "parent_confirmed",
      selectedForPractice: false,
    },
    {
      id: "q_sf_3",
      worksheetId: "task_save_failed",
      questionNo: "3",
      questionText: "计算：|-7| + 3 = ?",
      studentWork: "10",
      teacherMarkingResult: "correct",
      aiMathVerdict: "correct",
      verifiedCorrectAnswer: "10",
      conflictStatus: "none",
      knowledgePoint: "绝对值",
      recognitionConfidence: "high",
      reviewStatus: "parent_confirmed",
      selectedForPractice: false,
    },
    {
      id: "q_sf_4",
      worksheetId: "task_save_failed",
      questionNo: "4",
      questionText: "化简：3x + 2x = ?",
      studentWork: "5x",
      teacherMarkingResult: "correct",
      aiMathVerdict: "correct",
      verifiedCorrectAnswer: "5x",
      conflictStatus: "none",
      knowledgePoint: "同类项合并",
      recognitionConfidence: "high",
      reviewStatus: "parent_confirmed",
      selectedForPractice: false,
    },
    {
      id: "q_sf_5",
      worksheetId: "task_save_failed",
      questionNo: "5",
      questionText: "计算：12 ÷ (-3) = ?",
      studentWork: "-4",
      teacherMarkingResult: "correct",
      aiMathVerdict: "correct",
      verifiedCorrectAnswer: "-4",
      conflictStatus: "none",
      knowledgePoint: "有理数乘除",
      recognitionConfidence: "high",
      reviewStatus: "parent_confirmed",
      selectedForPractice: false,
    },
    {
      id: "q_sf_6",
      worksheetId: "task_save_failed",
      questionNo: "6",
      questionText: "解方程：2x + 3 = 11",
      studentWork: "x = 3",
      teacherMarkingResult: "incorrect",
      teacherWrittenAnswer: "x=4",
      aiMathVerdict: "incorrect",
      verifiedCorrectAnswer: "x = 4",
      conflictStatus: "student_error",
      errorType: "计算错误",
      knowledgePoint: "一元一次方程",
      knowledgeExplanation: "移项时常数项变号：2x = 11 - 3 = 8，再两边同除以2得 x = 4。",
      recognitionConfidence: "high",
      reviewStatus: "parent_confirmed",
      selectedForPractice: true,
    },
    {
      id: "q_sf_7",
      worksheetId: "task_save_failed",
      questionNo: "7",
      questionText: "若 |a| = 5，则 a 的值为？",
      studentWork: "a = 5",
      teacherMarkingResult: "correct",
      teacherWrittenAnswer: "√",
      aiMathVerdict: "incorrect",
      verifiedCorrectAnswer: "a = 5 或 a = -5",
      conflictStatus: "teacher_marking_conflict",
      errorType: "概念遗漏",
      knowledgePoint: "绝对值",
      knowledgeExplanation: "绝对值等于5时，a可以为5或-5，漏写负值属于常见错误。",
      recognitionConfidence: "medium",
      reviewStatus: "pending",
      selectedForPractice: false,
    },
  ],
};

/** 任务2：等待老师复核 */
const taskNeedsReview: WorksheetTask = {
  id: "task_needs_review",
  studentId: "stu_liming",
  sourceImageUrl: WORKSHEET_IMAGE,
  sourceFileName: "代数式化简练习.jpg",
  subject: "数学",
  uploadedAt: daysAgo(1),
  uploadedBy: "user_parent_li",
  status: "needs_teacher_review",
  saveStatus: "success",
  practiceSetIds: [],
  questions: [
    {
      id: "q_nr_1",
      worksheetId: "task_needs_review",
      questionNo: "1",
      questionText: "化简：(2x + 3) - (x - 1)",
      studentWork: "x + 4",
      teacherMarkingResult: "incorrect",
      aiMathVerdict: "incorrect",
      verifiedCorrectAnswer: "x + 4",
      conflictStatus: "student_error",
      errorType: "符号错误",
      knowledgePoint: "整式加减",
      recognitionConfidence: "low",
      reviewStatus: "pending",
      selectedForPractice: false,
      knowledgeExplanation: "去括号时注意减号变号，实际学生答案正确，但置信度低需复核。",
    },
    {
      id: "q_nr_2",
      worksheetId: "task_needs_review",
      questionNo: "2",
      questionText: "已知三角形两边长为3、4，夹角未知，求第三边。",
      studentWork: "5",
      teacherMarkingResult: "correct",
      aiMathVerdict: "insufficient_information",
      verifiedCorrectAnswer: undefined,
      conflictStatus: "needs_review",
      errorType: "条件不足",
      knowledgePoint: "三角形边角关系",
      recognitionConfidence: "low",
      reviewStatus: "pending",
      selectedForPractice: false,
      knowledgeExplanation: "未给出夹角大小，无法唯一确定第三边。",
    },
    {
      id: "q_nr_3",
      worksheetId: "task_needs_review",
      questionNo: "3",
      questionText: "计算：(-1/2) + 3/4",
      studentWork: "1/4",
      teacherMarkingResult: "correct",
      aiMathVerdict: "incorrect",
      verifiedCorrectAnswer: "1/4",
      conflictStatus: "teacher_marking_conflict",
      errorType: "批改冲突",
      knowledgePoint: "有理数加减",
      recognitionConfidence: "medium",
      reviewStatus: "pending",
      selectedForPractice: false,
      knowledgeExplanation: "学生答案正确，AI误判，需老师裁定。",
    },
  ],
};

/** 任务3：学生已提交并完成 */
const taskCompleted: WorksheetTask = {
  id: "task_completed",
  studentId: "stu_liming",
  sourceImageUrl: WORKSHEET_IMAGE,
  sourceFileName: "方程专项错题.jpg",
  subject: "数学",
  uploadedAt: daysAgo(5),
  uploadedBy: "user_parent_li",
  status: "completed",
  saveStatus: "success",
  practiceSetIds: ["practice_completed"],
  questions: [
    {
      id: "q_cp_1",
      worksheetId: "task_completed",
      questionNo: "1",
      questionText: "解方程：3x - 6 = 9",
      studentWork: "x = 3",
      teacherMarkingResult: "incorrect",
      aiMathVerdict: "incorrect",
      verifiedCorrectAnswer: "x = 5",
      conflictStatus: "student_error",
      errorType: "计算错误",
      knowledgePoint: "一元一次方程",
      recognitionConfidence: "high",
      reviewStatus: "teacher_confirmed",
      selectedForPractice: true,
      knowledgeExplanation: "3x = 15，x = 5。",
    },
    {
      id: "q_cp_2",
      worksheetId: "task_completed",
      questionNo: "2",
      questionText: "解方程：x/2 + 1 = 4",
      studentWork: "x = 5",
      teacherMarkingResult: "incorrect",
      aiMathVerdict: "incorrect",
      verifiedCorrectAnswer: "x = 6",
      conflictStatus: "student_error",
      errorType: "计算错误",
      knowledgePoint: "一元一次方程",
      recognitionConfidence: "high",
      reviewStatus: "teacher_confirmed",
      selectedForPractice: true,
    },
  ],
};

/** 任务4：待家长确认 */
const taskNeedsConfirm: WorksheetTask = {
  id: "task_needs_confirm",
  studentId: "stu_liming",
  sourceImageUrl: WORKSHEET_IMAGE,
  sourceFileName: "分数运算作业.jpg",
  subject: "数学",
  uploadedAt: hoursAgo(5),
  uploadedBy: "user_parent_li",
  status: "needs_confirmation",
  saveStatus: "pending",
  practiceSetIds: [],
  questions: [
    {
      id: "q_nc_1",
      worksheetId: "task_needs_confirm",
      questionNo: "1",
      questionText: "计算：1/2 + 1/3",
      studentWork: "2/5",
      teacherMarkingResult: "incorrect",
      aiMathVerdict: "incorrect",
      verifiedCorrectAnswer: "5/6",
      conflictStatus: "student_error",
      errorType: "通分错误",
      knowledgePoint: "分数加减",
      recognitionConfidence: "high",
      reviewStatus: "pending",
      selectedForPractice: true,
      knowledgeExplanation: "通分后分子相加：3/6 + 2/6 = 5/6。",
    },
    {
      id: "q_nc_2",
      worksheetId: "task_needs_confirm",
      questionNo: "2",
      questionText: "计算：2/3 × 3/4",
      studentWork: "1/2",
      teacherMarkingResult: "correct",
      aiMathVerdict: "correct",
      verifiedCorrectAnswer: "1/2",
      conflictStatus: "none",
      knowledgePoint: "分数乘除",
      recognitionConfidence: "high",
      reviewStatus: "pending",
      selectedForPractice: false,
    },
    {
      id: "q_nc_3",
      worksheetId: "task_needs_confirm",
      questionNo: "3",
      questionText: "化简：6/8",
      studentWork: "3/4",
      teacherMarkingResult: "unclear",
      aiMathVerdict: "correct",
      verifiedCorrectAnswer: "3/4",
      conflictStatus: "needs_review",
      knowledgePoint: "分数化简",
      recognitionConfidence: "low",
      reviewStatus: "pending",
      selectedForPractice: false,
    },
  ],
};

const practiceCompleted: PracticeSet = {
  id: "practice_completed",
  studentId: "stu_liming",
  worksheetId: "task_completed",
  title: "一元一次方程专项练习",
  knowledgePoints: ["一元一次方程", "移项法则"],
  totalQuestions: 6,
  difficulty: "standard",
  status: "completed",
  assignedBy: "user_parent_li",
  assignedAt: daysAgo(4),
  dueAt: daysAgo(1),
  estimatedMinutes: 18,
  items: [
    {
      id: "pi_c1",
      questionNo: "1",
      questionType: "choice",
      questionText: "方程 2x + 4 = 10 的解是？",
      options: ["x = 2", "x = 3", "x = 4", "x = 5"],
      correctAnswer: "x = 3",
      explanation: "2x = 6，x = 3。先移项再两边同除以系数。",
      knowledgePoint: "一元一次方程",
      difficulty: "basic",
    },
    {
      id: "pi_c2",
      questionNo: "2",
      questionType: "blank",
      questionText: "解方程：5x - 10 = 15，x = ____",
      correctAnswer: "5",
      explanation: "5x = 25，x = 5。",
      knowledgePoint: "一元一次方程",
      difficulty: "basic",
    },
    {
      id: "pi_c3",
      questionNo: "3",
      questionType: "choice",
      questionText: "方程 x/3 + 2 = 5 的解是？",
      options: ["x = 3", "x = 6", "x = 9", "x = 12"],
      correctAnswer: "x = 9",
      explanation: "x/3 = 3，x = 9。",
      knowledgePoint: "一元一次方程",
      difficulty: "standard",
    },
    {
      id: "pi_c4",
      questionNo: "4",
      questionType: "blank",
      questionText: "解方程：3(x - 1) = 6，x = ____",
      correctAnswer: "3",
      explanation: "x - 1 = 2，x = 3。",
      knowledgePoint: "一元一次方程",
      difficulty: "standard",
    },
    {
      id: "pi_c5",
      questionNo: "5",
      questionType: "solution",
      questionText: "解方程并写出步骤：4x + 8 = 2x + 20",
      correctAnswer: "x = 6",
      explanation: "移项得 4x - 2x = 20 - 8，2x = 12，x = 6。注意移项变号。",
      knowledgePoint: "移项法则",
      difficulty: "standard",
    },
    {
      id: "pi_c6",
      questionNo: "6",
      questionType: "solution",
      questionText: "解方程：2(x + 3) - 5 = 9",
      correctAnswer: "x = 4",
      explanation: "2x + 6 - 5 = 9，2x + 1 = 9，2x = 8，x = 4。",
      knowledgePoint: "一元一次方程",
      difficulty: "advanced",
    },
  ],
};

const practiceAssigned: PracticeSet = {
  id: "practice_assigned",
  studentId: "stu_liming",
  worksheetId: "task_save_failed",
  title: "有理数与方程巩固练习",
  knowledgePoints: ["一元一次方程", "绝对值"],
  totalQuestions: 6,
  difficulty: "standard",
  status: "assigned",
  assignedBy: "user_teacher_wang",
  assignedAt: hoursAgo(1),
  dueAt: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
  estimatedMinutes: 20,
  items: [
    {
      id: "pi_a1",
      questionNo: "1",
      questionType: "choice",
      questionText: "方程 4x - 2 = 10 的解是？",
      options: ["x = 2", "x = 3", "x = 4", "x = 5"],
      correctAnswer: "x = 3",
      explanation: "4x = 12，x = 3。",
      knowledgePoint: "一元一次方程",
      difficulty: "basic",
    },
    {
      id: "pi_a2",
      questionNo: "2",
      questionType: "blank",
      questionText: "若 |x| = 7，则 x = ____（写出所有可能值）",
      correctAnswer: "7 或 -7",
      explanation: "绝对值定义：到原点距离为7的点有两个。",
      knowledgePoint: "绝对值",
      difficulty: "standard",
    },
    {
      id: "pi_a3",
      questionNo: "3",
      questionType: "choice",
      questionText: "方程 x/2 - 1 = 3 的解是？",
      options: ["x = 4", "x = 6", "x = 8", "x = 10"],
      correctAnswer: "x = 8",
      explanation: "x/2 = 4，x = 8。",
      knowledgePoint: "一元一次方程",
      difficulty: "standard",
    },
    {
      id: "pi_a4",
      questionNo: "4",
      questionType: "blank",
      questionText: "解方程：6x + 3 = 21，x = ____",
      correctAnswer: "3",
      explanation: "6x = 18，x = 3。",
      knowledgePoint: "一元一次方程",
      difficulty: "basic",
    },
    {
      id: "pi_a5",
      questionNo: "5",
      questionType: "solution",
      questionText: "解方程：5x - 4 = 2x + 8，写出完整步骤。",
      correctAnswer: "x = 4",
      explanation: "5x - 2x = 8 + 4，3x = 12，x = 4。",
      knowledgePoint: "移项法则",
      difficulty: "standard",
    },
    {
      id: "pi_a6",
      questionNo: "6",
      questionType: "solution",
      questionText: "若 |a - 2| = 5，求 a 的所有可能值。",
      correctAnswer: "a = 7 或 a = -3",
      explanation: "a - 2 = 5 或 a - 2 = -5，解得 a = 7 或 a = -3。",
      knowledgePoint: "绝对值",
      difficulty: "advanced",
    },
  ],
};

const submissionCompleted: Submission = {
  id: "sub_completed",
  practiceSetId: "practice_completed",
  studentId: "stu_liming",
  answers: {
    pi_c1: "x = 3",
    pi_c2: "5",
    pi_c3: "x = 6",
    pi_c4: "3",
    pi_c5: "x = 6",
    pi_c6: "x = 3",
  },
  submittedAt: daysAgo(2),
  score: 67,
  results: [
    {
      practiceItemId: "pi_c1",
      studentAnswer: "x = 3",
      correctAnswer: "x = 3",
      isCorrect: true,
      explanation: "2x = 6，x = 3。先移项再两边同除以系数。",
    },
    {
      practiceItemId: "pi_c2",
      studentAnswer: "5",
      correctAnswer: "5",
      isCorrect: true,
      explanation: "5x = 25，x = 5。",
    },
    {
      practiceItemId: "pi_c3",
      studentAnswer: "x = 6",
      correctAnswer: "x = 9",
      isCorrect: false,
      explanation: "x/3 = 3，x = 9。注意两边同乘以3。",
    },
    {
      practiceItemId: "pi_c4",
      studentAnswer: "3",
      correctAnswer: "3",
      isCorrect: true,
      explanation: "x - 1 = 2，x = 3。",
    },
    {
      practiceItemId: "pi_c5",
      studentAnswer: "x = 6",
      correctAnswer: "x = 6",
      isCorrect: true,
      explanation: "移项得 4x - 2x = 20 - 8，2x = 12，x = 6。",
    },
    {
      practiceItemId: "pi_c6",
      studentAnswer: "x = 3",
      correctAnswer: "x = 4",
      isCorrect: false,
      explanation: "2x + 6 - 5 = 9，2x + 1 = 9，2x = 8，x = 4。",
    },
  ],
};

export function createInitialStore(): AppDataStore {
  return {
    version: 1,
    currentUserId: "user_parent_li",
    users: MOCK_USERS,
    students: MOCK_STUDENTS,
    tasks: [taskSaveFailed, taskNeedsReview, taskCompleted, taskNeedsConfirm],
    practiceSets: [practiceCompleted, practiceAssigned],
    submissions: [submissionCompleted],
    notifications: [
      {
        id: "notif_1",
        userId: "user_parent_li",
        title: "识别完成，请确认错题",
        body: "《分数运算作业》已识别完成，有 2 道题需要确认。",
        createdAt: hoursAgo(4),
        read: false,
        href: "/parent/confirm/task_needs_confirm",
      },
      {
        id: "notif_2",
        userId: "user_teacher_wang",
        title: "待复核冲突题",
        body: "李明的《代数式化简练习》存在教师批改冲突，请复核。",
        createdAt: daysAgo(1),
        read: false,
        href: "/teacher/review/task_needs_review",
      },
      {
        id: "notif_3",
        userId: "user_student_liming",
        title: "新练习已布置",
        body: "《有理数与方程巩固练习》已布置，请在截止前完成。",
        createdAt: hoursAgo(1),
        read: false,
        href: "/student/practice/practice_assigned",
      },
    ],
  };
}

export function buildClassAnalytics(
  tasks: WorksheetTask[],
  practiceSets: PracticeSet[],
  submissions: Submission[]
): ClassAnalytics {
  void submissions;
  const classTasks = tasks.filter((t) =>
    MOCK_STUDENTS.some((s) => s.id === t.studentId && s.className === "初一（3）班")
  );
  const allQuestions = classTasks.flatMap((t) => t.questions);
  const wrongQuestions = allQuestions.filter(
    (q) =>
      q.teacherMarkingResult === "incorrect" ||
      q.conflictStatus === "teacher_marking_conflict" ||
      q.conflictStatus === "student_error"
  );

  const knowledgeMap = new Map<string, number>();
  const errorMap = new Map<string, number>();
  wrongQuestions.forEach((q) => {
    if (q.knowledgePoint) {
      knowledgeMap.set(q.knowledgePoint, (knowledgeMap.get(q.knowledgePoint) ?? 0) + 1);
    }
    if (q.errorType) {
      errorMap.set(q.errorType, (errorMap.get(q.errorType) ?? 0) + 1);
    }
  });

  const matrix: ClassAnalytics["studentKnowledgeMatrix"] = [];
  MOCK_STUDENTS.forEach((stu) => {
    const stuWrong = classTasks
      .filter((t) => t.studentId === stu.id)
      .flatMap((t) => t.questions)
      .filter(
        (q) =>
          q.teacherMarkingResult === "incorrect" ||
          q.conflictStatus === "student_error" ||
          q.conflictStatus === "teacher_marking_conflict"
      );
    const byKp = new Map<string, number>();
    stuWrong.forEach((q) => {
      const kp = q.knowledgePoint ?? "未分类";
      byKp.set(kp, (byKp.get(kp) ?? 0) + 1);
    });
    // seed extra demo points for matrix density
    if (stu.id === "stu_zhanghua") {
      byKp.set("有理数加减", 3);
      byKp.set("一元一次方程", 2);
    }
    if (stu.id === "stu_chenxi") {
      byKp.set("绝对值", 4);
      byKp.set("分数加减", 2);
    }
    if (stu.id === "stu_liuyang") {
      byKp.set("整式加减", 2);
      byKp.set("一元一次方程", 3);
    }
    byKp.forEach((count, knowledgePoint) => {
      matrix.push({ studentName: stu.name, knowledgePoint, wrongCount: count });
    });
  });

  const assigned = practiceSets.filter((p) => p.studentId && true);
  const completed = assigned.filter(
    (p) => p.status === "completed" || p.status === "submitted"
  );

  const trend7d = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(now - (6 - i) * 24 * 60 * 60 * 1000);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      wrongCount: 4 + ((i * 3) % 5),
      accuracy: 62 + i * 2 + (i % 2),
    };
  });

  const trend30d = Array.from({ length: 6 }).map((_, i) => {
    const date = new Date(now - (5 - i) * 5 * 24 * 60 * 60 * 1000);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      wrongCount: 18 + ((i * 5) % 9),
      accuracy: 58 + i * 3,
    };
  });

  return {
    className: "初一（3）班",
    totalWrongQuestions: Math.max(wrongQuestions.length, 18),
    studentCoverage: MOCK_STUDENTS.length,
    pendingReviewCount: classTasks.filter(
      (t) => t.status === "needs_teacher_review"
    ).length,
    practiceCompletionRate:
      assigned.length === 0
        ? 0
        : Math.round((completed.length / assigned.length) * 100),
    accuracyChange: 8,
    knowledgeRanking: Array.from(knowledgeMap.entries())
      .map(([name, count]) => ({ name, count }))
      .concat([
        { name: "有理数加减", count: 6 },
        { name: "整式加减", count: 4 },
        { name: "分数加减", count: 3 },
      ])
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    errorTypeDistribution: Array.from(errorMap.entries())
      .map(([name, value]) => ({ name, value }))
      .concat([
        { name: "计算错误", value: 8 },
        { name: "概念遗漏", value: 5 },
        { name: "符号错误", value: 3 },
        { name: "通分错误", value: 2 },
      ])
      .reduce<{ name: string; value: number }[]>((acc, cur) => {
        const existing = acc.find((x) => x.name === cur.name);
        if (existing) existing.value += cur.value;
        else acc.push({ ...cur });
        return acc;
      }, []),
    trend7d,
    trend30d,
    studentKnowledgeMatrix: matrix,
  };
}

/** Sample recognition result used after parent uploads */
export function createRecognizedQuestions(worksheetId: string) {
  return [
    {
      id: uid("q"),
      worksheetId,
      questionNo: "1",
      questionText: "计算：(-5) + 8 = ?",
      studentWork: "3",
      teacherMarkingResult: "correct" as const,
      aiMathVerdict: "correct" as const,
      verifiedCorrectAnswer: "3",
      conflictStatus: "none" as const,
      knowledgePoint: "有理数加减",
      recognitionConfidence: "high" as const,
      reviewStatus: "pending" as const,
      selectedForPractice: false,
    },
    {
      id: uid("q"),
      worksheetId,
      questionNo: "2",
      questionText: "计算：(-6) × (-2) = ?",
      studentWork: "12",
      teacherMarkingResult: "correct" as const,
      aiMathVerdict: "correct" as const,
      verifiedCorrectAnswer: "12",
      conflictStatus: "none" as const,
      knowledgePoint: "有理数乘除",
      recognitionConfidence: "high" as const,
      reviewStatus: "pending" as const,
      selectedForPractice: false,
    },
    {
      id: uid("q"),
      worksheetId,
      questionNo: "3",
      questionText: "计算：| -9 | - 4 = ?",
      studentWork: "5",
      teacherMarkingResult: "correct" as const,
      aiMathVerdict: "correct" as const,
      verifiedCorrectAnswer: "5",
      conflictStatus: "none" as const,
      knowledgePoint: "绝对值",
      recognitionConfidence: "high" as const,
      reviewStatus: "pending" as const,
      selectedForPractice: false,
    },
    {
      id: uid("q"),
      worksheetId,
      questionNo: "4",
      questionText: "化简：7a - 2a = ?",
      studentWork: "5a",
      teacherMarkingResult: "correct" as const,
      aiMathVerdict: "correct" as const,
      verifiedCorrectAnswer: "5a",
      conflictStatus: "none" as const,
      knowledgePoint: "同类项合并",
      recognitionConfidence: "high" as const,
      reviewStatus: "pending" as const,
      selectedForPractice: false,
    },
    {
      id: uid("q"),
      worksheetId,
      questionNo: "5",
      questionText: "计算：(-12) ÷ 3 = ?",
      studentWork: "-4",
      teacherMarkingResult: "correct" as const,
      aiMathVerdict: "correct" as const,
      verifiedCorrectAnswer: "-4",
      conflictStatus: "none" as const,
      knowledgePoint: "有理数乘除",
      recognitionConfidence: "high" as const,
      reviewStatus: "pending" as const,
      selectedForPractice: false,
    },
    {
      id: uid("q"),
      worksheetId,
      questionNo: "6",
      questionText: "解方程：3x - 5 = 10",
      studentWork: "x = 4",
      teacherMarkingResult: "incorrect" as const,
      teacherWrittenAnswer: "x=5",
      aiMathVerdict: "incorrect" as const,
      verifiedCorrectAnswer: "x = 5",
      conflictStatus: "student_error" as const,
      errorType: "计算错误",
      knowledgePoint: "一元一次方程",
      knowledgeExplanation: "3x = 15，x = 5。移项时常数项变号。",
      recognitionConfidence: "high" as const,
      reviewStatus: "pending" as const,
      selectedForPractice: true,
    },
    {
      id: uid("q"),
      worksheetId,
      questionNo: "7",
      questionText: "若 |x| = 4，则 x 的值为？",
      studentWork: "x = 4",
      teacherMarkingResult: "correct" as const,
      teacherWrittenAnswer: "√",
      aiMathVerdict: "incorrect" as const,
      verifiedCorrectAnswer: "x = 4 或 x = -4",
      conflictStatus: "teacher_marking_conflict" as const,
      errorType: "概念遗漏",
      knowledgePoint: "绝对值",
      knowledgeExplanation: "漏写负值，需老师复核后才能进入练习。",
      recognitionConfidence: "medium" as const,
      reviewStatus: "pending" as const,
      selectedForPractice: false,
    },
  ];
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
