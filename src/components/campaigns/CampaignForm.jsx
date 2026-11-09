import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ATTRIBUTION_METHODS } from "@/lib/constants";
import { calcRoi, logAudit, notifyUser } from "@/lib/helpers";
import { Loader2 } from "lucide-react";

/** @typedef {{ title: string, product_name: string, objective: string, start_date: string, end_date: string, deliverables: string, content_links: string, budget: string, creator_fee: string, reach: string, impressions: string, views: string, clicks: string, conversions: string, revenue_attributed: string, attribution_method: string, evidence_summary: string, performance_source: string, status: string, partner_name: string }} CampaignFormState */

/** @type {CampaignFormState} */
const EMPTY = {
  title: "", product_name: "", objective: "", start_date: "", end_date: "", deliverables: "",
  content_links: "", budget: "", creator_fee: "", reach: "", impressions: "", views: "", clicks: "",
  conversions: "", revenue_attributed: "", attribution_method: ATTRIBUTION_METHODS[0],
  evidence_summary: "", performance_source: "self_reported", status: "active", partner_name: "",
};

/**
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, campaign?: Record<string, any> | null, perspective: "brand" | "creator", profile?: { id?: string, brand_name?: string, full_name?: string } | null, onSaved?: () => void }} props
 */
export default function CampaignForm({ open, onOpenChange, campaign, perspective, profile, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (campaign) {
      setForm({
        ...EMPTY,
        ...campaign,
        content_links: (campaign.content_links || []).join("\n"),
        partner_name: perspective === "brand" ? campaign.creator_name || "" : campaign.brand_name || "",
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [open, campaign, perspective]);

  /** @param {keyof CampaignFormState} key @param {string} value */
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const duration = () => {
    if (!form.start_date || !form.end_date) return undefined;
    const days = Math.round((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000) + 1;
    return days > 0 ? days : undefined;
  };

  /** @param {import("react").FormEvent<HTMLFormElement>} e */
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const cost = form.creator_fee ? Number(form.creator_fee) : Number(form.budget) || null;
      const revenue = form.revenue_attributed ? Number(form.revenue_attributed) : null;
      /** @type {Record<string, any>} */
      const payload = {
        title: form.title,
        product_name: form.product_name,
        objective: form.objective,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        duration_days: duration(),
        deliverables: form.deliverables,
        content_links: form.content_links ? form.content_links.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) : [],
        budget: form.budget ? Number(form.budget) : undefined,
        creator_fee: form.creator_fee ? Number(form.creator_fee) : undefined,
        reach: form.reach ? Number(form.reach) : undefined,
        impressions: form.impressions ? Number(form.impressions) : undefined,
        views: form.views ? Number(form.views) : undefined,
        clicks: form.clicks ? Number(form.clicks) : undefined,
        conversions: form.conversions ? Number(form.conversions) : undefined,
        revenue_attributed: revenue,
        roi: calcRoi(revenue, cost),
        attribution_method: form.attribution_method,
        evidence_summary: form.evidence_summary,
        performance_source: form.performance_source,
        status: form.status,
        brand_profile_id: profile?.id,
      };

      if (perspective === "brand") {
        Object.assign(payload, { brand_user_id: user.id, brand_name: profile?.brand_name || user.full_name, creator_name: form.partner_name });
      } else {
        Object.assign(payload, { creator_user_id: user.id, creator_name: profile?.full_name || user.full_name, brand_name: form.partner_name });
      }

      const existingCreatorId = campaign?.creator_user_id;

      if (campaign) {
        await base44.entities.Campaign.update(campaign.id, payload);
        await logAudit(user, "campaign.updated", "Campaign", campaign.id, form.title);
      } else {
        const created = await base44.entities.Campaign.create({
          ...payload,
          brand_confirmed: perspective === "brand",
          creator_confirmed: perspective === "creator",
        });
        await base44.entities.CampaignParticipant.bulkCreate([
          { campaign_id: created.id, campaign_title: form.title, user_id: user.id, name: user.full_name || user.email, role: perspective, confirmed: true, confirmed_at: new Date().toISOString() },
        ]);
        if (perspective === "brand" && existingCreatorId) {
          await notifyUser(existingCreatorId, { title: "Campaign updated", body: `${payload.brand_name} recorded “${form.title}”.`, type: "campaign" });
        }
        await logAudit(user, "campaign.created", "Campaign", created.id, form.title);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this campaign.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-[20px] font-bold text-navy">{campaign ? "Edit campaign" : perspective === "brand" ? "Record a campaign" : "Add a collaboration"}</DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground">
            Results you enter are marked self-reported until supporting evidence is reviewed. Both sides must confirm a completed campaign.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-[13px] font-semibold text-navy">Campaign title *</Label>
              <Input required value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-1.5 h-11" placeholder="Spring skincare launch" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">{perspective === "brand" ? "Creator" : "Brand"}</Label>
              <Input value={form.partner_name} onChange={(e) => set("partner_name", e.target.value)} className="mt-1.5 h-11" placeholder={perspective === "brand" ? "Creator name" : "Brand name"} />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Product promoted</Label>
              <Input value={form.product_name} onChange={(e) => set("product_name", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Start date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">End date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[13px] font-semibold text-navy">Objective</Label>
              <Input value={form.objective} onChange={(e) => set("objective", e.target.value)} className="mt-1.5 h-11" placeholder="Awareness, launch, conversions…" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[13px] font-semibold text-navy">Deliverables</Label>
              <Textarea rows={2} value={form.deliverables} onChange={(e) => set("deliverables", e.target.value)} className="mt-1.5" placeholder="1 reel, 2 stories, usage rights 30 days" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[13px] font-semibold text-navy">Content links</Label>
              <Textarea rows={2} value={form.content_links} onChange={(e) => set("content_links", e.target.value)} className="mt-1.5" placeholder="One URL per line" />
            </div>
          </div>

          <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
            <p className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">Money & results</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-[13px] font-semibold text-navy">Campaign budget</Label>
                <Input type="number" min="0" value={form.budget} onChange={(e) => set("budget", e.target.value)} className="mt-1.5 h-11" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Creator fee</Label>
                <Input type="number" min="0" value={form.creator_fee} onChange={(e) => set("creator_fee", e.target.value)} className="mt-1.5 h-11" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Reach</Label>
                <Input type="number" min="0" value={form.reach} onChange={(e) => set("reach", e.target.value)} className="mt-1.5 h-11" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Impressions</Label>
                <Input type="number" min="0" value={form.impressions} onChange={(e) => set("impressions", e.target.value)} className="mt-1.5 h-11" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Views</Label>
                <Input type="number" min="0" value={form.views} onChange={(e) => set("views", e.target.value)} className="mt-1.5 h-11" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Clicks</Label>
                <Input type="number" min="0" value={form.clicks} onChange={(e) => set("clicks", e.target.value)} className="mt-1.5 h-11" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Conversions</Label>
                <Input type="number" min="0" value={form.conversions} onChange={(e) => set("conversions", e.target.value)} className="mt-1.5 h-11" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Revenue attributed</Label>
                <Input type="number" min="0" value={form.revenue_attributed} onChange={(e) => set("revenue_attributed", e.target.value)} className="mt-1.5 h-11" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Attribution method</Label>
                <Select value={form.attribution_method} onValueChange={(v) => set("attribution_method", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{ATTRIBUTION_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Performance source</Label>
                <Select value={form.performance_source} onValueChange={(v) => set("performance_source", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self_reported">Self-reported</SelectItem>
                    <SelectItem value="independently_verified">Independently verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-[13px] font-semibold text-navy">Evidence summary</Label>
                <Textarea rows={2} value={form.evidence_summary} onChange={(e) => set("evidence_summary", e.target.value)} className="mt-1.5" placeholder="What supports these numbers — receipts, platform screenshots, brand-side order data." />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error && <p className="text-[13px] text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">Cancel</Button>
            <Button type="submit" disabled={saving} className="h-11 bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}