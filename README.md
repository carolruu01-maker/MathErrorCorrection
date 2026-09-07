# 错题任务中心

面向学生、家长、老师的错题闭环管理 Web 应用（可运行演示版）。

同一份结构化错题数据，按角色提供不同导航、任务、信息层级与操作权限。Word/PDF 仅作为次要导出入口。

## 本地启动

```bash
npm install
npm run build
npm run start
# 或开发模式
npm run dev
```

浏览器打开：http://127.0.0.1:3000  
（若本机 3000 被占用，可用 `npm run start -- -p 3010`）

## 演示角色入口

顶部条提供「切换演示角色」：

| 角色 | 演示账号 | 入口 |
|------|----------|------|
| 学生 | 李明 | `/student` |
| 家长 | 李明妈妈 | `/parent` |
| 老师 | 王老师 | `/teacher` |

**演示角色切换仅用于产品演示；生产环境应由真实账号和服务端权限控制。**

## 项目目录结构

```text
src/
  app/                    # App Router 页面（按角色划分）
    parent/               # 家长：上传/确认/练习设置/进展
    student/              # 学生：今日练习/作答/结果
    teacher/              # 老师：复核/诊断/布置
    tasks/                # 共享任务列表与详情
    account/ notifications/
  components/             # UI 与 TaskStatusTimeline、AppShell
  lib/
    types.ts              # 完整 TypeScript 模型
    permissions.ts        # 角色权限
    mock-data.ts          # 演示种子数据
    data-service.ts       # ★ Mock Service / 未来真实 API 替换点
    hooks.ts utils.ts
```

## 已实现功能

- 三角色导航与权限隔离（学生看不到同步失败/冲突内部字段等）
- 家长：上传 → AI识别 → 确认 → 选题 → 生成练习；同步失败非阻断
- 冲突题默认不可直接进入练习生成，需老师复核
- 学生：逐题作答、自动保存、提交后才可见答案解析
- 老师：待复核筛选、三栏复核、班级诊断图表下钻、练习布置
- TaskStatusTimeline、加载/空/失败状态、更多操作中的导出入口
- localStorage 持久化演示数据（刷新不丢）

## 尚未接入的真实后端能力

- 真实账号登录与服务端鉴权
- 真实 OCR / AI 识别与数学复核服务
- 飞书多维表格读写（密钥不应放前端）
- 真实 Word/PDF 文档生成服务
- 文件对象存储与手写图云端保存

## Mock → 真实 API 替换位置

统一替换：`src/lib/data-service.ts`（对外导出 `dataService`）。

页面与组件只依赖 `dataService` / `useAppStore`，替换该层即可对接 REST 或飞书 Bitable。

## 关键流程测试结果

生产构建 `npm run build` 成功，并在 `http://127.0.0.1:3010` 对关键路由做 HTTP 冒烟（全部 200）。

逻辑验收（种子数据 + 权限规则）：

1. **家长生成练习**：存在 `task_save_failed`（飞书同步失败），非冲突错题可选；冲突题 `teacher_marking_conflict` 在复核前不可选；仍可生成练习且保留失败警告。
2. **学生完成练习**：`practice_assigned` 提交前无 `results`；提交后生成得分与逐题解析；`viewAnswerBeforeSubmit=false`。
3. **老师复核 + 诊断**：`task_needs_review` 含冲突/低置信度；老师可修正；班级诊断含多学生知识点矩阵与图表下钻入口。

建议手动走查：顶部切换三个角色 → 家长确认 `分数运算作业` → 对同步失败任务点「生成针对性练习」→ 切学生完成 `有理数与方程巩固练习` → 切老师处理冲突并打开班级诊断。
