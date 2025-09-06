import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";

const ResumeSection = ({ user, uploading, handleResumeUpload }: any) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <h3 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-400">
        Resume
      </h3>

      {user.resume ? (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-[#23263A] p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-500" />
            <a
              href={user.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Resume
            </a>
          </div>

          {/* Hidden input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleResumeUpload}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={triggerFileInput} // ✅ Trigger click on hidden input
            className="flex items-center gap-1"
          >
            <Upload size={16} />
            {uploading ? "Uploading..." : "Update"}
          </Button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleResumeUpload}
          />
          <Button
            size="sm"
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={uploading}
            onClick={triggerFileInput} // ✅ Trigger click
          >
            <Upload size={16} />
            {uploading ? "Uploading..." : "Upload Resume"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResumeSection;
