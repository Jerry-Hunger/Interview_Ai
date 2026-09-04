import test from "node:test";
import assert from "node:assert/strict";
import { uploadCompanyPhotosWithRollback } from "./photoUploadService.js";

const files = [{ originalname: "one.jpg" }, { originalname: "two.jpg" }];
const baseDependencies = () => {
  const deleted = [];
  return {
    deleted,
    userId: "company-1",
    existingPhotos: ["old-url"],
    generatePhotoPath: (_userId, extension, index) => `${index}.${extension}`,
    getFileExtension: () => "jpg",
    deleteFile: async (path) => deleted.push(path),
  };
};

test("任一 OSS 上传失败会回滚同批已成功照片", async () => {
  const dependencies = baseDependencies();
  await assert.rejects(() => uploadCompanyPhotosWithRollback({
    ...dependencies,
    files,
    uploadFile: async (_file, path) => {
      if (path === "1.jpg") throw new Error("OSS unavailable");
      return `https://oss/${path}`;
    },
    savePhotos: async () => assert.fail("上传失败时不得写库"),
  }), /部分企业照片上传失败/);
  assert.deepEqual(dependencies.deleted, ["0.jpg"]);
});

test("数据库写入失败会回滚本次所有已上传照片", async () => {
  const dependencies = baseDependencies();
  await assert.rejects(() => uploadCompanyPhotosWithRollback({
    ...dependencies,
    files,
    uploadFile: async (_file, path) => `https://oss/${path}`,
    savePhotos: async () => { throw new Error("database unavailable"); },
  }), /database unavailable/);
  assert.deepEqual(dependencies.deleted.sort(), ["0.jpg", "1.jpg"]);
});
