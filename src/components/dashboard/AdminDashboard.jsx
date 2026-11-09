import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, ArrowUpRight, Building2, FileCheck2, FileText, ShieldCheck, UserRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatTile from "@/components/common/StatTile";
import StatusPill from "@/components/common/StatusPill";
import { formatDateTime, toItems } from "@/lib/helpers";
import { VERIFICATION_CATEGORY_LABEL } from "@/lib/constants";

/**
 * @typedef {{ category: string, count: number }} CategoryStat
 */

export default function AdminDashboard() {
  const [data, setData] = useState(
    /** @type {{
      creators: number,
      brands: number,
      pendingVerifications: number,
      pendingDocuments: number,
      openDisputes: number,
      campaigns: number,
      queue: any[],
      disputes: any[],
      audit: any[],
      byCategory: CategoryStat[]
    }} */ ({
      creators: 0, brands: 0, pendingVerifications: 0, pendingDocuments: 0, openDisputes: 0, campaigns: 0,
      queue: [], disputes: [], audit: [], byCategory: [],
    })
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [creators, brands, pendingVerifications, pendingDocuments, openDisputes, campaigns, queue, disputes, audit] = await Promise.all([
        base44.entities.CreatorProfile.count({}),
        base44.entities.BrandProfile.count({}),
        base44.entities.VerificationRecord.count({ status: "pending" }),
        base44.entities.Document.count({ verification_status: "pending" }),
        base44.entities.Dispute.count({ status: "open" }),
        base44.entities.Campaign.count({}),
        base44.entities.VerificationRecord.filter({ status: "pending" }, { sort: "created_date", limit: 5 }),
        base44.entities.Dispute.filter({}, { sort: "-created_date", limit: 4 }),
        base44.entities.AuditLog.filter({}, { sort: "-created_date", limit: 8 }),
      ]);
      /** @type {CategoryStat[]} */
      let byCategory = [];
      try {
        const res = await base44.entities.VerificationRecord.aggregate({ groupBy: "category" });
        byCategory = (res?.rows || []).map((r) => ({ category: VERIFICATION_CATEGORY_LABEL[r.category] || r.category, count: r.count }));
      } catch {
        byCategory = [];
      }
      setData({
        creators, brands, pendingVerifications, pendingDocuments, openDisputes, campaigns,
        queue: toItems(queue), disputes: toItems(disputes), audit: toItems(audit), byCategory,
      });
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Administrator"
        title="Platform overview"
        description="Verification queue, reported profiles and disputes. Administrators are the only people who can mark anything verified."
        actions={<Link to="/admin/verifications" className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-[14px] font-semibold text-primary-foreground hover:bg-primary/90">Review queue</Link>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile label="Creators" value={data.creators} hint="Registered creator profiles" icon={(props) => <UserRound {...props} />} />
        <StatTile label="Brands" value={data.brands} hint="Registered company profiles" icon={(props) => <Building2 {...props} />} />
        <StatTile label="Pending verifications" value={data.pendingVerifications} hint={`${data.pendingDocuments} documents awaiting review`} icon={(props) => <FileCheck2 {...props} />} tone="warning" />
        <StatTile label="Open disputes" value={data.openDisputes} hint={`${data.campaigns} campaigns recorded`} icon={(props) => <AlertTriangle {...props} />} tone={data.openDisputes ? "warning" : "success"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Verification requests by category" description="Every submission enters the queue as pending until reviewed.">
            {data.byCategory.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-muted-foreground">No verification records yet.</p>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byCategory} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={0} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Verification queue" description="Oldest first to keep review time fair." action={<Link to="/admin/verifications" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">Open queue <ArrowUpRight className="h-3.5 w-3.5" /></Link>} bodyClassName="p-0">
            {loading ? (
              <p className="px-5 py-6 text-[13px] text-muted-foreground">Loading…</p>
            ) : data.queue.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-muted-foreground">Nothing waiting for review.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {["Subject", "Category", "Submitted", "Status"].map((h) => (
                        <th key={h} className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.queue.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3.5 text-[14px] font-semibold text-navy">{r.subject_name || r.related_name || "—"}</td>
                        <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{VERIFICATION_CATEGORY_LABEL[r.category] || r.category}</td>
                        <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{formatDateTime(r.submitted_at || r.created_date)}</td>
                        <td className="px-5 py-3.5"><StatusPill status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recent disputes & reports" action={<Link to="/admin/disputes" className="text-[13px] font-semibold text-primary">Manage</Link>} bodyClassName="divide-y divide-border p-0">
            {data.disputes.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-muted-foreground">No disputes recorded.</p>
            ) : (
              data.disputes.map((d) => (
                <div key={d.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-navy">{d.campaign_title || d.category}</p>
                    <p className="line-clamp-1 text-[13px] text-muted-foreground">{d.description}</p>
                  </div>
                  <StatusPill status={d.status === "open" ? "pending" : d.status === "resolved" ? "verified" : d.status} />
                </div>
              ))
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Platform analytics" bodyClassName="divide-y divide-border p-0">
            {[
              { label: "Creators registered", value: data.creators, icon: UserRound },
              { label: "Brands registered", value: data.brands, icon: Building2 },
              { label: "Campaigns recorded", value: data.campaigns, icon: ShieldCheck },
              { label: "Documents pending", value: data.pendingDocuments, icon: FileText },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                <span className="flex items-center gap-2 text-[13.5px] text-muted-foreground"><row.icon className="h-4 w-4 text-primary" />{row.label}</span>
                <span className="font-heading text-[15px] font-bold text-navy">{row.value}</span>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Audit log" description="Latest recorded actions." bodyClassName="divide-y divide-border p-0">
            {data.audit.length === 0 ? (
              <p className="px-5 py-4 text-[13px] text-muted-foreground">No activity yet.</p>
            ) : (
              data.audit.map((a) => (
                <div key={a.id} className="px-5 py-3">
                  <p className="text-[13px] font-semibold text-navy">{a.action.replace(/_/g, " ")}</p>
                  <p className="text-[12px] text-muted-foreground">{a.actor_name || "System"} · {formatDateTime(a.created_date)}</p>
                  {a.details && <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{a.details}</p>}
                </div>
              ))
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}