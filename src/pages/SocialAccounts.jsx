import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatusPill from "@/components/common/StatusPill";
import EmptyState from "@/components/common/EmptyState";
import SocialAccountDialog from "@/components/social/SocialAccountDialog";
import useProfile from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Info, Loader2, Pencil, Plus, Share2, ShieldCheck, Trash2 } from "lucide-react";
import { formatDateTime, formatNumber, logAudit, toItems } from "@/lib/helpers";
import { platformLabel } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";

/** @typedef {{ id: string, platform: string, handle?: string, account_url?: string, followers?: number, reach?: number, engagement_rate?: number, verification_status?: string, data_source?: string, last_synced_at?: string | null }} SocialAccount */

const emptySocialAccount = {
  id: "",
  platform: "",
  handle: "",
  account_url: "",
  followers: 0,
  reach: 0,
  engagement_rate: 0,
  verification_status: "",
  data_source: "",
  last_synced_at: null,
};

export default function SocialAccounts() {
  const { user, creatorProfile, loading, refresh } = useProfile();
  const profile = /** @type {{ id: string, full_name?: string } | null} */ (creatorProfile);
  const { toast } = useToast();
  const [accounts, setAccounts] = useState(/** @type {SocialAccount[]} */ (Array.of(emptySocialAccount)));
  const [busy, setBusy] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(/** @type {SocialAccount | null} */ (null));

  const load = async () => {
    if (!user?.id) return;
    setBusy(true);
    const res = await base44.entities.SocialAccount.filter({ user_id: user.id }, { sort: "-followers", limit: 30 });
    setAccounts(toItems(res));
    setBusy(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  /** @param {SocialAccount[]} list */
  const syncTotals = async (list) => {
    if (!profile) return;
    const total = list.reduce((s, a) => s + (a.followers || 0), 0);
    const weighted = list.reduce((s, a) => s + (a.engagement_rate || 0) * (a.followers || 0), 0);
    const avg = total ? Math.round((weighted / total) * 100) / 100 : 0;
    await base44.entities.CreatorProfile.update(profile.id, { total_followers: total, average_engagement_rate: avg });
    refresh();
  };

  /** @param {SocialAccount} account */
  const disconnect = async (account) => {
    await base44.entities.SocialAccount.delete(account.id);
    await logAudit(user, "social_account.disconnected", "SocialAccount", account.id, account.platform);
    const next = accounts.filter((a) => a.id !== account.id);
    setAccounts(next);
    await syncTotals(next);
    toast({ title: "Account disconnected", description: `${platformLabel(account.platform)} was removed from your profile.` });
  };

  /** @param {SocialAccount} account */
  const requestVerification = async (account) => {
    const subjectName = profile?.full_name || user?.full_name || user?.email || "";
    await base44.entities.VerificationRecord.create({
      subject_user_id: user.id,
      subject_name: subjectName,
      subject_type: "social_account",
      category: "social",
      related_id: account.id,
      related_name: `${account.platform} ${account.handle || ""}`.trim(),
      status: "pending",
      submitted_at: new Date().toISOString(),
      method: "administrator",
    });
    await base44.entities.SocialAccount.update(account.id, { verification_status: "pending" });
    await load();
    toast({ title: "Verification requested", description: "An administrator will review this account." });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Social accounts"
        title="Connected accounts"
        description="Official API connections give verified metrics. Manual entries are permanently labelled self-reported."
        actions={<Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="h-11 bg-primary hover:bg-primary/90"><Plus className="mr-1.5 h-4 w-4" /> Add account</Button>}
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-border bg-mint/60 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          API connection for YouTube, Instagram, LinkedIn and X uses each platform’s official OAuth and requires platform approval for this app.
          Until that approval is in place, accounts you add are manual entries and are labelled <span className="font-semibold text-navy">self-reported</span>.
          We never scrape private account data.
        </p>
      </div>

      {busy || loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No accounts connected"
          description="Add the platforms you publish on. You can edit the figures later as your audience grows."
          action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="h-11 bg-primary hover:bg-primary/90">Add your first account</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {accounts.map((a) => (
            <SectionCard key={a.id} bodyClassName="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-[15px] font-bold text-navy">{platformLabel(a.platform)}</p>
                  <p className="text-[13px] text-muted-foreground">{a.handle || a.account_url || "Handle not set"}</p>
                </div>
                <StatusPill status={a.verification_status} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-muted/50 p-2.5">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Followers</p>
                  <p className="font-heading text-[14px] font-bold text-navy">{formatNumber(a.followers)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Reach</p>
                  <p className="font-heading text-[14px] font-bold text-navy">{formatNumber(a.reach)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Engagement</p>
                  <p className="font-heading text-[14px] font-bold text-navy">{a.engagement_rate || 0}%</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${a.data_source === "oauth_connected" ? "bg-success-tint text-success" : "bg-warning-tint text-warning"}`}>
                  {a.data_source === "oauth_connected" ? "Official API" : "Self-reported"}
                </span>
                <span className="text-[11px] text-muted-foreground">Synced {formatDateTime(a.last_synced_at)}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <Button variant="outline" size="sm" onClick={() => { setEditing(a); setDialogOpen(true); }} className="h-9 text-[13px]"><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                {a.verification_status !== "verified" && a.verification_status !== "pending" && (
                  <Button variant="outline" size="sm" onClick={() => requestVerification(a)} className="h-9 text-[13px]"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Request verification</Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto h-9 text-[13px] text-muted-foreground hover:text-danger"><Trash2 className="mr-1 h-3.5 w-3.5" /> Disconnect</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect {platformLabel(a.platform)}?</AlertDialogTitle>
                      <AlertDialogDescription>This removes the account and its stored metrics from your profile. This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => disconnect(a)} className="bg-danger hover:bg-danger/90">Disconnect</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <SocialAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={editing ? {
          ...editing,
          followers: String(editing.followers ?? 0),
          reach: String(editing.reach ?? 0),
          engagement_rate: String(editing.engagement_rate ?? 0),
        } : null}
        subjectName={profile?.full_name}
        onSaved={async () => { await load(); refresh(); }}
      />
    </div>
  );
}