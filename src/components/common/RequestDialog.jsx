import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { COLLAB_TYPES } from "@/lib/constants";
import { logAudit, notifyUser } from "@/lib/helpers";
import { Loader2 } from "lucide-react";

/**
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, toUser?: { user_id?: string, name?: string, type?: string }, defaultCampaign?: string }} props
 */
export default function RequestDialog({ open, onOpenChange, toUser, defaultCampaign = "" }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    campaign_title: defaultCampaign,
    product_name: "",
    collaboration_type: COLLAB_TYPES[0],
    proposed_budget: "",
    start_date: "",
    message: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /** @param {keyof typeof form} key @param {string} value */
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  /** @param {import("react").FormEvent<HTMLFormElement>} e */
  const submit = async (e) => {
    e.preventDefault();
    if (!toUser?.user_id) {
      setError("This profile cannot receive requests yet.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const record = await base44.entities.CollaborationRequest.create({
        from_user_id: user.id,
        from_name: user.full_name || user.email,
        from_type: user.account_type || "creator",
        to_user_id: toUser.user_id,
        to_name: toUser.name,
        to_type: toUser.type,
        campaign_title: form.campaign_title,
        product_name: form.product_name,
        collaboration_type: form.collaboration_type,
        proposed_budget: form.proposed_budget ? Number(form.proposed_budget) : undefined,
        start_date: form.start_date || undefined,
        message: form.message,
        status: "pending",
      });
      await notifyUser(toUser.user_id, {
        title: "New collaboration request",
        body: `${user.full_name || user.email} sent a request for “${form.campaign_title}”.`,
        type: "request",
      });
      await logAudit(user, "collaboration_request.created", "CollaborationRequest", record.id, form.campaign_title);
      onOpenChange(false);
      setForm({ campaign_title: "", product_name: "", collaboration_type: COLLAB_TYPES[0], proposed_budget: "", start_date: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the request. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-[20px] font-bold text-navy">Request a collaboration</DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground">
            Send the outline of the work. Both sides keep a record of every request.
            {toUser?.name ? ` To ${toUser.name}.` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-[13px] font-semibold text-navy">Campaign title</Label>
            <Input required value={form.campaign_title} onChange={(e) => set("campaign_title", e.target.value)} placeholder="Spring skincare launch" className="mt-1.5 h-11" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-[13px] font-semibold text-navy">Product</Label>
              <Input value={form.product_name} onChange={(e) => set("product_name", e.target.value)} placeholder="Hydrating serum" className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Collaboration type</Label>
              <Select value={form.collaboration_type} onValueChange={(v) => set("collaboration_type", v)}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLLAB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Proposed budget</Label>
              <Input type="number" min="0" value={form.proposed_budget} onChange={(e) => set("proposed_budget", e.target.value)} placeholder="75000" className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Target start date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className="mt-1.5 h-11" />
            </div>
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Message</Label>
            <Textarea rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Deliverables, timeline and anything you need confirmed." className="mt-1.5" />
          </div>
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">Cancel</Button>
            <Button type="submit" disabled={saving} className="h-11 bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Send request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}