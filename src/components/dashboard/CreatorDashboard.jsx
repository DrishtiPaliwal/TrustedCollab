import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, Plus, Share2, UserRound, ShieldCheck, FileText, Inbox, FolderKanban } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatTile from "@/components/common/StatTile";
import StatusPill from "@/components/common/StatusPill";
import EmptyState from "@/components/common/EmptyState";
import useProfile from "@/hooks/useProfile";
import { formatNumber, formatDate, toItems } from "@/lib/helpers";
import { VERIFICATION_CATEGORIES, platformLabel } from "@/lib/constants";

/** @typedef {{ category: string, status: string }} VerificationRecord */
/** @typedef {{ id?: string, platform?: string, data_source?: string, verification_status?: string, handle?: string, account_url?: string, followers?: number, engagement_rate?: number }} SocialAccount */
/** @typedef {{ id?: string, title?: string, start_date?: string, brand_name?: string, reach?: number | null, performance_source?: string, brand_confirmed?: boolean, creator_confirmed?: boolean }} Campaign */
/** @typedef {{ id?: string, brand_name?: string, industry?: string }} BrandProfile */
/** @typedef {{ id?: string, full_name?: string, profile_completion?: number, total_followers?: number }} CreatorProfile */
/** @typedef {{ socials: SocialAccount[], verifications: VerificationRecord[], campaigns: Campaign[], brands: BrandProfile[], pendingRequests: number, documents: number }} DashboardData */

/** @param {VerificationRecord[]} records @param {string} key */
const scoreFor = (records, key) => {
  const rec = records.find((r) => r.category === key);
  if (!rec) return 0;
  if (rec.status === "verified") return 100;
  if (rec.status === "pending") return 50;
  return 0;
};

