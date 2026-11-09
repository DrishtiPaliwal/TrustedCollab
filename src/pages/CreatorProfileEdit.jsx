import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/common/PageHeader";
import CreatorProfileForm from "@/components/profile/CreatorProfileForm";
import useProfile from "@/hooks/useProfile";
import { computeCompletion, logAudit, stripMeta } from "@/lib/helpers";
import { CREATOR_COMPLETION_FIELDS } from "@/lib/profileFields";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export default function CreatorProfileEdit() {
  const { user, creatorProfile, loading, refresh } = /** @type {any} */ (useProfile());
  const [form, setForm] = useState(/** @type {Record<string, any>} */ ({}));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!creatorProfile) return;
    setForm({
      ...creatorProfile,
      years_experience: creatorProfile.years_experience ?? "",
      expected_fee_min: creatorProfile.expected_fee_min ?? "",
      expected_fee_max: creatorProfile.expected_fee_max ?? "",
    });
  }, [creatorProfile]);

  useEffect(() => {
    if (!loading && !creatorProfile && user) {
      setForm((f) => ({ currency: "INR", availability: "open", full_name: f.full_name || user.full_name || "", contact_email: f.contact_email || user.email || "" }));
    }
  }, [loading, creatorProfile, user]);

  /** @param {import("react").FormEvent<HTMLFormElement>} e */
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      /** @type {Record<string, any>} */
      const payload = {
        ...stripMeta(form),
        user_id: user.id,
        years_experience: form.years_experience === "" ? undefined : Number(form.years_experience),
        expected_fee_min: form.expected_fee_min === "" ? undefined : Number(form.expected_fee_min),
        expected_fee_max: form.expected_fee_max === "" ? undefined : Number(form.expected_fee_max),
      };
      payload.profile_completion = computeCompletion(payload, CREATOR_COMPLETION_FIELDS);
      if (creatorProfile) {
        await base44.entities.CreatorProfile.update(creatorProfile.id, payload);
        await logAudit(user, "creator_profile.updated", "CreatorProfile", creatorProfile.id, payload.full_name);
      } else {
        const created = await base44.entities.CreatorProfile.create(payload);
        await base44.auth.updateMe({ account_type: "creator" });
        await logAudit(user, "creator_profile.created", "CreatorProfile", created.id, payload.full_name);
      }
      await refresh();
    } catch (/** @type {any} */ err) {
      setError(err?.message || "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const completion = creatorProfile?.profile_completion || 0;

  return (
    <div>
      <PageHeader
        eyebrow="Creator profile"
        title={creatorProfile ? "Edit your profile" : "Create your creator profile"}
        description="This is what brands see in the marketplace. Every field adds to your completion score."
      />
      {creatorProfile && (
        <div className="mb-5 card-flat p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-navy">Profile completion</p>
            <p className="font-heading text-[15px] font-bold text-primary">{completion}%</p>
          </div>
          <Progress value={completion} className="h-2 bg-muted [&>div]:bg-primary" />
        </div>
      )}
      <CreatorProfileForm form={form} setForm={setForm} onSubmit={submit} submitLabel={creatorProfile ? "Save changes" : "Create profile"} busy={busy} error={error} />
    </div>
  );
}