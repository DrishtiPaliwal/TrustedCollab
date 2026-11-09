import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import SectionCard from "@/components/common/SectionCard";
import StatusPill from "@/components/common/StatusPill";
import NotFoundState from "@/components/common/NotFoundState";
import RequestDialog from "@/components/common/RequestDialog";
import ReportProfileDialog from "@/components/common/ReportProfileDialog";
import { ArrowLeft, Loader2, MapPin, Send, Flag, Pencil, Star, ShieldCheck } from "lucide-react";
import { formatDate, formatMoney, formatNumber, isSample, toItems } from "@/lib/helpers";
import SampleTag from "@/components/common/SampleTag";
import { VERIFICATION_CATEGORIES, platformLabel } from "@/lib/constants";

export default function CreatorProfileView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({
    loading: true,
    notFound: false,
    profile: /** @type {any} */ (null),
    socials: /** @type {any[]} */ ([]),
    verifications: /** @type {any[]} */ ([]),
    campaigns: /** @type {any[]} */ ([]),
    reviews: /** @type {any[]} */ ([]),
  });
  const [requestOpen, setRequestOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      setState((s) => ({ ...s, loading: false, notFound: true }));
      return;
    }
    (async () => {
      try {
        const profile = await base44.entities.CreatorProfile.get(id);
        if (!profile) { setState((s) => ({ ...s, loading: false, notFound: true })); return; }
        const [socials, verifications, campaigns, reviews] = await Promise.all([
          base44.entities.SocialAccount.filter({ user_id: profile.user_id }, { sort: "-followers", limit: 20 }),
          base44.entities.VerificationRecord.filter({ subject_user_id: profile.user_id }, { limit: 50 }),
          base44.entities.Campaign.filter({ creator_user_id: profile.user_id }, { sort: "-start_date", limit: 12 }),
          base44.entities.Review.filter({ subject_user_id: profile.user_id }, { sort: "-created_date", limit: 6 }),
        ]);
        setState({
          loading: false, notFound: false, profile,
          socials: toItems(socials), verifications: toItems(verifications),
          campaigns: toItems(campaigns), reviews: toItems(reviews),
        });
      } catch {
        setState((s) => ({ ...s, loading: false, notFound: true }));
      }
    })();
  }, [id]);

  const isOwn = user?.id === state.profile?.user_id;
  const verificationRows = useMemo(
    () => VERIFICATION_CATEGORIES.map((c) => ({ ...c, status: state.verifications.find((r) => r.category === c.key)?.status || "not_submitted" })),
    [state.verifications]
  );
  const confirmed = state.campaigns.filter((c) => c.brand_confirmed && c.creator_confirmed).length;

  if (state.loading) return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (state.notFound || !state.profile) return <NotFoundState />;

  const p = state.profile;

  return (
    <div>
      <Link to="/marketplace" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>

      <div className="card-flat p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {p.profile_photo ? (
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border">
                <Image src={p.profile_photo} alt={p.full_name} fittingType="fill" className="h-full w-full" />
              </div>
            ) : (
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-mint font-heading text-[24px] font-extrabold text-primary">
                {(p.full_name || "C").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-[24px] font-extrabold leading-tight text-navy">{p.full_name}</h1>
                {isSample(p) && <SampleTag label="Sample profile" />}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-[14px] text-muted-foreground">
                <MapPin className="h-4 w-4" /> {p.location || "Location not set"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(p.categories || []).map((/** @type {string} */ c) => (
                  <span key={c} className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[12px] font-medium text-muted-foreground">{c}</span>
                ))}
                <span className="rounded-full border border-primary/20 bg-mint px-2.5 py-0.5 text-[12px] font-semibold capitalize text-primary">
                  {p.availability === "open" ? "Open to work" : p.availability === "limited" ? "Limited availability" : "Not available"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwn ? (
              <Button asChild className="h-11 bg-primary hover:bg-primary/90"><Link to="/profile"><Pencil className="mr-1.5 h-4 w-4" /> Edit profile</Link></Button>
            ) : (
              <>
                {user?.account_type === "brand" && !isSample(p) && (
                  <Button onClick={() => setRequestOpen(true)} className="h-11 bg-primary hover:bg-primary/90"><Send className="mr-1.5 h-4 w-4" /> Request collaboration</Button>
                )}
                {isSample(p) && (
                  <span className="inline-flex h-11 items-center rounded-md border border-dashed border-border px-3 text-[13px] text-muted-foreground">
                    Demo profile — requests unavailable
                  </span>
                )}
                <Button variant="outline" onClick={() => setReportOpen(true)} className="h-11 text-muted-foreground"><Flag className="mr-1.5 h-4 w-4" /> Report</Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
          {[
            { label: "Followers", value: formatNumber(p.total_followers || 0) },
            { label: "Avg engagement", value: p.average_engagement_rate ? `${p.average_engagement_rate}%` : "—" },
            { label: "Experience", value: p.years_experience ? `${p.years_experience} yrs` : "—" },
            { label: "Confirmed campaigns", value: confirmed },
          ].map((s) => (
            <div key={s.label}>
              <p className="label-caption">{s.label}</p>
              <p className="mt-1 font-heading text-[19px] font-extrabold text-navy">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Biography">
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-muted-foreground">
              {p.bio || "This creator hasn't added a biography yet."}
            </p>
            {(p.languages || []).length > 0 && (
              <p className="mt-4 text-[13px] text-muted-foreground"><span className="font-semibold text-navy">Languages:</span> {(p.languages || []).join(", ")}</p>
            )}
            {(p.skills || []).length > 0 && (
              <p className="mt-1 text-[13px] text-muted-foreground"><span className="font-semibold text-navy">Skills:</span> {(p.skills || []).join(", ")}</p>
            )}
          </SectionCard>

          <SectionCard title="Collaboration history" description="Fees and revenue are private to the parties involved. Performance shown here is as recorded." bodyClassName="p-0">
            {state.campaigns.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-muted-foreground">No collaborations recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {["Campaign", "Brand", "Reach", "Clicks", "Evidence", "Confirmed"].map((h) => (
                        <th key={h} className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0 align-top">
                        <td className="px-5 py-3.5">
                          <p className="text-[14px] font-semibold text-navy">{c.title}</p>
                          <p className="text-[12px] text-muted-foreground">{c.product_name || "—"} · {formatDate(c.start_date)}</p>
                        </td>
                        <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{c.brand_name || "—"}</td>
                        <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{formatNumber(c.reach)}</td>
                        <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{formatNumber(c.clicks)}</td>
                        <td className="px-5 py-3.5">
                          <StatusPill status={c.performance_source === "independently_verified" ? "verified" : "pending"} label={c.performance_source === "independently_verified" ? "Verified" : "Self-reported"} />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill status={c.brand_confirmed && c.creator_confirmed ? "verified" : "pending"} label={c.brand_confirmed && c.creator_confirmed ? "Both sides" : "Unconfirmed"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Reviews" description="Only collaborators can leave a review." bodyClassName="divide-y divide-border p-0">
            {state.reviews.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-muted-foreground">No reviews yet.</p>
            ) : (
              state.reviews.map((r) => (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold text-navy">{r.reviewer_name || "A collaborator"}</p>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-warning text-warning" : "text-border"}`} />
                      ))}
                    </span>
                  </div>
                  {r.comment && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{r.comment}</p>}
                  {r.verified_collaboration && <p className="mt-1 text-[12px] font-medium text-success">Verified collaboration</p>}
                </div>
              ))
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Verification" description="Only reviewed checks appear as verified." bodyClassName="divide-y divide-border p-0">
            {verificationRows.map((v) => (
              <div key={v.key} className="flex items-center justify-between gap-2 px-5 py-3">
                <p className="text-[13.5px] font-medium text-navy">{v.label}</p>
                <StatusPill status={v.status} />
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Connected accounts" bodyClassName="divide-y divide-border p-0">
            {state.socials.length === 0 ? (
              <p className="px-5 py-4 text-[13px] text-muted-foreground">No accounts connected.</p>
            ) : (
              state.socials.map((s) => (
                <div key={s.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold text-navy">{platformLabel(s.platform)}</p>
                    <StatusPill status={s.verification_status} />
                  </div>
                  <p className="text-[12px] text-muted-foreground">{s.handle || "—"}</p>
                  <div className="mt-1.5 grid grid-cols-2 gap-1 text-[12px] text-muted-foreground">
                    <span><strong className="font-semibold text-navy">{formatNumber(s.followers)}</strong> followers</span>
                    <span><strong className="font-semibold text-navy">{s.engagement_rate || 0}%</strong> engagement</span>
                  </div>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {s.data_source === "oauth_connected" ? "Official API" : "Self-reported"}
                  </p>
                </div>
              ))
            )}
          </SectionCard>

          <SectionCard title="Collaboration preferences" bodyClassName="p-5 space-y-3">
            <div>
              <p className="label-caption">Fee expectation</p>
              <p className="mt-0.5 text-[14px] text-navy">
                {p.expected_fee_min || p.expected_fee_max
                  ? `${formatMoney(p.expected_fee_min, p.currency)} – ${formatMoney(p.expected_fee_max, p.currency)}`
                  : "Not disclosed"}
              </p>
            </div>
            <div>
              <p className="label-caption">Works on</p>
              <p className="mt-0.5 text-[14px] text-navy">{(p.collaboration_types || []).join(", ") || "Not specified"}</p>
            </div>
            <div>
              <p className="label-caption">Preferred industries</p>
              <p className="mt-0.5 text-[14px] text-navy">{(p.preferred_industries || []).join(", ") || "Not specified"}</p>
            </div>
            <div>
              <p className="label-caption">Audience</p>
              <p className="mt-0.5 text-[14px] text-navy">
                {[(p.audience_geography || []).join(", "), p.audience_age_range].filter(Boolean).join(" · ") || "Not shared"}
              </p>
            </div>
          </SectionCard>

          <div className="flex items-start gap-2 rounded-lg border border-border bg-mint/60 p-3 text-[12px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Figures shown are the ones recorded on the platform. “Self-reported” means no independent evidence has been reviewed.
          </div>
        </div>
      </div>

      <RequestDialog open={requestOpen} onOpenChange={setRequestOpen} toUser={{ user_id: p.user_id, name: p.full_name, type: "creator" }} />
      <ReportProfileDialog open={reportOpen} onOpenChange={setReportOpen} subject={p.user_id} subjectName={p.full_name} />
    </div>
  );
}