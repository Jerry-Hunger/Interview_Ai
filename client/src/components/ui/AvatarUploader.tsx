// client/src/components/ui/AvatarUploader.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type AvatarUploaderProps = {
  avatarUrl?: string;
  userName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onUploadSuccess?: (url: string) => void;
  dialogTitle?: string;
  uploadEndpoint?: string;
};

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
};

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  avatarUrl,
  userName = "U",
  size = "lg",
  onUploadSuccess,
  dialogTitle,
  uploadEndpoint = "/upload/avatar",
}) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(avatarUrl);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState({ x: 0, y: 0, size: 100 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const handleSize = 10;

  useEffect(() => {
    setPreviewUrl(avatarUrl);
  }, [avatarUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("请选择 JPG、PNG 或 WebP 格式的图片");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCropImage(dataUrl);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = 280;
    const containerHeight = 280;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    let displayWidth: number;
    let displayHeight: number;

    const imgRatio = imgWidth / imgHeight;
    const containerRatio = containerWidth / containerHeight;

    if (imgRatio > containerRatio) {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imgRatio;
    } else {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imgRatio;
    }

    setImageDimensions({ width: displayWidth, height: displayHeight });

    const minSize = Math.min(displayWidth, displayHeight) * 0.5;
    setCropArea({
      x: (displayWidth - minSize) / 2,
      y: (displayHeight - minSize) / 2,
      size: minSize,
    });
  }, []);

  const handleCropMouseDown = (e: React.MouseEvent, handle: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setInitialCrop({ ...cropArea });
    } else {
      setIsDragging(true);
    }
    setDragStart({ x: mouseX, y: mouseY });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isResizing && resizeHandle) {
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      const minSize = 40;

      setCropArea((prev) => {
        let newX = prev.x;
        let newY = prev.y;
        let newSize = prev.size;

        if (resizeHandle.includes("e")) {
          newSize = Math.max(minSize, Math.min(initialCrop.size + deltaX, imageDimensions.width - initialCrop.x));
        }
        if (resizeHandle.includes("w")) {
          const maxDelta = initialCrop.size - minSize;
          const allowedDelta = Math.min(deltaX, maxDelta);
          newX = initialCrop.x + allowedDelta;
          newSize = initialCrop.size - allowedDelta;
        }
        if (resizeHandle.includes("s")) {
          newSize = Math.max(minSize, Math.min(initialCrop.size + deltaY, imageDimensions.height - initialCrop.y));
        }
        if (resizeHandle.includes("n")) {
          const maxDelta = initialCrop.size - minSize;
          const allowedDelta = Math.min(deltaY, maxDelta);
          newY = initialCrop.y + allowedDelta;
          newSize = initialCrop.size - allowedDelta;
        }

        return {
          x: Math.max(0, Math.min(newX, imageDimensions.width - newSize)),
          y: Math.max(0, Math.min(newY, imageDimensions.height - newSize)),
          size: Math.max(minSize, newSize),
        };
      });
      return;
    }

    if (!isDragging) return;

    const deltaX = mouseX - dragStart.x;
    const deltaY = mouseY - dragStart.y;

    setCropArea((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(prev.x + deltaX, imageDimensions.width - prev.size)),
      y: Math.max(0, Math.min(prev.y + deltaY, imageDimensions.height - prev.size)),
    }));

    setDragStart({ x: mouseX, y: mouseY });
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const handleCropUpload = async () => {
    if (!cropImage || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = 280;
    const containerHeight = 280;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    let scaleX: number;
    let scaleY: number;

    const displayWidth = imageDimensions.width;
    const displayHeight = imageDimensions.height;

    if (displayWidth / displayHeight > containerWidth / containerHeight) {
      scaleX = imgWidth / displayWidth;
      scaleY = imgHeight / displayHeight;
    } else {
      scaleX = imgWidth / displayWidth;
      scaleY = imgHeight / displayHeight;
    }

    const cropX = cropArea.x * scaleX;
    const cropY = cropArea.y * scaleY;
    const cropW = cropArea.size * scaleX;
    const cropH = cropArea.size * scaleY;

    const outputSize = 200;
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outputSize, outputSize);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          alert("裁剪失败，请重试");
          return;
        }

        const croppedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });

        setPreviewUrl(URL.createObjectURL(croppedFile));
        setShowCropModal(false);
        setLoading(true);

        try {
          const formData = new FormData();
          formData.append("file", croppedFile);

          const response = await axiosInstance.post(uploadEndpoint, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          if (response.data.success && onUploadSuccess) {
            onUploadSuccess(response.data.url);
          }
        } catch (err) {
          console.error("上传头像失败:", err);
          alert("上传失败，请稍后重试");
          setPreviewUrl(avatarUrl);
        } finally {
          setLoading(false);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setCropImage(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="relative inline-block">
        <Avatar className={`${sizeClasses[size]} cursor-pointer`} onClick={handleClick}>
          <AvatarImage src={previewUrl} alt={userName} />
          <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl font-semibold">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <button
          onClick={handleClick}
          disabled={loading}
          className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition"
          title="上传头像"
        >
          <Camera size={14} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-sm p-4" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{dialogTitle || "裁剪头像"}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <div
              ref={containerRef}
              className="relative overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg"
              style={{ width: 280, height: 280 }}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
            >
              {cropImage && (
                <img
                  ref={imageRef}
                  src={cropImage}
                  alt="Crop preview"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: imageDimensions.width,
                    height: imageDimensions.height,
                  }}
                  onLoad={handleImageLoad}
                  draggable={false}
                />
              )}
              <div
                className="absolute bg-black/50 pointer-events-none"
                style={{ top: 0, left: 0, right: 0, height: cropArea.y }}
              />
              <div
                className="absolute bg-black/50 pointer-events-none"
                style={{
                  top: cropArea.y + cropArea.size,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <div
                className="absolute bg-black/50 pointer-events-none"
                style={{
                  top: cropArea.y,
                  left: 0,
                  width: cropArea.x,
                  height: cropArea.size,
                }}
              />
              <div
                className="absolute bg-black/50 pointer-events-none"
                style={{
                  top: cropArea.y,
                  left: cropArea.x + cropArea.size,
                  right: 0,
                  height: cropArea.size,
                }}
              />
              <div
                className="absolute border-2 border-white cursor-move z-10"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.size,
                  height: cropArea.size,
                }}
                onMouseDown={(e) => handleCropMouseDown(e)}
              >
                <div
                  className="absolute cursor-nw-resize -top-1 -left-1 w-3 h-3 bg-white border-2 border-indigo-500 rounded-sm"
                  style={{ width: handleSize, height: handleSize }}
                  onMouseDown={(e) => handleCropMouseDown(e, "nw")}
                />
                <div
                  className="absolute cursor-n-resize -top-1 left-1/2 -translate-x-1/2 bg-white border-2 border-indigo-500 rounded-sm"
                  style={{ width: handleSize, height: handleSize }}
                  onMouseDown={(e) => handleCropMouseDown(e, "n")}
                />
                <div
                  className="absolute cursor-ne-resize -top-1 -right-1 bg-white border-2 border-indigo-500 rounded-sm"
                  style={{ width: handleSize, height: handleSize }}
                  onMouseDown={(e) => handleCropMouseDown(e, "ne")}
                />
                <div
                  className="absolute cursor-e-resize top-1/2 -translate-y-1/2 -right-1 bg-white border-2 border-indigo-500 rounded-sm"
                  style={{ width: handleSize, height: handleSize }}
                  onMouseDown={(e) => handleCropMouseDown(e, "e")}
                />
                <div
                  className="absolute cursor-se-resize -bottom-1 -right-1 bg-white border-2 border-indigo-500 rounded-sm"
                  style={{ width: handleSize, height: handleSize }}
                  onMouseDown={(e) => handleCropMouseDown(e, "se")}
                />
                <div
                  className="absolute cursor-s-resize -bottom-1 left-1/2 -translate-x-1/2 bg-white border-2 border-indigo-500 rounded-sm"
                  style={{ width: handleSize, height: handleSize }}
                  onMouseDown={(e) => handleCropMouseDown(e, "s")}
                />
                <div
                  className="absolute cursor-sw-resize -bottom-1 -left-1 bg-white border-2 border-indigo-500 rounded-sm"
                  style={{ width: handleSize, height: handleSize }}
                  onMouseDown={(e) => handleCropMouseDown(e, "sw")}
                />
                <div
                  className="absolute cursor-w-resize top-1/2 -translate-y-1/2 -left-1 bg-white border-2 border-indigo-500 rounded-sm"
                  style={{ width: handleSize, height: handleSize }}
                  onMouseDown={(e) => handleCropMouseDown(e, "w")}
                />
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={handleCancelCrop} className="border-2 border-gray-500 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
              取消
            </Button>
            <Button onClick={handleCropUpload} className="border-2 border-indigo-500 dark:border-indigo-400 bg-indigo-600 hover:bg-indigo-700 text-white">
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvatarUploader;
