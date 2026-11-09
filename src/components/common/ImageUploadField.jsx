import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Upload, Loader2, X } from "lucide-react";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * @param {{ value?: string, onChange: (value: string) => void, label?: string, shape?: "square" | "circle" }} props
 */
export default function ImageUploadField({ value, onChange, label = "Upload image", shape = "square" }) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /** @param {File | undefined} file */
  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Images must be smaller than 5 MB.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const core = /** @type {typeof base44.integrations.Core & { UploadPublicFile: (args: { file: File }) => Promise<{ file_url: string }> }} */ (base44.integrations.Core);
      const res = await core.UploadPublicFile({ file });
      onChange(res.file_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        {value ? (
          <div className={`relative overflow-hidden border border-border ${shape === "circle" ? "h-16 w-16 rounded-full" : "h-16 w-24 rounded-md"}`}>
            <Image src={value} alt="" fittingType="fill" className="h-full w-full" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-navy/70 text-white"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className={`grid place-items-center border border-dashed border-border bg-muted/40 text-muted-foreground ${shape === "circle" ? "h-16 w-16 rounded-full" : "h-16 w-24 rounded-md"}`}>
            <Upload className="h-5 w-5" />
          </div>
        )}
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-border bg-background px-3 text-[13px] font-semibold text-navy hover:bg-muted disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {busy ? "Uploading…" : label}
          </button>
          <p className="mt-1 text-[12px] text-muted-foreground">Images are stored publicly — anyone with the link can open them.</p>
        </div>
      </div>
      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}