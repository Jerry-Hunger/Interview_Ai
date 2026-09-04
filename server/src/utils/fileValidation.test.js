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

test("文件魔数覆盖 PNG、WebP、DOC 与 DOCX", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = Buffer.from("RIFFxxxxWEBP", "ascii");
  const doc = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  const docx = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from("[Content_Types].xml word/document.xml")]);
  assert.equal(detectFileType(png), "png");
  assert.equal(detectFileType(webp), "webp");
  assert.equal(detectFileType(doc), "doc");
  assert.equal(detectFileType(docx), "docx");
  assert.equal(isValidResumeUpload(docx, "docx"), true);
});
