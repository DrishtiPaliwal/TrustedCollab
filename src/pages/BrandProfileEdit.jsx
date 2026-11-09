import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/common/PageHeader";
import BrandProfileForm from "@/components/profile/BrandProfileForm";
import useProfile from "@/hooks/useProfile";
import { computeCompletion, logAudit, stripMeta } from "@/lib/helpers";
import { BRAND_COMPLETION_FIELDS } from "@/lib/profileFields";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

const defaultForm = {
  brand_name: "",
  currency: "INR",
  contact_name: "",
  contact_email: "",
  years_in_operation: "",
  typical_budget_min: "",
  typical_budget_max: "",
};

/** @typedef {{ id: string, brand_name?: string, profile_completion?: number, years_in_operation?: number | null, typical_budget_min?: number | null, typical_budget_max?: number | null, [key: string]: any }} BrandProfileRecord */

export default function BrandProfileEdit() {
  const { user, brandProfile, loading, refresh } = useProfile();
  const profile = /** @type {BrandProfileRecord | null | undefined} */ (brandProfile);
  const [form, setForm] = useState(/** @type {import("react").ComponentProps<typeof BrandProfileForm>["form"]} */ (defaultForm));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setForm({
      ...defaultForm,
      ...profile,
      years_in_operation: profile.years_in_operation ?? "",
      typical_budget_min: profile.typical_budget_min ?? "",
      typical_budget_max: profile.typical_budget_max ?? "",
    });
  }, [profile]);

  useEffect(() => {
    if (!loading && !profile && user) {
      setForm((f) => ({
        ...defaultForm,
        ...f,
        currency: "INR",
        contact_name: f.contact_name || user.full_name || "",
        contact_email: f.contact_email || user.email || "",
      }));
    }
  }, [loading, profile, user]);

  const submit = async (/** @type {import("react").FormEvent<HTMLFormElement>} */ e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    if (!user) {
      setError("Please sign in to save your company profile.");
      setBusy(false);
      return;
    }

    try {
      const payload = /** @type {Record<string, any>} */ ({
        ...stripMeta(form),
        user_id: user.id,
        years_in_operation: form.years_in_operation === "" ? undefined : Number(form.years_in_operation),
        typical_budget_min: form.typical_budget_min === "" ? undefined : Number(form.typical_budget_min),
        typical_budget_max: form.typical_budget_max === "" ? undefined : Number(form.typical_budget_max),
      });
      const fullPayload = {
        ...payload,
        profile_completion: computeCompletion(payload, BRAND_COMPLETION_FIELDS),
      };

      const brandName = payload.brand_name || "";

      if (profile) {
        await base44.entities.BrandProfile.update(profile.id, fullPayload);
        await logAudit(user, "brand_profile.updated", "BrandProfile", profile.id, brandName);
      } else {
        const created = await base44.entities.BrandProfile.create(fullPayload);
        await base44.auth.updateMe({ account_type: "brand" });
        await logAudit(user, "brand_profile.created", "BrandProfile", created.id, brandName);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the company profile.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const completion = Number(profile?.profile_completion ?? 0);

  return (
    <div>
      <PageHeader
        eyebrow="Company profile"
        title={profile ? "Edit company profile" : "Create company profile"}
        description="Creators use this to judge whether you are a credible partner — include registration details you can evidence."
      />
      {profile && (
        <div className="mb-5 card-flat p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-navy">Company profile completion</p>
            <p className="font-heading text-[15px] font-bold text-primary">{completion}%</p>
          </div>
          <Progress value={completion} className="h-2 bg-muted [&>div]:bg-primary" />
        </div>
      )}
      <BrandProfileForm form={form} setForm={(updater) => setForm(updater)} onSubmit={submit} submitLabel={profile ? "Save changes" : "Create company profile"} busy={busy} error={error} />
    </div>
  );
}