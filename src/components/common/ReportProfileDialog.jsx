import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { logAudit } from "@/lib/helpers";
import { Loader2 } from "lucide-react";

const REASONS = [
  { value: "fake_metrics", label: "Metrics look fabricated" },
  { value: "misleading_claims", label: "Misleading product claims" },
  { value: "fake_documents", label: "Documents appear altered or fake" },
  { value: "impersonation", label: "Impersonation" },
  { value: "conduct", label: "Unprofessional conduct" },
  { value: "other", label: "Something else" },
];

/** @param {{ open: boolean, onOpenChange: (open: boolean) => void, subject: string, subjectName: string }} props */
export default function ReportProfileDialog({ open, onOpenChange, subject, subjectName }) {
  const { user } = useAuth();
  const [reason, setReason] = useState("fake_metrics");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  /** @param {import("react").FormEvent<HTMLFormElement>} e */
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await base44.entities.ReportedProfile.create({
        reported_user_id: subject,
        reported_name: subjectName,
        reporter_user_id: user.id,
        reporter_name: user.full_name || user.email,
        reason,
        details,
        status: "open",
      });
      await logAudit(user, "profile.reported", "ReportedProfile", subject, reason);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send this report.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setDone(false); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-[19px] font-bold text-navy">Report this profile</DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground">
            Reports go only to platform administrators. Include what you believe is inaccurate and why.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="space-y-4">
            <p className="rounded-md border border-success/25 bg-success-tint px-4 py-3 text-[14px] text-success">
              Report submitted. An administrator will review it.
            </p>
            <Button onClick={() => onOpenChange(false)} className="h-11 w-full bg-primary hover:bg-primary/90">Close</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-[13px] font-semibold text-navy">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">What should we look at?</Label>
              <Textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} className="mt-1.5" placeholder="Specific claims, links or figures." />
            </div>
            {error && <p className="text-[13px] text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">Cancel</Button>
              <Button type="submit" disabled={busy} className="h-11 bg-danger hover:bg-danger/90">
                {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Submit report
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}