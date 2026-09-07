import type { UserRole } from "./types";

export const permissions = {
  student: {
    uploadWorksheet: false,
    confirmRecognition: false,
    editRecognition: false,
    reviewMathConflict: false,
    createPractice: false,
    assignPractice: false,
    submitPractice: true,
    viewAnswerBeforeSubmit: false,
    viewOwnProgress: true,
    viewClassAnalytics: false,
    viewOwnChildProgress: false,
  },
  parent: {
    uploadWorksheet: true,
    confirmRecognition: true,
    editRecognition: true,
    reviewMathConflict: false,
    createPractice: true,
    assignPractice: false,
    submitPractice: false,
    viewAnswerBeforeSubmit: true,
    viewOwnProgress: false,
    viewClassAnalytics: false,
    viewOwnChildProgress: true,
  },
  teacher: {
    uploadWorksheet: true,
    confirmRecognition: true,
    editRecognition: true,
    reviewMathConflict: true,
    createPractice: true,
    assignPractice: true,
    submitPractice: false,
    viewAnswerBeforeSubmit: true,
    viewOwnProgress: false,
    viewClassAnalytics: true,
    viewOwnChildProgress: false,
  },
} as const;

export type PermissionKey = keyof (typeof permissions)["student"];

export function hasPermission(
  role: UserRole,
  key: PermissionKey
): boolean {
  return Boolean(permissions[role][key]);
}

export const DEMO_ROLE_NOTICE =
  "演示角色切换仅用于产品演示；生产环境应由真实账号和服务端权限控制。";
