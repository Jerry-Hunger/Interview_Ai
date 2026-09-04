/**
 * 企业相册采用先上传、后写库的补偿流程。任何一个步骤失败都会删除本次已上传对象。
 */
export const uploadCompanyPhotosWithRollback = async ({
  files,
  userId,
  existingPhotos,
  uploadFile,
  deleteFile,
  generatePhotoPath,
  getFileExtension,
  savePhotos,
}) => {
  const uploadResults = await Promise.allSettled(files.map(async (file, index) => {
    const extension = getFileExtension(file.originalname);
    const path = generatePhotoPath(userId, extension, index);
    const url = await uploadFile(file, path);
    return { path, url };
  }));
  const successfulUploads = uploadResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const rollback = async () => {
    await Promise.allSettled(successfulUploads.map((upload) => deleteFile(upload.path)));
  };

  if (uploadResults.some((result) => result.status === "rejected")) {
    await rollback();
    throw new Error("部分企业照片上传失败");
  }

  const urls = successfulUploads.map((upload) => upload.url);
  try {
    await savePhotos([...existingPhotos, ...urls]);
  } catch (error) {
    await rollback();
    throw error;
  }
  return urls;
};
