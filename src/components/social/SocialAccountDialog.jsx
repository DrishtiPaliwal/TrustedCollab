import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PLATFORMS } from "@/lib/constants";
import { logAudit } from "@/lib/helpers";
import { Loader2 } from "lucide-react";

const EMPTY = {
  platform: "instagram", handle: "", account_url: "", followers: "", reach: "", impressions: "",
  engagement_rate: "", average_views: "", content_count: "", audience_geography: "", notes: "",
};

/** @typedef {typeof EMPTY} Form */
/**
 * @typedef {Object} SocialAccountDialogProps
 * @property {boolean} open
 * @property {(open: boolean) => void} onOpenChange
 * @property {({ id: string, data_source?: string, verification_status?: string } & Partial<Form>) | null | undefined} account
 * @property {string} [subjectName]
 * @property {() => void} [onSaved]
 */

/** @param {SocialAccountDialogProps} props */
export default function SocialAccountDialog({ open, onOpenChange, account, subjectName, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [requestVerification, setRequestVerification] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(account ? /** @type {Form} */ ({ ...EMPTY, ...account }) : EMPTY);
    setRequestVerification(!account);
    setError("");
  }, [open, account]);

  /** @param {keyof Form} key @param {string} value */
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  /** @param {string | number | null | undefined} v */
  const num = (v) => (v === "" || v === null || v === undefined ? undefined : Number(v));

  /** @param {import("react").FormEvent<HTMLFormElement>} e */
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        user_id: user.id,
        platform: form.platform,
        handle: form.handle,
        account_url: form.account_url,
        followers: num(form.followers) || 0,
        reach: num(form.reach) || 0,
        impressions: num(form.impressions) || 0,
        engagement_rate: num(form.engagement_rate) || 0,
        average_views: num(form.average_views) || 0,
        content_count: num(form.content_count) || 0,
        audience_geography: form.audience_geography,
        notes: form.notes,
        last_synced_at: new Date().toISOString(),
        data_source: account?.data_source === "oauth_connected" ? "oauth_connected" : "self_reported",
        verification_status: account?.verification_status || "not_submitted",
      };

      let saved;
      if (account) {
        saved = await base44.entities.SocialAccount.update(account.id, payload);
        await logAudit(user, "social_account.updated", "SocialAccount", account.id, form.platform);
      } else {
        saved = await base44.entities.SocialAccount.create(payload);
        await base44.entities.SocialMetric.create({
          social_account_id: saved.id,
          user_id: user.id,
          platform: form.platform,
          metric_date: new Date().toISOString().slice(0, 10),
          followers: payload.followers,
          reach: payload.reach,
          impressions: payload.impressions,
          engagement_rate: payload.engagement_rate,
          views: payload.average_views,
          posts: payload.content_count,
          data_source: "self_reported",
        });
        await logAudit(user, "social_account.connected", "SocialAccount", saved.id, form.platform);
      }

      if (requestVerification && saved) {
        await base44.entities.VerificationRecord.create({
          subject_user_id: user.id,
          subject_name: subjectName || user.full_name || user.email,
          subject_type: "social_account",
          category: "social",
          related_id: saved.id,
          related_name: `${form.platform} ${form.handle}`,
          status: "pending",
          submitted_at: new Date().toISOString(),
          method: "administrator",
        });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-[20px] font-bold text-navy">{account ? "Edit social account" : "Add a social account"}</DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground">
            Enter figures from the platform’s own analytics. Manual figures are permanently labelled self-reported; verification means our team matched them against the platform.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-[13px] font-semibold text-navy">Platform</Label>
              <Select value={form.platform} onValueChange={(v) => set("platform", v)}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Handle</Label>
              <Input value={form.handle} onChange={(e) => set("handle", e.target.value)} className="mt-1.5 h-11" placeholder="@yourhandle" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[13px] font-semibold text-navy">Account URL</Label>
              <Input value={form.account_url} onChange={(e) => set("account_url", e.target.value)} className="mt-1.5 h-11" placeholder="https://" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Followers / subscribers</Label>
              <Input type="number" min="0" value={form.followers} onChange={(e) => set("followers", e.target.value)} className="mt-1.5 h-11" />
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
              <Label className="text-[13px] font-semibold text-navy">Engagement rate (%)</Label>
              <Input type="number" step="0.1" min="0" value={form.engagement_rate} onChange={(e) => set("engagement_rate", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Average views</Label>
              <Input type="number" min="0" value={form.average_views} onChange={(e) => set("average_views", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Content count</Label>
              <Input type="number" min="0" value={form.content_count} onChange={(e) => set("content_count", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[13px] font-semibold text-navy">Audience geography</Label>
              <Input value={form.audience_geography} onChange={(e) => set("audience_geography", e.target.value)} className="mt-1.5 h-11" placeholder="India 62%, UAE 14%, US 9%" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[13px] font-semibold text-navy">Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/40 p-3">
            <Checkbox checked={requestVerification} onCheckedChange={(checked) => setRequestVerification(checked === true)} id="req-verification" className="mt-0.5" />
            <label htmlFor="req-verification" className="text-[13px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-navy">Request verification</span> — adds this account to the administrator review queue. It stays pending until reviewed.
            </label>
          </div>

          {error && <p className="text-[13px] text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">Cancel</Button>
            <Button type="submit" disabled={saving} className="h-11 bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}