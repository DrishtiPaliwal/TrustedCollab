import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatusPill from "@/components/common/StatusPill";
import StatTile from "@/components/common/StatTile";
import EmptyState from "@/components/common/EmptyState";
import CampaignForm from "@/components/campaigns/CampaignForm";
import useProfile from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, FolderKanban, Loader2, Pencil, Plus, ShieldCheck } from "lucide-react";
import { formatDate, formatMoney, formatNumber, logAudit, notifyUser, toItems } from "@/lib/helpers";
import { useToast } from "@/components/ui/use-toast";

/** @type {any} */
const folderIcon = FolderKanban;
/** @type {any} */
const shieldIcon = ShieldCheck;

export default function Campaigns() {
  const { user } = useAuth();
  const { creatorProfile, brandProfile } = useProfile();
  const { toast } = useToast();
  const perspective = user?.account_type === "brand" ? "brand" : user?.account_type === "creator" ? "creator" : null;
  /** @type {any} */
  const profile = perspective === "brand" ? (brandProfile || {}) : (creatorProfile || {});

  const [campaigns, setCampaigns] = useState(/** @type {any[]} */ ([]));
  const [busy, setBusy] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(/** @type {any} */ (null));
  const [disputeFor, setDisputeFor] = useState(/** @type {any} */ (null));
  const [dispute, setDispute] = useState({ category: "deliverable", description: "" });
  const [savingDispute, setSavingDispute] = useState(false);

  const load = async () => {
    if (!user?.id || !perspective) { setBusy(false); return; }
    setBusy(true);
    const res = await base44.entities.Campaign.filter(
      perspective === "brand" ? { brand_user_id: user.id } : { creator_user_id: user.id },
      { sort: "-start_date", limit: 60 }
    );
    setCampaigns(toItems(res));
    setBusy(false);
  };

  useEffect(() => { load(); }, [user?.id, perspective]);

  const stats = useMemo(() => {
    const confirmed = campaigns.filter((c) => c.brand_confirmed && c.creator_confirmed).length;
    const spend = campaigns.reduce((s, c) => s + (c.creator_fee || c.budget || 0), 0);
    const revenue = campaigns.reduce((s, c) => s + (c.revenue_attributed || 0), 0);
    const withRoi = campaigns.filter((c) => typeof c.roi === "number");
    const avgRoi = withRoi.length ? Math.round(withRoi.reduce((s, c) => s + c.roi, 0) / withRoi.length) : null;
    return { confirmed, spend, revenue, avgRoi };
  }, [campaigns]);

  const confirmCampaign = async (/** @type {any} */ c) => {
    const field = perspective === "brand" ? { brand_confirmed: true } : { creator_confirmed: true };
    const otherConfirmed = perspective === "brand" ? c.creator_confirmed : c.brand_confirmed;
    await base44.entities.Campaign.update(c.id, { ...field, ...(otherConfirmed ? { status: "completed" } : {}) });
    await logAudit(user, "campaign.confirmed", "Campaign", c.id, c.title);
    const otherUser = perspective === "brand" ? c.creator_user_id : c.brand_user_id;
    await notifyUser(otherUser, { title: "Campaign confirmed", body: `${user.full_name || user.email} confirmed “${c.title}”.`, type: "campaign", link: "/campaigns" });
    toast({ title: "Confirmation recorded", description: otherConfirmed ? "Both sides have now confirmed this campaign." : "Waiting for the other party to confirm." });
    load();
  };

  const submitDispute = async (/** @type {any} */ e) => {
    e.preventDefault();
    if (!disputeFor) return;
    setSavingDispute(true);
    try {
      const isBrand = perspective === "brand";
      await base44.entities.Dispute.create({
        campaign_id: disputeFor.id,
        campaign_title: disputeFor.title,
        raised_by_user_id: user.id,
        raised_by_name: user.full_name || user.email,
        against_user_id: isBrand ? disputeFor.creator_user_id : disputeFor.brand_user_id,
        against_name: isBrand ? disputeFor.creator_name : disputeFor.brand_name,
        category: dispute.category,
        description: dispute.description,
        status: "open",
      });
      await base44.entities.Campaign.update(disputeFor.id, { status: "disputed" });
      await logAudit(user, "dispute.raised", "Dispute", disputeFor.id, disputeFor.title);
      toast({ title: "Dispute raised", description: "An administrator will review the campaign record." });
      setDisputeFor(null);
      setDispute({ category: "deliverable", description: "" });
      load();
    } finally {
      setSavingDispute(false);
    }
  };

  if (!perspective) {
    return (
      <div>
        <PageHeader eyebrow="Collaborations" title="Finish your account setup" description="Creator and brand accounts record campaigns differently. Set up your profile first." />
        <Button asChild className="h-11 bg-primary hover:bg-primary/90"><Link to="/onboarding">Complete setup</Link></Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={perspective === "brand" ? "Campaigns" : "Collaboration history"}
        title={perspective === "brand" ? "Campaign performance" : "Your collaborations"}
        description={perspective === "brand"
          ? "Record what each campaign cost and returned, with the attribution method behind every figure."
          : "Your track record, with confirmation from the brand on each completed campaign."}
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }} className="h-11 bg-primary hover:bg-primary/90"><Plus className="mr-1.5 h-4 w-4" /> {perspective === "brand" ? "Record campaign" : "Add collaboration"}</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile label="Campaigns" value={campaigns.length} hint="Recorded on the platform" icon={folderIcon} />
        <StatTile label="Both sides confirmed" value={stats.confirmed} hint="Evidence-backed history" icon={shieldIcon} tone="success" />
        <StatTile label={perspective === "brand" ? "Creator fees" : "Earned fees"} value={formatMoney(stats.spend, profile.currency)} hint="Across recorded campaigns" icon={folderIcon} />
        <StatTile label="Average ROI" value={stats.avgRoi === null ? "—" : `${stats.avgRoi}%`} hint={stats.avgRoi === null ? "Add revenue to calculate" : "Revenue vs cost"} icon={shieldIcon} tone={stats.avgRoi && stats.avgRoi > 0 ? "success" : "warning"} />
      </div>

      <SectionCard className="mt-4" title="All campaigns" bodyClassName="p-0">
        {busy ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : campaigns.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={folderIcon}
              title="No campaigns recorded"
              description="Each record carries deliverables, results, the attribution method and supporting evidence."
              action={<Button onClick={() => { setEditing(null); setFormOpen(true); }} className="h-11 bg-primary hover:bg-primary/90">Add the first one</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Campaign", perspective === "brand" ? "Creator" : "Brand", "Dates", "Reach", "Clicks", "Fee", "ROI", "Evidence", "Confirmation", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-4 py-4">
                      <p className="text-[14px] font-semibold text-navy">{c.title}</p>
                      <p className="text-[12px] text-muted-foreground">{c.product_name || "—"}</p>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-muted-foreground">{perspective === "brand" ? c.creator_name || "—" : c.brand_name || "—"}</td>
                    <td className="px-4 py-4 text-[13px] text-muted-foreground">{formatDate(c.start_date)}<br />{c.end_date ? `→ ${formatDate(c.end_date)}` : ""}</td>
                    <td className="px-4 py-4 text-[13px] text-muted-foreground">{formatNumber(c.reach)}</td>
                    <td className="px-4 py-4 text-[13px] text-muted-foreground">{formatNumber(c.clicks)}</td>
                    <td className="px-4 py-4 text-[13px] text-muted-foreground">{formatMoney(c.creator_fee || c.budget, profile?.currency)}</td>
                    <td className="px-4 py-4 text-[13px] font-semibold text-navy">{typeof c.roi === "number" ? `${c.roi}%` : "—"}</td>
                    <td className="px-4 py-4">
                      <StatusPill status={c.performance_source === "independently_verified" ? "verified" : "pending"} label={c.performance_source === "independently_verified" ? "Verified" : "Self-reported"} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill status={c.brand_confirmed && c.creator_confirmed ? "verified" : "pending"} label={c.brand_confirmed && c.creator_confirmed ? "Both sides" : perspective === "brand" ? (c.brand_confirmed ? "You confirmed" : "Unconfirmed") : (c.creator_confirmed ? "You confirmed" : "Unconfirmed")} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {(perspective === "brand" ? !c.brand_confirmed : !c.creator_confirmed) && (
                          <Button variant="outline" size="sm" onClick={() => confirmCampaign(c)} className="h-8 text-[12px]">Confirm</Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setFormOpen(true); }} className="h-8 text-[12px]"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDisputeFor(c)} className="h-8 text-[12px] text-muted-foreground hover:text-danger"><AlertTriangle className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <p className="mt-3 text-[13px] text-muted-foreground">
        Supporting files live in <Link to="/documents" className="font-semibold text-primary hover:underline">Documents</Link>. Performance marked self-reported has not been independently checked.
      </p>

      <CampaignForm open={formOpen} onOpenChange={setFormOpen} campaign={editing} perspective={perspective} profile={profile} onSaved={load} />

      <Dialog open={Boolean(disputeFor)} onOpenChange={(v) => !v && setDisputeFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-[19px] font-bold text-navy">Raise a dispute</DialogTitle>
            <DialogDescription className="text-[14px] text-muted-foreground">
              Disputes freeze the record for review. Only administrators can resolve them.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitDispute} className="space-y-4">
            <div>
              <Label className="text-[13px] font-semibold text-navy">Category</Label>
              <Select value={dispute.category} onValueChange={(v) => setDispute((d) => ({ ...d, category: v }))}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[["deliverable", "Deliverables not met"], ["payment", "Payment"], ["performance_claim", "Performance claim"], ["evidence_authenticity", "Evidence authenticity"], ["conduct", "Conduct"], ["other", "Other"]].map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">What happened?</Label>
              <Textarea required rows={4} value={dispute.description} onChange={(e) => setDispute((d) => ({ ...d, description: e.target.value }))} className="mt-1.5" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDisputeFor(null)} className="h-11">Cancel</Button>
              <Button type="submit" disabled={savingDispute} className="h-11 bg-danger hover:bg-danger/90">{savingDispute ? "Submitting…" : "Raise dispute"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}