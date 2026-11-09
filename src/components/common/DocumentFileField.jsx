import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, FileCheck2 } from "lucide-react";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

/**
 * @typedef {{
 *   file_uri?: string,
 *   file_name?: string,
 *   file_size?: number,
 *   mime_type?: string
 * }} DocumentFileValue
 */

/**
 * @param {{
 *   value?: DocumentFileValue,
 *   onChange: (value: DocumentFileValue) => void
 * }} props
 */
export default function DocumentFileField({ value, onChange }) {
  /** @type {import("react").RefObject<HTMLInputElement>} */
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /**
   * @param {File | null} file
   */
  const handleFile = async (file) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError("Upload a PDF, PNG, JPG or WEBP file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Files must be 10 MB or smaller.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await base44.integrations.Core.UploadPrivateFile({ file });
      onChange({ file_uri: res.file_uri, file_name: file.name, file_size: file.size, mime_type: file.type });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-muted/40 px-4 py-6 text-center hover:border-primary/40 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : value?.file_uri ? <FileCheck2 className="h-5 w-5 text-success" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
        <span className="text-[13px] font-semibold text-navy">
          {busy ? "Uploading…" : value?.file_uri ? value.file_name : "Choose a file to upload"}
        </span>
        <span className="text-[12px] text-muted-foreground">PDF, PNG, JPG or WEBP · max 10 MB · stored privately</span>
      </button>
      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}