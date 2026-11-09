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
import { Eye, FileCheck2, Loader2, ShieldCheck } from "lucide-react";
import { formatDate, formatDateTime, logAudit, notifyUser, toItems } from "@/lib/helpers";
import { VERIFICATION_CATEGORY_LABEL, DOCUMENT_TYPES } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";

export default function AdminVerifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("records");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [items, setItems] = useState(/** @type {any[]} */ ([]));
  const [busy, setBusy] = useState(true);
  const [target, setTarget] = useState(/** @type {any | null} */ (null));
  const [decision, setDecision] = useState({ status: "verified", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setBusy(true);
    const query = statusFilter === "all" ? {} : { [tab === "records" ? "status" : "verification_status"]: statusFilter };
    const entity = tab === "records" ? "VerificationRecord" : tab === "documents" ? "Document" : "Product";
    const res = await base44.entities[entity].filter(query, { sort: "created_date", limit: 80 });
    setItems(toItems(res));
    setBusy(false);
  };

  useEffect(() => { load(); }, [tab, statusFilter]);

  /** @param {any} item */
  const openReview = (item) => {
    setTarget(item);
    setDecision({ status: "verified", notes: "" });
  };

  /** @param {any} doc */
  const viewFile = async (doc) => {
    try {
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_uri, expires_in: 300 });
      window.open(res.signed_url, "_blank", "noopener,noreferrer");
    } catch {
      toast({ title: "Could not open file", variant: "destructive" });
    }
  };

  /** @param {import("react").FormEvent<HTMLFormElement>} e */
  const apply = async (e) => {
    e.preventDefault();
    if (!target) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (tab === "records") {
        await base44.entities.VerificationRecord.update(target.id, {
          status: decision.status,
          reviewer_notes: decision.notes,
          reviewed_by: user.email,
          reviewed_at: now,
        });
        if (target.evidence_document_id) {
          await base44.entities.Document.update(target.evidence_document_id, {
            verification_status: decision.status,
            review_notes: decision.notes,
            reviewed_by: user.email,
            reviewed_at: now,
          });
        }
        await notifyUser(target.subject_user_id, {
          title: `Verification ${decision.status.replace("_", " ")}`,
          body: `${VERIFICATION_CATEGORY_LABEL[target.category] || target.category}: ${decision.notes || "See your verification page."}`,
          type: "verification",
          link: "/verification",
        });
      } else if (tab === "documents") {
        await base44.entities.Document.update(target.id, {
          verification_status: decision.status,
          review_notes: decision.notes,
          reviewed_by: user.email,
          reviewed_at: now,
        });
        const related = await base44.entities.VerificationRecord.filter({ evidence_document_id: target.id }, { limit: 5 });
        for (const rec of toItems(related)) {
          await base44.entities.VerificationRecord.update(rec.id, { status: decision.status, reviewer_notes: decision.notes, reviewed_by: user.email, reviewed_at: now });
        }
        if (target.related_type === "product" && target.related_id) {
          await base44.entities.Product.update(target.related_id, { verification_status: decision.status });
        }
        await notifyUser(target.user_id, {
          title: `Document ${decision.status.replace("_", " ")}`,
          body: `${target.title}: ${decision.notes || "Reviewed by an administrator."}`,
          type: "verification",
          link: "/documents",
        });
      } else {
        await base44.entities.Product.update(target.id, { verification_status: decision.status });
        await notifyUser(target.user_id, {
          title: `Product ${decision.status.replace("_", " ")}`,
          body: `${target.name}: ${decision.notes || "Reviewed by an administrator."}`,
          type: "verification",
          link: "/products",
        });
      }
      await logAudit(user, `${tab}.reviewed`, tab === "records" ? "VerificationRecord" : tab === "documents" ? "Document" : "Product", target.id, `${decision.status}: ${decision.notes}`);
      toast({ title: "Decision recorded", description: "The account owner has been notified." });
      setTarget(null);
      load();
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Unknown error";
      toast({ title: "Could not save the review", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Verification queue"
        description="Review submitted evidence. A decision here is what makes something verified — never an upload alone."
        actions={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="requires_renewal">Renewal needed</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setStatusFilter("pending"); }} className="mb-4">
        <TabsList className="h-11 bg-muted p-1">
          {[["records", "Verification records"], ["documents", "Documents"], ["products", "Products"]].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="min-h-[36px] px-3 text-[13px] data-[state=active]:bg-background data-[state=active]:text-navy">{l}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <SectionCard bodyClassName="p-0">
        {busy ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-muted-foreground">Nothing with this status.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Subject", "Type", "Evidence / details", "Submitted", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-5 py-4">
                      <p className="text-[14px] font-semibold text-navy">{tab === "records" ? item.subject_name || item.related_name : tab === "documents" ? item.title : item.name}</p>
                      <p className="text-[12px] text-muted-foreground">{tab === "records" ? item.subject_type : tab === "documents" ? item.file_name : item.brand_name}</p>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-muted-foreground">
                      {tab === "records" ? VERIFICATION_CATEGORY_LABEL[item.category] || item.category : tab === "documents" ? DOCUMENT_TYPES.find((d) => d.value === item.document_type)?.label : item.category}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-muted-foreground">
                      {tab === "records" ? item.related_name || "—" : tab === "documents" ? `${item.issuer || "Issuer not stated"}${item.document_number ? ` · ${item.document_number}` : ""}` : (item.product_claims || item.description || "—")?.slice(0, 90)}
                      {tab === "documents" && item.expiry_date && <span className="block text-[12px]">Expires {formatDate(item.expiry_date)}</span>}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-muted-foreground">{formatDateTime(item.submitted_at || item.created_date)}</td>
                    <td className="px-5 py-4"><StatusPill status={tab === "records" ? item.status : item.verification_status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {tab === "documents" && (
                          <Button variant="ghost" size="sm" onClick={() => viewFile(item)} className="h-9 text-[13px]"><Eye className="mr-1 h-3.5 w-3.5" /> View</Button>
                        )}
                        <Button size="sm" onClick={() => openReview(item)} className="h-9 bg-primary text-[13px] hover:bg-primary/90"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Review</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog open={Boolean(target)} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-[19px] font-bold text-navy">Record a decision</DialogTitle>
            <DialogDescription className="text-[14px] text-muted-foreground">
              The owner is notified and the outcome appears on their verification page. Notes are visible to them.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={apply} className="space-y-4">
            <div>
              <Label className="text-[13px] font-semibold text-navy">Decision</Label>
              <Select value={decision.status} onValueChange={(v) => setDecision((d) => ({ ...d, status: v }))}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="requires_renewal">Requires renewal</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Reviewer notes</Label>
              <Textarea rows={4} value={decision.notes} onChange={(e) => setDecision((d) => ({ ...d, notes: e.target.value }))} className="mt-1.5" placeholder="What you checked and what you found." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTarget(null)} className="h-11">Cancel</Button>
              <Button type="submit" disabled={saving} className="h-11 bg-primary hover:bg-primary/90">
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save decision
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <p className="mt-3 flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <FileCheck2 className="h-4 w-4 text-primary" /> Approving a record linked to a document also updates that document, keeping both views consistent.
      </p>
    </div>
  );
}