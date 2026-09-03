import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionApplicationStatus } from "./applicationState.js";

test("申请状态机只允许定义的状态迁移", () => {
  assert.equal(canTransitionApplicationStatus("applied", "in-progress"), true);
  assert.equal(canTransitionApplicationStatus("in-progress", "selected"), true);
  assert.equal(canTransitionApplicationStatus("rejected", "in-progress"), false);
  assert.equal(canTransitionApplicationStatus("unknown", "applied"), false);
});
