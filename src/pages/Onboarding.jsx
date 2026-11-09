import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import useProfile from "@/hooks/useProfile";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import CreatorProfileForm from "@/components/profile/CreatorProfileForm";
import BrandProfileForm from "@/components/profile/BrandProfileForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, UserRound, ShieldCheck, Loader2 } from "lucide-react";
import { computeCompletion, logAudit } from "@/lib/helpers";
import { CREATOR_COMPLETION_FIELDS, BRAND_COMPLETION_FIELDS } from "@/lib/profileFields";

export default function Onboarding() {
  const { user, creatorProfile, brandProfile, loading } = useProfile();
  const { checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState(/** @type {"creator" | "brand" | null} */ (null));
  const [creatorForm, setCreatorForm] = useState(/** @type {import("react").ComponentProps<typeof CreatorProfileForm>["form"]} */ ({ currency: "INR", availability: "open", languages: [], categories: [], niches: [], skills: [], collaboration_types: [], preferred_industries: [], audience_geography: [], audience_interests: [] }));
  const [brandForm, setBrandForm] = useState(/** @type {import("react").ComponentProps<typeof BrandProfileForm>["form"]} */ ({ currency: "INR", preferred_creator_categories: [], preferred_locations: [] }));
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") { navigate("/", { replace: true }); return; }
    if (creatorProfile || brandProfile) { navigate("/", { replace: true }); return; }
    setType(user.account_type || null);
    setCreatorForm((f) => ({ ...f, full_name: user.full_name || "", contact_email: user.email || "" }));
    setBrandForm((f) => ({ ...f, contact_name: user.full_name || "", contact_email: user.email || "" }));
  }, [user, creatorProfile, brandProfile, navigate]);

  /** @param {boolean} consentGranted */
  const finish = async (consentGranted) => {
    await base44.entities.ConsentRecord.create({
      user_id: user.id,
      consent_type: "data_processing",
      granted: consentGranted,
      policy_version: "1.0",
      granted_at: consentGranted ? new Date().toISOString() : undefined,
    });
    await base44.auth.updateMe({ onboarding_complete: true });
    await checkUserAuth();
    navigate("/", { replace: true });
  };

  /** @param {import("react").FormEvent<HTMLFormElement>} e */
  const submitCreator = async (e) => {
    e.preventDefault();
    if (!consent) { setError("Please accept the processing terms to create your profile."); return; }
    setBusy(true); setError("");
    try {
      /** @type {Record<string, any>} */
      const payload = {
        ...creatorForm,
        user_id: user.id,
        years_experience: creatorForm.years_experience ? Number(creatorForm.years_experience) : undefined,
        expected_fee_min: creatorForm.expected_fee_min ? Number(creatorForm.expected_fee_min) : undefined,
        expected_fee_max: creatorForm.expected_fee_max ? Number(creatorForm.expected_fee_max) : undefined,
        total_followers: 0,
        average_engagement_rate: 0,
      };
      payload.profile_completion = computeCompletion(payload, CREATOR_COMPLETION_FIELDS);
      const created = await base44.entities.CreatorProfile.create(payload);
      await base44.auth.updateMe({ account_type: "creator", location: payload.location, headline: payload.niches?.[0] });
      await logAudit(user, "creator_profile.created", "CreatorProfile", created.id, payload.full_name);
      await finish(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your profile.");
    } finally {
      setBusy(false);
    }
  };

  /** @param {import("react").FormEvent<HTMLFormElement>} e */
  const submitBrand = async (e) => {
    e.preventDefault();
    if (!consent) { setError("Please accept the processing terms to create your profile."); return; }
    setBusy(true); setError("");
    try {
      /** @type {Record<string, any>} */
      const payload = {
        ...brandForm,
        user_id: user.id,
        years_in_operation: brandForm.years_in_operation ? Number(brandForm.years_in_operation) : undefined,
        typical_budget_min: brandForm.typical_budget_min ? Number(brandForm.typical_budget_min) : undefined,
        typical_budget_max: brandForm.typical_budget_max ? Number(brandForm.typical_budget_max) : undefined,
      };
      payload.profile_completion = computeCompletion(payload, BRAND_COMPLETION_FIELDS);
      const created = await base44.entities.BrandProfile.create(payload);
      await base44.auth.updateMe({ account_type: "brand", location: payload.address });
      await logAudit(user, "brand_profile.created", "BrandProfile", created.id, payload.brand_name);
      await finish(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your company profile.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Getting started"
        title={type ? `Set up your ${type === "creator" ? "creator" : "brand"} profile` : "How will you use CreatorTrust?"}
        description={type ? "Everything you add is editable later. Nothing is marked verified without an administrator reviewing evidence." : "Creators and brands get separate profiles, dashboards and permissions. This choice sets up your account."}
        actions={type && !user.account_type ? <Button variant="outline" onClick={() => setType(null)} className="h-11">Change account type</Button> : null}
      />

      {!type && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button onClick={() => setType("creator")} className="card-flat p-6 text-left transition-colors hover:border-primary/50">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-mint text-primary"><UserRound className="h-5 w-5" /></span>
            <h3 className="mt-3 font-heading text-[17px] font-bold text-navy">Creator</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">Build a profile brands can check: accounts, audience, documents and confirmed collaborations.</p>
          </button>
          <button onClick={() => setType("brand")} className="card-flat p-6 text-left transition-colors hover:border-primary/50">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-mint text-primary"><Building2 className="h-5 w-5" /></span>
            <h3 className="mt-3 font-heading text-[17px] font-bold text-navy">Brand</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">Publish products with evidence, record campaign ROI and invite creators with verifiable numbers.</p>
          </button>
        </div>
      )}

      {type && (
        <div className="space-y-6">
          <SectionCard bodyClassName="p-4">
            <div className="flex items-start gap-2.5">
              <Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} id="consent" className="mt-0.5" />
              <label htmlFor="consent" className="text-[13px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-navy">I agree to CreatorTrust processing my profile data.</span> This covers storing and displaying the information you provide. Documents stay private to you and platform administrators. You can export or delete your data from Settings at any time.
              </label>
            </div>
          </SectionCard>

          {type === "creator" ? (
            <CreatorProfileForm form={creatorForm} setForm={setCreatorForm} onSubmit={submitCreator} submitLabel="Create creator profile" busy={busy} error={error} />
          ) : (
            <BrandProfileForm form={brandForm} setForm={setBrandForm} onSubmit={submitBrand} submitLabel="Create brand profile" busy={busy} error={error} />
          )}

          <p className="flex items-center gap-1.5 pb-4 text-[13px] text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Verification is granted only by an administrator after evidence review.
          </p>
        </div>
      )}
    </div>
  );
}