import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import useProfile from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { CONSENT_TYPES } from "@/lib/constants";
import { formatDate, logAudit, toItems } from "@/lib/helpers";
import { useToast } from "@/components/ui/use-toast";

/** @typedef {{ id: string, consent_type: string, granted: boolean, granted_at?: string, revoked_at?: string }} ConsentRecord */
/** @typedef {{ id: string, full_name?: string, brand_name?: string }} Profile */

export default function Settings() {
  const { user } = useAuth();
  const { creatorProfile: rawCreatorProfile, brandProfile: rawBrandProfile } = useProfile();
  const creatorProfile = /** @type {Profile | null | undefined} */ (rawCreatorProfile);
  const brandProfile = /** @type {Profile | null | undefined} */ (rawBrandProfile);
  const { toast } = useToast();
  const [consents, setConsents] = useState(/** @type {ConsentRecord[]} */ ([]));
  const [busy, setBusy] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    const res = await base44.entities.ConsentRecord.filter({ user_id: user.id }, { limit: 20 });
    setConsents(toItems(res));
    setBusy(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  /** @param {string} key @param {boolean} granted */
  const toggleConsent = async (key, granted) => {
    const existing = consents.find((c) => c.consent_type === key);
    if (existing) {
      const updated = await base44.entities.ConsentRecord.update(existing.id, {
        granted,
        granted_at: granted ? new Date().toISOString() : existing.granted_at,
        revoked_at: granted ? undefined : new Date().toISOString(),
      });
      setConsents((list) => list.map((c) => (c.id === existing.id ? { ...c, ...updated } : c)));
    } else {
      const created = await base44.entities.ConsentRecord.create({
        user_id: user.id,
        consent_type: key,
        granted,
        policy_version: "1.0",
        granted_at: granted ? new Date().toISOString() : undefined,
      });
      setConsents((list) => [...list, created]);
    }
    await logAudit(user, `consent.${granted ? "granted" : "revoked"}`, "ConsentRecord", existing?.id || key, key);
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const [socials, docs] = await Promise.all([
        base44.entities.SocialAccount.filter({ user_id: user.id }, { limit: 100 }),
        base44.entities.Document.filter({ user_id: user.id }, { limit: 100 }),
      ]);
      for (const d of toItems(docs)) await base44.entities.Document.delete(d.id);
      for (const s of toItems(socials)) await base44.entities.SocialAccount.delete(s.id);
      if (creatorProfile) await base44.entities.CreatorProfile.delete(creatorProfile.id);
      if (brandProfile) await base44.entities.BrandProfile.delete(brandProfile.id);
      for (const c of consents) await base44.entities.ConsentRecord.delete(c.id);
      await logAudit(user, "account.data_deleted", "User", user.id, "Profile, accounts, documents and consents removed");
      base44.auth.logout("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Could not delete your data", description: message, variant: "destructive" });
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Settings" title="Account & privacy" description="Your data, your consents and your exit — all in one place." />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Account">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="label-caption">Name</dt>
                <dd className="mt-0.5 text-[14px] text-navy">{user?.full_name || "—"}</dd>
              </div>
              <div>
                <dt className="label-caption">Email</dt>
                <dd className="mt-0.5 text-[14px] text-navy">{user?.email}</dd>
              </div>
              <div>
                <dt className="label-caption">Account type</dt>
                <dd className="mt-0.5 text-[14px] capitalize text-navy">{user?.role === "admin" ? "Administrator" : user?.account_type || "Not set"}</dd>
              </div>
              <div>
                <dt className="label-caption">Profile</dt>
                <dd className="mt-0.5 text-[14px] text-navy">{creatorProfile?.full_name || brandProfile?.brand_name || "Not created"}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              {user?.role === "admin" ? (
                <Button asChild variant="outline" className="h-11"><Link to="/admin/verifications">Verification queue</Link></Button>
              ) : user?.account_type === "brand" ? (
                <Button asChild variant="outline" className="h-11"><Link to="/company">Edit company profile</Link></Button>
              ) : (
                <Button asChild variant="outline" className="h-11"><Link to="/profile">Edit creator profile</Link></Button>
              )}
              <Button variant="outline" onClick={() => base44.auth.logout("/login")} className="h-11 text-muted-foreground">
                <LogOut className="mr-1.5 h-4 w-4" /> Sign out
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Consent" description="Withdrawing core processing consent stops your profile being displayed; the record of your choice is kept.">
            {busy ? (
              <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : (
              <div className="divide-y divide-border">
                {CONSENT_TYPES.map((c) => {
                  const record = consents.find((x) => x.consent_type === c.key);
                  return (
                    <div key={c.key} className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-[14px] font-semibold text-navy">{c.label}</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{c.description}</p>
                        {record && <p className="mt-1 text-[12px] text-muted-foreground">{record.granted ? `Granted ${formatDate(record.granted_at)}` : `Revoked ${formatDate(record.revoked_at)}`}</p>}
                      </div>
                      <Switch checked={Boolean(record?.granted)} onCheckedChange={(v) => toggleConsent(c.key, v)} />
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Delete my data" description="Removes your profile, social accounts, uploaded documents and consent records. Campaigns already confirmed by both parties are retained for the other party's records.">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="h-11 border-danger/30 text-danger hover:bg-danger-tint hover:text-danger">
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete my data and sign out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your profile, connected accounts and documents are removed permanently. You will be signed out. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep my data</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAccount} disabled={deleting} className="bg-danger hover:bg-danger/90">
                    {deleting ? "Deleting…" : "Delete permanently"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SectionCard>
        </div>

        <SectionCard title="How we handle data" bodyClassName="p-5 space-y-3">
          {[
            "Documents are stored privately and opened through short-lived signed links.",
            "Metrics are never invented — manual figures stay labelled self-reported.",
            "Verification outcomes are recorded with the reviewer's note and timestamp.",
            "Every change to a verification, document or campaign is written to an audit log.",
            "Only official platform APIs are used where available; we never scrape private data.",
          ].map((line) => (
            <p key={line} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {line}
            </p>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}