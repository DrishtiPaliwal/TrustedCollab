import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatusPill from "@/components/common/StatusPill";
import useProfile from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, FileCheck2, Loader2, ShieldCheck } from "lucide-react";
import { formatDate, toItems } from "@/lib/helpers";
import { VERIFICATION_CATEGORIES, VERIFICATION_CATEGORY_LABEL } from "@/lib/constants";

/** @type {Record<string, { label: string, to: string }>} */
const ACTION = {
  identity: { label: "Upload ID document", to: "/documents?upload=1" },
  business: { label: "Upload registration", to: "/documents?upload=1" },
  product_document: { label: "Upload product evidence", to: "/documents?upload=1" },
  social: { label: "Add or verify an account", to: "/social" },
  collaboration: { label: "Record a collaboration", to: "/campaigns" },
  performance: { label: "Add performance evidence", to: "/campaigns" },
};

const STATUSES = [
  ["not_submitted", "No evidence has been submitted."],
  ["pending", "Submitted and waiting for an administrator."],
  ["verified", "Reviewed and matched to the evidence provided."],
  ["rejected", "Reviewed and not accepted. The reviewer's note explains why."],
  ["expired", "The document or check is past its valid date."],
  ["requires_renewal", "Still valid but needs a fresh submission."],
];

/** @typedef {{ id: string, category: string, status?: string, related_name?: string, submitted_at?: string, created_date?: string, method?: string, reviewer_notes?: string }} VerificationRecord */

export default function Verification() {
  const { user, creatorProfile, brandProfile, loading } = useProfile();
  const [records, setRecords] = useState(/** @type {VerificationRecord[]} */ ([]));
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setBusy(true);
      const res = await base44.entities.VerificationRecord.filter({ subject_user_id: user.id }, { sort: "-created_date", limit: 60 });
      setRecords(toItems(res));
      setBusy(false);
    })();
  }, [user?.id]);

  const rows = VERIFICATION_CATEGORIES.map((c) => {
    const list = records.filter((r) => r.category === c.key);
    const latest = list[0];
    return { ...c, status: latest?.status || "not_submitted", latest, count: list.length };
  });
  const verified = rows.filter((r) => r.status === "verified").length;

  if (loading) return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <PageHeader
        eyebrow="Trust & verification"
        title="Verification status"
        description="Six independent checks. Each is reviewed by a person — nothing is verified automatically and no score is invented."
      />

      <div className="mb-4 card-flat flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-mint text-primary"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <p className="font-heading text-[15px] font-bold text-navy">{verified} of 6 checks verified</p>
            <p className="text-[13px] text-muted-foreground">
              {(/** @type {{ brand_name?: string } | null} */ (brandProfile))?.brand_name ||
                (/** @type {{ full_name?: string } | null} */ (creatorProfile))?.full_name ||
                (/** @type {{ full_name?: string } | null} */ (user))?.full_name || "Your profile"}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="h-11"><Link to="/documents">Manage documents</Link></Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div key={r.key} className="card-flat flex flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading text-[15px] font-bold text-navy">{r.label}</h3>
              <StatusPill status={r.status} />
            </div>
            <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">{r.description}</p>
            {r.latest?.reviewer_notes && (
              <p className="mt-2 rounded border border-border bg-muted/50 px-2.5 py-2 text-[12px] text-muted-foreground">
                Reviewer: {r.latest.reviewer_notes}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-[12px] text-muted-foreground">
                {r.count} submission{r.count === 1 ? "" : "s"}
              </span>
              <Link to={ACTION[r.key].to} className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
                {ACTION[r.key].label} <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Submission history" bodyClassName="p-0">
          {busy ? (
            <div className="grid place-items-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : records.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-muted-foreground">No submissions yet. Start with identity or business documents.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Check", "Evidence", "Submitted", "Status", "Method"].map((h) => (
                      <th key={h} className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-5 py-3.5 text-[13.5px] font-semibold text-navy">{VERIFICATION_CATEGORY_LABEL[r.category] || r.category}</td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{r.related_name || "—"}</td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{formatDate(r.submitted_at || r.created_date)}</td>
                      <td className="px-5 py-3.5"><StatusPill status={r.status} /></td>
                      <td className="px-5 py-3.5 text-[13px] capitalize text-muted-foreground">{(r.method || "administrator").replace(/_/g, " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="What each status means">
          <ul className="space-y-3">
            {STATUSES.map(([status, meaning]) => (
              <li key={status} className="flex flex-col gap-1">
                <StatusPill status={status} className="self-start" />
                <span className="text-[12.5px] leading-relaxed text-muted-foreground">{meaning}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <FileCheck2 className="h-4 w-4 text-primary" /> Verification is performed by an administrator or an external source named on the record.
      </p>
    </div>
  );
}