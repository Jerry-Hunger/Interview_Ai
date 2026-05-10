/** 统一的难度配置 */

export const difficultyConfig = {
  beginner: {
    label: "初级",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    gradient: "from-emerald-500 to-teal-500",
  },
  intermediate: {
    label: "中级",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    gradient: "from-amber-500 to-orange-500",
  },
  senior: {
    label: "高级",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
    gradient: "from-rose-500 to-pink-500",
  },
  // 兼容别名
  easy: {
    label: "简单",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    gradient: "from-emerald-500 to-teal-500",
  },
  medium: {
    label: "中等",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    gradient: "from-amber-500 to-orange-500",
  },
  hard: {
    label: "困难",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
    gradient: "from-rose-500 to-pink-500",
  },
} as const;

export type DifficultyKey = keyof typeof difficultyConfig;
