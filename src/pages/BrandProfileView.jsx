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
import { ArrowLeft, Flag, Globe, Loader2, MapPin, Package, Pencil, Send, ShieldCheck } from "lucide-react";
import { formatDate, formatMoney, formatNumber, isSample, toItems } from "@/lib/helpers";
import SampleTag from "@/components/common/SampleTag";
import { VERIFICATION_CATEGORIES, evidenceLevelLabel } from "@/lib/constants";

export default function BrandProfileView() {
  const { id } = useParams();
  const { user } = useAuth();
  const initialState = /** @type {{ loading: boolean, notFound: boolean, brand: any | null, products: any[], verifications: any[], campaigns: any[], certifications: any[] }} */ ({
    loading: true,
    notFound: false,
    brand: null,
    products: [],
    verifications: [],
    campaigns: [],
    certifications: [],
  });
  const [state, setState] = useState(initialState);
  const [requestOpen, setRequestOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!id) {
          setState((s) => ({ ...s, loading: false, notFound: true }));
          return;
        }

        const brand = await base44.entities.BrandProfile.get(id);
        if (!brand) { setState((s) => ({ ...s, loading: false, notFound: true })); return; }
        const [products, verifications, campaigns, certifications] = await Promise.all([
          base44.entities.Product.filter({ user_id: brand.user_id }, { sort: "-created_date", limit: 20 }),
          base44.entities.VerificationRecord.filter({ subject_user_id: brand.user_id }, { limit: 50 }),
          base44.entities.Campaign.filter({ brand_user_id: brand.user_id }, { sort: "-start_date", limit: 12 }),
          base44.entities.Certification.filter({ user_id: brand.user_id }, { limit: 30 }),
        ]);
        setState({ loading: false, notFound: false, brand, products: toItems(products), verifications: toItems(verifications), campaigns: toItems(campaigns), certifications: toItems(certifications) });
      } catch {
        setState((s) => ({ ...s, loading: false, notFound: true }));
      }
    })();
  }, [id]);

  const isOwn = user?.id === state.brand?.user_id;
  const verificationRows = useMemo(
    () => VERIFICATION_CATEGORIES.map((c) => ({ ...c, status: state.verifications.find((r) => r.category === c.key)?.status || "not_submitted" })),
    [state.verifications]
  );
  const verified = verificationRows.filter((v) => v.status === "verified").length;

  if (state.loading) return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (state.notFound || !state.brand) return <NotFoundState title="We couldn't find that brand" />;

  const b = state.brand;

  return (
    <div>
      <Link to="/marketplace" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>

      <div className="card-flat p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {b.logo ? (
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border">
                <Image src={b.logo} alt={b.brand_name} fittingType="fill" className="h-full w-full" />
              </div>
            ) : (
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-md bg-mint font-heading text-[22px] font-extrabold text-primary">
                {(b.brand_name || "B").slice(0, 2).toUpperCase()}
              </span>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-[24px] font-extrabold leading-tight text-navy">{b.brand_name}</h1>
                {isSample(b) && <SampleTag label="Sample brand" />}
              </div>
              <p className="mt-1 text-[14px] text-muted-foreground">{b.company_name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                {b.industry && <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 font-medium">{b.industry}</span>}
                {b.address && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{b.address}</span>}
                {b.website && (
                  <a href={b.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                    <Globe className="h-3.5 w-3.5" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwn ? (
              <Button asChild className="h-11 bg-primary hover:bg-primary/90"><Link to="/company"><Pencil className="mr-1.5 h-4 w-4" /> Edit company</Link></Button>
            ) : (
              <>
                {user?.account_type !== "brand" && user?.role !== "admin" && !isSample(b) && (
                  <Button onClick={() => setRequestOpen(true)} className="h-11 bg-primary hover:bg-primary/90"><Send className="mr-1.5 h-4 w-4" /> Request collaboration</Button>
                )}
                {isSample(b) && (
                  <span className="inline-flex h-11 items-center rounded-md border border-dashed border-border px-3 text-[13px] text-muted-foreground">
                    Demo brand — requests unavailable
                  </span>
                )}
                <Button variant="outline" onClick={() => setReportOpen(true)} className="h-11 text-muted-foreground"><Flag className="mr-1.5 h-4 w-4" /> Report</Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
          {[
            { label: "Products", value: state.products.length },
            { label: "Verified checks", value: `${verified} / 6` },
            { label: "Campaigns recorded", value: state.campaigns.length },
            { label: "Years operating", value: b.years_in_operation || "—" },
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
          <SectionCard title="About the brand">
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-muted-foreground">{b.description || "No description provided yet."}</p>
            {b.collaboration_requirements && (
              <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-navy">What they need from creators:</span> {b.collaboration_requirements}
              </p>
            )}
          </SectionCard>

          <SectionCard title="Products" description="Each product shows the evidence level behind its claims." bodyClassName="p-4">
            {state.products.length === 0 ? (
              <p className="py-4 text-[13px] text-muted-foreground">No products published yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {state.products.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-md border border-border">
                    <div className="aspect-[16/9] bg-muted">
                      {p.images?.[0] ? (
                        <Image src={p.images[0]} alt={p.name} fittingType="fill" className="h-full w-full" />
                      ) : (
                        <div className="grid h-full place-items-center text-muted-foreground"><Package className="h-6 w-6" /></div>
                      )}
                    </div>
                    <div className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold text-navy">{p.name}</p>
                          <p className="truncate text-[12px] text-muted-foreground">{p.category || "Uncategorised"}</p>
                        </div>
                        <StatusPill status={p.verification_status} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[12px]">
                        <span className="text-muted-foreground">{evidenceLevelLabel(p.evidence_level)}</span>
                        <span className="font-semibold text-navy">{formatMoney(p.retail_price, p.currency)}</span>
                      </div>
                      {p.side_effects_warnings && (
                        <p className="mt-2 rounded border border-warning/25 bg-warning-tint px-2 py-1 text-[11px] leading-snug text-warning">
                          Warnings: {p.side_effects_warnings}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Campaign history" description="Spend and revenue are private to the brand. Reach and clicks are shown as recorded." bodyClassName="p-0">
            {state.campaigns.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-muted-foreground">No campaigns recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {["Campaign", "Creator", "Reach", "Clicks", "Confirmed"].map((h) => (
                        <th key={h} className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3.5">
                          <p className="text-[14px] font-semibold text-navy">{c.title}</p>
                          <p className="text-[12px] text-muted-foreground">{c.product_name || "—"} · {formatDate(c.start_date)}</p>
                        </td>
                        <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{c.creator_name || "—"}</td>
                        <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{formatNumber(c.reach)}</td>
                        <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{formatNumber(c.clicks)}</td>
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
        </div>

        <div className="space-y-4">
          <SectionCard title="Verification" description="Reviewed evidence only." bodyClassName="divide-y divide-border p-0">
            {verificationRows.map((v) => (
              <div key={v.key} className="flex items-center justify-between gap-2 px-5 py-3">
                <p className="text-[13.5px] font-medium text-navy">{v.label}</p>
                <StatusPill status={v.status} />
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Company details" bodyClassName="p-5 space-y-3">
            <div>
              <p className="label-caption">Registered name</p>
              <p className="mt-0.5 text-[14px] text-navy">{b.company_name || "—"}</p>
            </div>
            <div>
              <p className="label-caption">Registration number</p>
              <p className="mt-0.5 text-[14px] text-navy">{b.registration_number || "Not provided"}</p>
            </div>
            <div>
              <p className="label-caption">Company size</p>
              <p className="mt-0.5 text-[14px] text-navy">{b.company_size ? `${b.company_size} people` : "Not provided"}</p>
            </div>
            <div>
              <p className="label-caption">Typical budget</p>
              <p className="mt-0.5 text-[14px] text-navy">
                {b.typical_budget_min || b.typical_budget_max
                  ? `${formatMoney(b.typical_budget_min, b.currency)} – ${formatMoney(b.typical_budget_max, b.currency)}`
                  : "Not disclosed"}
              </p>
            </div>
            <div>
              <p className="label-caption">Works with</p>
              <p className="mt-0.5 text-[14px] text-navy">{(b.preferred_creator_categories || []).join(", ") || "Not specified"}</p>
            </div>
          </SectionCard>

          {state.certifications.length > 0 && (
            <SectionCard title="Certifications" bodyClassName="divide-y divide-border p-0">
              {state.certifications.map((c) => (
                <div key={c.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13.5px] font-semibold text-navy">{c.certificate_name}</p>
                    <StatusPill status={c.verification_status} />
                  </div>
                  <p className="text-[12px] text-muted-foreground">{c.issuing_authority || "Authority not stated"}{c.certificate_number ? ` · ${c.certificate_number}` : ""}</p>
                </div>
              ))}
            </SectionCard>
          )}

          <div className="flex items-start gap-2 rounded-lg border border-border bg-mint/60 p-3 text-[12px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Product claims stay labelled brand-provided until laboratory reports or licences are reviewed. Documents themselves stay private.
          </div>
        </div>
      </div>

      <RequestDialog open={requestOpen} onOpenChange={setRequestOpen} toUser={{ user_id: b.user_id, name: b.brand_name, type: "brand" }} />
      <ReportProfileDialog open={reportOpen} onOpenChange={setReportOpen} subject={b.user_id} subjectName={b.brand_name} />
    </div>
  );
}