/** 统一的申请状态颜色和标签配置 */

export const statusColors: Record<string, string> = {
  applied: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "in-progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  selected: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "final-selected": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export const statusLabels: Record<string, string> = {
  applied: "已申请",
  "in-progress": "面试中",
  selected: "已通过",
  "final-selected": "最终通过",
  rejected: "已拒绝",
};