/** @param {{ user?: { id?: string } }} props */
export default function CreatorDashboard({ user }) {
  const { creatorProfile, loading } = useProfile();
  const [data, setData] = useState(
    /** @type {DashboardData} */ ({
      socials: /** @type {SocialAccount[]} */ ([]),
      verifications: /** @type {VerificationRecord[]} */ ([]),
      campaigns: /** @type {Campaign[]} */ ([]),
      brands: /** @type {BrandProfile[]} */ ([]),
      pendingRequests: 0,
      documents: 0,
    })
  );
  const profile = /** @type {CreatorProfile | null | undefined} */ (creatorProfile);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [socials, verifications, campaigns, brands, pendingRequests, documents] = await Promise.all([
        base44.entities.SocialAccount.filter({ user_id: user.id }, { limit: 20 }),
        base44.entities.VerificationRecord.filter({ subject_user_id: user.id }, { limit: 50 }),
        base44.entities.Campaign.filter({ creator_user_id: user.id }, { sort: "-start_date", limit: 6 }),
        base44.entities.BrandProfile.filter({}, { sort: "-created_date", limit: 3 }),
        base44.entities.CollaborationRequest.count({ to_user_id: user.id, status: "pending" }),
        base44.entities.Document.count({ user_id: user.id }),
      ]);
      setData({
        socials: toItems(socials),
        verifications: toItems(verifications),
        campaigns: toItems(campaigns),
        brands: toItems(brands),
        pendingRequests,
        documents,
      });
    })();
  }, [user?.id]);

  const verificationRows = useMemo(
    () => VERIFICATION_CATEGORIES.map((c) => ({ ...c, status: data.verifications.find((r) => r.category === c.key)?.status || "not_submitted" })),
    [data.verifications]
  );

  const verifiedCount = verificationRows.filter((v) => v.status === "verified").length;
  const coverage = Math.round(
    ["identity", "business", "product_document", "collaboration", "performance"].reduce((sum, k) => sum + scoreFor(data.verifications, k), 0) / 5 * 0.6 +
    (data.socials.length ? data.socials.filter((s) => s.verification_status === "verified").length / data.socials.length * 40 : 0)
  );

  const chartData = data.campaigns
    .filter((c) => c.reach)
    .slice(0, 6)
    .reverse()
    .map((c) => ({ name: (c.title || "Campaign").slice(0, 14), reach: c.reach }));

  const completion = profile?.profile_completion || 0;

  return (
    <div>
      <PageHeader
        eyebrow="Creator dashboard"
        title={`Welcome back${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description="Your evidence trail: credentials, connected accounts, product proof and measured campaign results."
        actions={
          <>
            <Button asChild variant="outline" className="h-11 rounded-md border-border"><Link to="/marketplace">Find brands</Link></Button>
            <Button asChild className="h-11 rounded-md bg-primary hover:bg-primary/90">
              <Link to="/profile"><Plus className="mr-1.5 h-4 w-4" /> Complete profile</Link>
            </Button>
          </>
        }
      />

      {!loading && !creatorProfile && (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning-tint px-4 py-3 text-[14px] text-warning">
          Finish creator setup to appear in brand searches. <Link to="/profile" className="font-semibold underline">Create your profile</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile label="Profile completion" value={`${completion}%`} progress={completion} hint={completion < 100 ? "Add your remaining details" : "Profile complete"} icon={/** @type {any} */ (UserRound)} />
        <StatTile label="Connected accounts" value={`${data.socials.length}`} hint={`${data.socials.filter((s) => s.data_source === "oauth_connected").length} via official API`} icon={/** @type {any} */ (Share2)} />
        <StatTile label="Audience" value={formatNumber(profile?.total_followers || 0)} hint="Across connected accounts" icon={/** @type {any} */ (UserRound)} />
        <StatTile label="Verified checks" value={`${verifiedCount} / 6`} hint={`${data.pendingRequests} pending request${data.pendingRequests === 1 ? "" : "s"}`} icon={/** @type {any} */ (ShieldCheck)} tone={verifiedCount ? "success" : "warning"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            title="Evidence coverage"
            description="Computed only from checks an administrator or the platform itself has verified."
            action={
              <div className="text-right">
                <p className="font-heading text-[24px] font-extrabold leading-none text-navy">{coverage}<span className="text-[14px] font-semibold text-muted-foreground">/100</span></p>
                <p className="mt-1 text-[12px] text-muted-foreground">{verifiedCount} of 6 checks verified</p>
              </div>
            }
          >
            <div className="space-y-4">
              {[
                { label: "Credentials", keys: ["identity", "business"] },
                { label: "Social accounts", keys: ["social"] },
                { label: "Product evidence", keys: ["product_document"] },
                { label: "Past performance", keys: ["collaboration", "performance"] },
              ].map((row) => {
                const value = Math.round(row.keys.reduce((s, k) => s + scoreFor(data.verifications, k), 0) / row.keys.length);
                return (
                  <div key={row.label}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <p className="text-[14px] font-semibold text-navy">{row.label}</p>
                      <p className="font-heading text-[13px] font-bold text-primary">{value}</p>
                    </div>
                    <Progress value={value} className="h-2 bg-muted [&>div]:bg-primary" />
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Reach by campaign" description="Only campaigns you have recorded with reach figures.">
            {chartData.length === 0 ? (
              <EmptyState icon={FolderKanban} title="No campaign data yet" description="Add a past collaboration to start building your performance record." action={<Button asChild className="h-10 bg-primary hover:bg-primary/90"><Link to="/campaigns">Add collaboration</Link></Button>} />
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} formatter={(v) => [formatNumber(typeof v === "number" || typeof v === "string" ? v : 0), "Reach"]} />
                    <Bar dataKey="reach" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={46} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recent collaborations" bodyClassName="p-0">
            {data.campaigns.length === 0 ? (
              <div className="p-5"><EmptyState icon={FolderKanban} title="Your history is empty" description="Record past work so brands can see what you have delivered." action={<Button asChild className="h-10 bg-primary hover:bg-primary/90"><Link to="/campaigns">Add collaboration</Link></Button>} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {["Campaign", "Brand", "Reach", "Evidence", "Status"].map((h) => (
                        <th key={h} className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3.5">
                          <p className="text-[14px] font-semibold text-navy">{c.title}</p>
                          <p className="text-[12px] text-muted-foreground">{formatDate(c.start_date)}</p>
                        </td>
                        <td className="px-5 py-3.5 text-[14px] text-muted-foreground">{c.brand_name || "—"}</td>
                        <td className="px-5 py-3.5 text-[14px] text-muted-foreground">{formatNumber(c.reach)}</td>
                        <td className="px-5 py-3.5">
                          <StatusPill status={c.performance_source === "independently_verified" ? "verified" : "pending"} label={c.performance_source === "independently_verified" ? "Verified" : "Self-reported"} />
                        </td>
                        <td className="px-5 py-3.5"><StatusPill status={c.brand_confirmed && c.creator_confirmed ? "verified" : "pending"} label={c.brand_confirmed && c.creator_confirmed ? "Confirmed" : "Awaiting confirmation"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            title="Verification status"
            action={<Link to="/verification" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">Manage <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
            bodyClassName="divide-y divide-border p-0"
          >
            {verificationRows.map((v) => (
              <div key={v.key} className="flex items-center justify-between gap-2 px-5 py-3.5">
                <p className="text-[13.5px] font-medium text-navy">{v.label}</p>
                <StatusPill status={v.status} />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="Connected accounts"
            action={<Link to="/social" className="text-[13px] font-semibold text-primary">Manage</Link>}
            bodyClassName="divide-y divide-border p-0"
          >
            {data.socials.length === 0 ? (
              <p className="px-5 py-4 text-[13px] text-muted-foreground">No accounts yet. Manual entries are labelled self-reported.</p>
            ) : (
              data.socials.slice(0, 4).map((s) => (
                <div key={s.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold text-navy">{platformLabel(s.platform ?? "")}</p>
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.data_source === "oauth_connected" ? "API" : "Self-reported"}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground">{s.handle || s.account_url || "—"}</p>
                  <div className="mt-1.5 flex gap-4 text-[13px] text-muted-foreground">
                    <span><strong className="font-semibold text-navy">{formatNumber(s.followers)}</strong> followers</span>
                    <span><strong className="font-semibold text-navy">{s.engagement_rate || 0}%</strong> engagement</span>
                  </div>
                </div>
              ))
            )}
          </SectionCard>

          <SectionCard title="Quick actions" bodyClassName="p-3">
            <div className="space-y-1">
              {[
                { to: "/requests", label: "Collaboration requests", icon: Inbox, meta: `${data.pendingRequests} pending` },
                { to: "/documents", label: "Uploaded documents", icon: FileText, meta: `${data.documents} files` },
                { to: "/campaigns", label: "Collaboration history", icon: FolderKanban, meta: `${data.campaigns.length} recent` },
              ].map((a) => (
                <Link key={a.to} to={a.to} className="flex min-h-[44px] items-center gap-3 rounded-md px-2 hover:bg-muted">
                  <a.icon className="h-4 w-4 text-primary" />
                  <span className="flex-1 text-[14px] font-medium text-navy">{a.label}</span>
                  <span className="text-[12px] text-muted-foreground">{a.meta}</span>
                </Link>
              ))}
            </div>
          </SectionCard>

          {data.brands.length > 0 && (
            <SectionCard title="Brands on the platform" action={<Link to="/marketplace" className="text-[13px] font-semibold text-primary">Browse</Link>} bodyClassName="divide-y divide-border p-0">
              {data.brands.map((b) => (
                <Link key={b.id} to={`/brands/${b.id}`} className="flex items-center justify-between gap-2 px-5 py-3 hover:bg-muted/50">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-navy">{b.brand_name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{b.industry || "Industry not set"}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}