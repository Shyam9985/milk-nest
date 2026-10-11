import React from "react";
import { useState } from "react";
import { useRef } from "react";
import { useToast } from "../contexts/MessageContext";
import { uploadFile } from "../services/files.service";

// must mirror the server's whitelist — the server has the final word
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const FileUpload = ({
  title = "",
  description = "",
  supportedTypes = "JPG, PNG, WEBP",
  maxSize = "10 MB",
  maxSizeBytes = 10 * 1024 * 1024,
  multiple = false,
  onUploaded,
}) => {
  const types = supportedTypes
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean);

  const toast = useToast();

  const fileRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({}); // { fileKey: 0..100 }

  // stable identity for a file across renders — used for list keys and progress
  const fileKey = (file) => `${file.name}-${file.lastModified}`;

  // two File objects are never === even for the same file on disk,
  // so compare by identity fields instead
  const isSameFile = (a, b) =>
    a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

  // the input's `accept` only filters the picker dialog — dropped files
  // arrive unfiltered, so every file is validated in code before acceptance
  const validateFile = (file) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error(`${file.name}: only ${supportedTypes} files are allowed.`);
      return false;
    }

    if (!file.size) {
      toast.error(`${file.name}: file is empty.`);
      return false;
    }

    if (file.size > maxSizeBytes) {
      toast.error(`${file.name}: exceeds the ${maxSize} limit.`);
      return false;
    }

    return true;
  };

  const selectFiles = (fileList) => {
    const files = Array.from(fileList).filter(validateFile); // FileList → real array
    if (!files.length) return; // picker cancelled, empty drop, or all invalid

    // the picker enforces single-select via the input's `multiple` attr,
    // but drag and drop can still deliver several files at once
    if (!multiple && files.length > 1) {
      toast.error("Only one file is allowed here.");
      return;
    }

    setSelectedFiles((prev) => {
      if (!multiple) return [files[0]];

      const fresh = files.filter(
        (file) => !prev.some((existing) => isSameFile(existing, file)),
      );

      return [...prev, ...fresh];
    });

    console.log("files :", files);
  };

  const handleFileChange = (e) => {
    selectFiles(e.target.files);
    e.target.value = ""; // else re-picking a just-removed file fires no change event
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // default is "drop not allowed" — without this, onDrop never fires
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    // dragleave also fires when entering a child element — ignore those
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); // stop the browser from navigating to / opening the file
    setIsDragging(false);
    selectFiles(e.dataTransfer.files); // dropped files live on dataTransfer, not target.files
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      toast.info("please select file before uploading!");
      return;
    }

    setUploading(true);
    setProgress({}); // fresh bars for this batch

    const failed = [];

    for (const file of selectedFiles) {
      const key = fileKey(file);

      const response = await uploadFile(file, (pct) =>
        setProgress((prev) => ({ ...prev, [key]: pct })),
      );

      if (response.success) {
        toast.success(`${file.name} uploaded successfully.`);
        onUploaded?.(response.data, file); // record for persistence, File for instant preview
      } else {
        failed.push(file);
        toast.error(
          response.error || response.message || `${file.name}: upload failed.`,
        );
      }
    }

    setSelectedFiles(failed); // successes leave the list; failures stay for retry
    setUploading(false);
  };
  return (
    <div className="w-full">
      {/* Header (rendered only when provided) */}
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
          )}

          {description && (
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Upload Container */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex w-full cursor-pointer flex-col items-center gap-4 rounded-2xl
                    border-2 border-dashed px-4 py-5 text-center
                    transition-all duration-200 hover:border-[var(--brand-primary)] hover:bg-[var(--bg-tertiary)]
                    sm:flex-row sm:px-5 sm:text-left
                    ${
                      isDragging
                        ? "border-[var(--brand-primary)] bg-[var(--bg-tertiary)]"
                        : "border-[var(--border-primary)] bg-[var(--bg-secondary)]"
                    }`}
      >
        <input
          type="file"
          ref={fileRef}
          multiple={multiple}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={handleFileChange}
        />

        {/* Upload Icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-light)]
           text-[var(--brand-primary)] transition-all duration-200 group-hover:scale-110 group-hover:bg-[var(--brand-primary)]
           group-hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            {" "}
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8 8 4-4 4 4"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2.5"
            />
          </svg>
        </div>

        {/* Main Text + File Requirements */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {multiple
              ? "Choose files or drag and drop"
              : "Choose a file or drag and drop"}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-[var(--text-secondary)] sm:justify-start">
            {types.map((type) => (
              <span
                key={type}
                className="rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] px-1.5 py-0.5 font-medium"
              >
                {type}
              </span>
            ))}

            <span className="h-1 w-1 rounded-full bg-[var(--text-secondary)]" />

            <span>Max {maxSize}</span>
          </div>
        </div>

        {/* Choose Button */}
        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)] px-4 py-2
          text-sm font-medium text-white shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] focus:outline-none
          focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
        >
          {multiple ? "Choose Files" : "Choose File"}
        </button>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <ul className="mt-4 space-y-2">
          {selectedFiles.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-primary)]
                bg-[var(--bg-secondary)] px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {file.name}
                </p>

                <p className="text-[11px] text-[var(--text-secondary)]">
                  {(file.size / 1024).toFixed(1)} KB
                  {progress[fileKey(file)] != null &&
                    ` — ${progress[fileKey(file)]}%`}
                </p>

                {/* Upload progress: bytes handed to the network, not yet server-confirmed */}
                {progress[fileKey(file)] != null && (
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                    <div
                      className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-200"
                      style={{ width: `${progress[fileKey(file)]}%` }}
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={uploading}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)]
                  transition-all duration-200 hover:bg-[var(--hover-bg)] hover:text-[var(--danger)]
                  disabled:cursor-not-allowed disabled:opacity-40"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={uploading}
        className="mt-3 w-full rounded-lg bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-medium text-white
        shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? "Uploading..." : `Upload (${selectedFiles.length})`}
      </button>
    </div>
  );
};

export default FileUpload;
