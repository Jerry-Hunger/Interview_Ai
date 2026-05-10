import OSS from 'ali-oss';

let client = null;

// 内部获取 OSS 客户端单例（不导出，外部使用 uploadFile / getSignedUrl）
const getOSSClient = () => {
  if (!client) {
    client = new OSS({
      region: process.env.ALIYUN_OSS_REGION,
      accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
      bucket: process.env.ALIYUN_OSS_BUCKET,
    });
  }
  return client;
};

export const uploadFile = async (file, path) => {
  const ossClient = getOSSClient();
  const result = await ossClient.put(path, file.buffer);
  return result.url;
};

export const generateAvatarPath = (userId, ext) => {
  const timestamp = Date.now();
  return `avatars/${userId}/${timestamp}.${ext}`;
};

export const generateResumePath = (userId, ext) => {
  const timestamp = Date.now();
  return `resumes/${userId}/${timestamp}.${ext}`;
};

export const generateLogoPath = (userId, ext) => {
  const timestamp = Date.now();
  return `logos/${userId}/${timestamp}.${ext}`;
};

export const generatePhotoPath = (userId, ext, index) => {
  const timestamp = Date.now();
  return `photos/${userId}/${timestamp}_${index}.${ext}`;
};

export const getFileExtension = (filename) => {
  const idx = filename.lastIndexOf('.');
  return idx > 0 ? filename.slice(idx + 1).toLowerCase() : '';
};

export const isValidImageType = (ext) => {
  return ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
};

export const isValidResumeType = (ext) => {
  return ['pdf', 'doc', 'docx'].includes(ext);
};

export const getSignedUrl = (objectKey, expiresInSeconds = 3600) => {
  const ossClient = getOSSClient();
  return ossClient.signatureUrl(objectKey, { expires: expiresInSeconds });
};