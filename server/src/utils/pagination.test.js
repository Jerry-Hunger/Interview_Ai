import test from "node:test";
import assert from "node:assert/strict";
import { getPagination, toPaginationMeta } from "./pagination.js";

test("getPagination 使用安全默认值并限制单页大小", () => {
  assert.deepEqual(getPagination({}), { page: 1, pageSize: 20, skip: 0 });
  assert.deepEqual(getPagination({ page: "2", pageSize: "500" }), {
    page: 2,
    pageSize: 100,
    skip: 100,
  });
});

test("toPaginationMeta 正确计算总页数", () => {
  assert.deepEqual(toPaginationMeta({ page: 2, pageSize: 20 }, 41), {
    page: 2,
    pageSize: 20,
    total: 41,
    totalPages: 3,
  });
});
