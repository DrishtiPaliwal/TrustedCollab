import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatusPill from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Flag, Loader2 } from "lucide-react";
import { formatDate, formatDateTime, logAudit, notifyUser, toItems } from "@/lib/helpers";
import { useToast } from "@/components/ui/use-toast";

/** @typedef {{ id: string, [key: string]: any }} CaseItem */

export default function AdminDisputes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("disputes");
  const [disputes, setDisputes] = useState(/** @type {CaseItem[]} */ ([]));
  const [reports, setReports] = useState(/** @type {CaseItem[]} */ ([]));
  const [busy, setBusy] = useState(true);
  const [target, setTarget] = useState(/** @type {CaseItem | null} */ (null));
  const [form, setForm] = useState({ status: "under_review", notes: "", resolution: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setBusy(true);
    const [d, r] = await Promise.all([
      base44.entities.Dispute.filter({}, { sort: "-created_date", limit: 60 }),
      base44.entities.ReportedProfile.filter({}, { sort: "-created_date", limit: 60 }),
    ]);
    setDisputes(toItems(d));
    setReports(toItems(r));
    setBusy(false);
  };

  useEffect(() => { load(); }, []);

  /** @param {CaseItem} item */
  const open = (item) => {
    setTarget(item);
    setForm({ status: item.status === "open" ? "under_review" : item.status, notes: item.admin_notes || "", resolution: item.resolution || "" });
  };

  /** @param {import("react").FormEvent<HTMLFormElement>} e */
  const save = async (e) => {
    e.preventDefault();
    if (!target) return;
    setSaving(true);
    try {
      if (tab === "disputes") {
        await base44.entities.Dispute.update(target.id, {
          status: form.status,
          admin_notes: form.notes,
          resolution: form.resolution,
          resolved_at: ["resolved", "dismissed"].includes(form.status) ? new Date().toISOString() : undefined,
        });
        await notifyUser(target.raised_by_user_id, { title: "Dispute updated", body: `“${target.campaign_title || target.category}” is now ${form.status.replace("_", " ")}.`, type: "dispute", link: "/campaigns" });
        await notifyUser(target.against_user_id, { title: "Dispute updated", body: `A dispute involving “${target.campaign_title || target.category}” is now ${form.status.replace("_", " ")}.`, type: "dispute", link: "/campaigns" });
        await logAudit(user, "dispute.updated", "Dispute", target.id, form.status);
      } else {
        await base44.entities.ReportedProfile.update(target.id, { status: form.status, admin_notes: form.notes });
        await notifyUser(target.reporter_user_id, { title: "Report reviewed", body: `Your report on ${target.reported_name} is ${form.status.replace("_", " ")}.`, type: "dispute", link: "/marketplace" });
        await logAudit(user, "report.updated", "ReportedProfile", target.id, form.status);
      }
      toast({ title: "Case updated" });
      setTarget(null);
      load();
    } catch (err) {
      toast({ title: "Could not update the case", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const list = tab === "disputes" ? disputes : reports;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Disputes & reported profiles"
        description="Campaign disputes and profile reports. Both parties can see the outcome; only administrators write the decision."
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-11 bg-muted p-1">
          <TabsTrigger value="disputes" className="min-h-[36px] px-4 text-[13px] data-[state=active]:bg-background data-[state=active]:text-navy"><AlertTriangle className="mr-1.5 h-4 w-4" /> Disputes</TabsTrigger>
          <TabsTrigger value="reports" className="min-h-[36px] px-4 text-[13px] data-[state=active]:bg-background data-[state=active]:text-navy"><Flag className="mr-1.5 h-4 w-4" /> Reported profiles</TabsTrigger>
        </TabsList>
      </Tabs>

      {busy ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : list.length === 0 ? (
        <SectionCard bodyClassName="p-8"><p className="text-center text-[13px] text-muted-foreground">Nothing to review here.</p></SectionCard>
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <SectionCard key={item.id} bodyClassName="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-[15.5px] font-bold text-navy">
                      {tab === "disputes" ? item.campaign_title || item.category : item.reported_name}
                    </h3>
                    <StatusPill status={item.status === "open" ? "pending" : item.status === "resolved" ? "verified" : item.status === "dismissed" ? "not_submitted" : "pending"} label={item.status.replace("_", " ")} />
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {tab === "disputes"
                      ? `${item.category.replace(/_/g, " ")} · raised by ${item.raised_by_name || "—"} against ${item.against_name || "—"}`
                      : `${item.reason.replace(/_/g, " ")} · reported by ${item.reporter_name || "—"}`}
                  </p>
                  <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">{tab === "disputes" ? item.description : item.details || "No details provided."}</p>
                  {item.admin_notes && <p className="mt-2 rounded border border-border bg-muted/50 px-2.5 py-2 text-[12px] text-muted-foreground">Admin: {item.admin_notes}</p>}
                  <p className="mt-2 text-[12px] text-muted-foreground">Opened {formatDate(item.created_date)} · last update {formatDateTime(item.updated_date)}</p>
                </div>
                <Button onClick={() => open(item)} className="h-10 shrink-0 bg-primary hover:bg-primary/90">Review case</Button>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={Boolean(target)} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-[19px] font-bold text-navy">Update case</DialogTitle>
            <DialogDescription className="text-[14px] text-muted-foreground">Both sides are notified of the status change.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label className="text-[13px] font-semibold text-navy">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_review">Under review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {tab === "disputes" && (
              <div>
                <Label className="text-[13px] font-semibold text-navy">Resolution</Label>
                <Textarea rows={2} value={form.resolution} onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))} className="mt-1.5" placeholder="What was agreed or decided." />
              </div>
            )}
            <div>
              <Label className="text-[13px] font-semibold text-navy">Internal notes</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="mt-1.5" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTarget(null)} className="h-11">Cancel</Button>
              <Button type="submit" disabled={saving} className="h-11 bg-primary hover:bg-primary/90">
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}