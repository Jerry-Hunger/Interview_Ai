export const APPLICATION_STATUS_TRANSITIONS = {
  applied: ["in-progress", "rejected"],
  "in-progress": ["in-progress", "selected", "rejected"],
  selected: ["final-selected", "rejected"],
  "final-selected": [],
  rejected: [],
};

/** 统一申请状态机，避免控制器和校验规则各自维护状态约束。 */
export const canTransitionApplicationStatus = (from, to) =>
  APPLICATION_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
