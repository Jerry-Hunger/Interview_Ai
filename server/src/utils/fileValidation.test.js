import test from "node:test";
import assert from "node:assert/strict";
import { detectFileType, isValidImageUpload, isValidResumeUpload } from "./fileValidation.js";

test("detectFileType 依据文件魔数识别图片和 PDF", () => {
  assert.equal(detectFileType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), "jpeg");
  assert.equal(detectFileType(Buffer.from("%PDF-1.7")), "pdf");
  assert.equal(detectFileType(Buffer.from("not a document")), null);
});

test("上传格式必须同时匹配扩展名与内容", () => {
  const pdf = Buffer.from("%PDF-1.7");
  assert.equal(isValidResumeUpload(pdf, "pdf"), true);
  assert.equal(isValidResumeUpload(pdf, "docx"), false);
  assert.equal(isValidImageUpload(pdf, "png"), false);
});
