/**
 * 根据文件内容而不是客户端声明校验上传类型。浏览器可以伪造 MIME 和扩展名，
 * 因此两者只作为内容检测后的辅助约束。
 */
const hasPrefix = (buffer, bytes) => bytes.every((byte, index) => buffer[index] === byte);

const isOfficeZip = (buffer) => {
  if (!hasPrefix(buffer, [0x50, 0x4b, 0x03, 0x04])) return false;
  // DOCX 是包含 Office 结构的 ZIP，普通 ZIP 不能作为简历上传。
  const content = buffer.toString("latin1");
  return content.includes("[Content_Types].xml") && content.includes("word/");
};

export const detectFileType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;
  if (hasPrefix(buffer, [0xff, 0xd8, 0xff])) return "jpeg";
  if (hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buffer.toString("ascii", 0, 5) === "%PDF-") return "pdf";
  if (hasPrefix(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "doc";
  if (isOfficeZip(buffer)) return "docx";
  return null;
};

const imageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const resumeExtensions = new Set(["pdf", "doc", "docx"]);

export const isValidImageUpload = (buffer, extension) => {
  const detected = detectFileType(buffer);
  const normalizedExtension = extension === "jpg" ? "jpeg" : extension;
  return imageExtensions.has(extension) && detected === normalizedExtension;
};

export const isValidResumeUpload = (buffer, extension) => {
  return resumeExtensions.has(extension) && detectFileType(buffer) === extension;
};
