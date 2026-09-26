import Label from "@/components/ui/Label";

import { fileInputStyles } from "@/components/style/styles";

const getFileUrl = (path) => {
  if (!path) return "#";

  return `http://localhost:3001/${path}`;
};

const FileUpload = ({
  label,
  name,
  accept,
  multiple,
  fileUrl,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      className={`grid gap-2 bg-white p-4 rounded-xl border border-slate-200 transition-all ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <Label>{label}</Label>

      {fileUrl && (
        <a
          href={getFileUrl(fileUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-600 hover:text-red-700 underline text-sm font-medium"
        >
          مشاهده فایل فعلی
        </a>
      )}

      <input
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className={`${fileInputStyles} ${
          disabled ? "cursor-not-allowed bg-slate-100" : ""
        }`}
        onChange={onChange}
      />
    </div>
  );
};

export default FileUpload;
