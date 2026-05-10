/** 面试相关的共享工具函数 */

/** 检测 AI 回复是否包含 [REPROMPT] 标签（要求学生重新回答） */
export const isPerfunctoryReprompt = (text: string): boolean => {
  return /\[REPROMPT\]/i.test(text);
};

/** 移除 [REPROMPT] 和 [/REPROMPT] 标签及多余空白 */
export const stripRepromptTag = (text: string): string => {
  return text.replace(/\[\/?REPROMPT\]/gi, "").replace(/\n{3,}/g, "\n\n").trim();
};
