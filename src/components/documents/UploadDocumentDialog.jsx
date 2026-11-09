import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DocumentFileField from "@/components/common/DocumentFileField";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { logAudit } from "@/lib/helpers";
import { Loader2 } from "lucide-react";

/**
 * @typedef {{ title: string, document_type: string, related_type: string, related_id: string, issuer: string, document_number: string, issue_date: string, expiry_date: string }} FormState
 * @typedef {{ id: string, name: string }} RelatedOption
 * @typedef {{ open: boolean, onOpenChange: (open: boolean) => void, ownerType: string, products?: RelatedOption[], campaigns?: RelatedOption[], subjectName?: string, onSaved?: () => void }} UploadDocumentDialogProps
 */

/** @param {UploadDocumentDialogProps} props */
export default function UploadDocumentDialog({ open, onOpenChange, ownerType, products = [], campaigns = [], subjectName, onSaved }) {
  const { user } = useAuth();
  /** @type {[FormState, import("react").Dispatch<import("react").SetStateAction<FormState>>]} */
  const [form, setForm] = useState({
    title: "", document_type: "lab_report", related_type: "none", related_id: "",
    issuer: "", document_number: "", issue_date: "", expiry_date: "",
  });
  /** @type {[import("react").ComponentProps<typeof DocumentFileField>["value"] | undefined, import("react").Dispatch<import("react").SetStateAction<import("react").ComponentProps<typeof DocumentFileField>["value"] | undefined>>]} */
  const [file, setFile] = useState(/** @type {import("react").ComponentProps<typeof DocumentFileField>["value"] | undefined} */ (undefined));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ title: "", document_type: ownerType === "brand" ? "lab_report" : "identity", related_type: "none", related_id: "", issuer: "", document_number: "", issue_date: "", expiry_date: "" });
      setFile(undefined);
      setError("");
    }
  }, [open, ownerType]);

  /** @template {keyof FormState} K @param {K} key @param {FormState[K]} value */
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const relatedOptions = form.related_type === "product" ? products : form.related_type === "campaign" ? campaigns : [];
  const relatedName = relatedOptions.find((r) => r.id === form.related_id)?.name;

  /** @param {import("react").FormEvent<HTMLFormElement>} e */
  const submit = async (e) => {
    e.preventDefault();
    if (!file?.file_uri) {
      setError("Attach a file before submitting.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const docType = DOCUMENT_TYPES.find((d) => d.value === form.document_type);
      const doc = await base44.entities.Document.create({
        user_id: user.id,
        owner_type: ownerType,
        document_type: form.document_type,
        title: form.title,
        ...file,
        related_type: form.related_type,
        related_id: form.related_type === "none" ? undefined : form.related_id,
        related_name: relatedName,
        issuer: form.issuer,
        document_number: form.document_number,
        issue_date: form.issue_date || undefined,
        expiry_date: form.expiry_date || undefined,
        verification_status: "pending",
      });

      await base44.entities.VerificationRecord.create({
        subject_user_id: user.id,
        subject_name: subjectName || user.full_name || user.email,
        subject_type: form.related_type === "product" ? "product" : ownerType,
        category: docType?.category || "product_document",
        related_id: doc.id,
        related_name: form.title,
        evidence_document_id: doc.id,
        status: "pending",
        submitted_at: new Date().toISOString(),
        method: "administrator",
      });

      if (form.related_type === "product" && form.related_id) {
        await base44.entities.Product.update(form.related_id, { verification_status: "pending" });
      }

      await logAudit(user, "document.uploaded", "Document", doc.id, form.title);
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the document.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-[20px] font-bold text-navy">Upload a document</DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground">
            Files are private: only you and platform administrators can open them. Nothing is marked verified automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-[13px] font-semibold text-navy">Document title *</Label>
            <Input required value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-1.5 h-11" placeholder="Dermatology lab report — Q2 2026" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-[13px] font-semibold text-navy">Document type</Label>
              <Select value={form.document_type} onValueChange={(v) => set("document_type", v)}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{DOCUMENT_TYPES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Relates to</Label>
              <Select value={form.related_type} onValueChange={(v) => { set("related_type", v); set("related_id", ""); }}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Profile / company</SelectItem>
                  <SelectItem value="product">A product</SelectItem>
                  <SelectItem value="campaign">A campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.related_type !== "none" && (
              <div className="sm:col-span-2">
                <Label className="text-[13px] font-semibold text-navy">Select {form.related_type}</Label>
                <Select value={form.related_id} onValueChange={(v) => set("related_id", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder={`Choose a ${form.related_type}`} /></SelectTrigger>
                  <SelectContent>
                    {relatedOptions.length === 0 && <SelectItem value="none" disabled>No {form.related_type}s yet</SelectItem>}
                    {relatedOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-[13px] font-semibold text-navy">Issuing authority</Label>
              <Input value={form.issuer} onChange={(e) => set("issuer", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Certificate / document number</Label>
              <Input value={form.document_number} onChange={(e) => set("document_number", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Issue date</Label>
              <Input type="date" value={form.issue_date} onChange={(e) => set("issue_date", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Expiry date</Label>
              <Input type="date" value={form.expiry_date} onChange={(e) => set("expiry_date", e.target.value)} className="mt-1.5 h-11" />
            </div>
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">File</Label>
            <div className="mt-1.5"><DocumentFileField value={file} onChange={setFile} /></div>
          </div>
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">Cancel</Button>
            <Button type="submit" disabled={saving} className="h-11 bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Submit for review
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}