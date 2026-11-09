import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowUpRight, Building2, Package, Plus, ShieldCheck, Users, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatTile from "@/components/common/StatTile";
import StatusPill from "@/components/common/StatusPill";
import EmptyState from "@/components/common/EmptyState";
import CreatorCard from "@/components/marketplace/CreatorCard";
import useProfile from "@/hooks/useProfile";
import { formatMoney, formatNumber, toItems } from "@/lib/helpers";

/** @param {import("react").ComponentType<any>} Icon */
function makeStatIcon(Icon) {
  /** @param {{ className?: string; strokeWidth?: number }} props */
  return function StatIcon(props) {
    return <Icon {...props} />;
  };
}

const Building2StatIcon = makeStatIcon(Building2);
const PackageStatIcon = makeStatIcon(Package);
const UsersStatIcon = makeStatIcon(Users);
const ShieldCheckStatIcon = makeStatIcon(ShieldCheck);

/** @param {{ user?: { id?: string } }} props */
export default function BrandDashboard({ user }) {
  const { brandProfile: untypedBrandProfile, loading } = useProfile();
  /** @type {any} */
  const brandProfile = untypedBrandProfile;
  const [data, setData] = useState(/** @type {{ products: any[]; campaigns: any[]; verifications: any[]; creators: any[]; pendingRequests: number }} */ ({
    products: [],
    campaigns: [],
    verifications: [],
    creators: [],
    pendingRequests: 0,
  }));

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [products, campaigns, verifications, creators, pendingRequests] = await Promise.all([
        base44.entities.Product.filter({ user_id: user.id }, { sort: "-created_date", limit: 20 }),
        base44.entities.Campaign.filter({ brand_user_id: user.id }, { sort: "-start_date", limit: 20 }),
        base44.entities.VerificationRecord.filter({ subject_user_id: user.id }, { limit: 50 }),
        base44.entities.CreatorProfile.filter({}, { sort: "-created_date", limit: 3 }),
        base44.entities.CollaborationRequest.count({ to_user_id: user.id, status: "pending" }),
      ]);
      setData({
        products: toItems(products),
        campaigns: toItems(campaigns),
        verifications: toItems(verifications),
        creators: toItems(creators),
        pendingRequests,
      });
    })();
  }, [user?.id]);

  const campaignCost = data.campaigns.reduce((s, c) => s + (c.creator_fee || c.budget || 0), 0);
  const withRoi = data.campaigns.filter((c) => typeof c.roi === "number");
  const avgRoi = withRoi.length ? Math.round(withRoi.reduce((s, c) => s + c.roi, 0) / withRoi.length) : null;
  const verifiedProducts = data.products.filter((p) => p.verification_status === "verified").length;

  const chartData = data.campaigns
    .slice(0, 6)
    .reverse()
    .map((c) => ({ name: (c.title || "Campaign").slice(0, 12), Spend: c.creator_fee || c.budget || 0, Revenue: c.revenue_attributed || 0 }));

  return (
    <div>
      <PageHeader
        eyebrow="Brand dashboard"
        title={brandProfile?.brand_name ? `${brandProfile.brand_name}` : "Brand dashboard"}
        description="Publish products with real evidence, track campaign ROI and find creators whose numbers you can check."
        actions={
          <>
            <Button asChild variant="outline" className="h-11 rounded-md border-border"><Link to="/marketplace">Find creators</Link></Button>
            <Button asChild className="h-11 rounded-md bg-primary hover:bg-primary/90"><Link to="/products"><Plus className="mr-1.5 h-4 w-4" /> Add product</Link></Button>
          </>
        }
      />

      {!loading && !brandProfile && (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning-tint px-4 py-3 text-[14px] text-warning">
          Add your company profile so creators can evaluate you. <Link to="/company" className="font-semibold underline">Create company profile</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile label="Company profile" value={`${brandProfile?.profile_completion || 0}%`} progress={brandProfile?.profile_completion || 0} hint="Business details & contacts" icon={Building2StatIcon} />
        <StatTile label="Products" value={data.products.length} hint={`${verifiedProducts} with verified evidence`} icon={PackageStatIcon} tone={verifiedProducts ? "success" : "default"} />
        <StatTile label="Campaigns" value={data.campaigns.length} hint={`${formatMoney(campaignCost, brandProfile?.currency)} invested`} icon={UsersStatIcon} />
        <StatTile label="Average ROI" value={avgRoi === null ? "—" : `${avgRoi}%`} hint={avgRoi === null ? "Record revenue to calculate" : "Across campaigns with revenue"} icon={ShieldCheckStatIcon} tone={avgRoi && avgRoi > 0 ? "success" : "warning"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Campaign spend vs attributed revenue" description="Only figures your team has recorded. Attribution method is stored on each campaign.">
            {chartData.length === 0 ? (
              <EmptyState icon={Users} title="No campaigns recorded" description="Log a completed campaign to see ROI here." action={<Button asChild className="h-10 bg-primary hover:bg-primary/90"><Link to="/campaigns">Record a campaign</Link></Button>} />
            ) : (
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} formatter={(v) => formatMoney(typeof v === "number" || typeof v === "string" ? v : 0, brandProfile?.currency)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Spend" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={34} />
                    <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Campaign performance" bodyClassName="p-0">
            {data.campaigns.length === 0 ? (
              <div className="p-5"><EmptyState icon={Users} title="Nothing recorded yet" description="Campaign records carry reach, clicks, conversions and the attribution method behind them." action={<Button asChild className="h-10 bg-primary hover:bg-primary/90"><Link to="/campaigns">Record a campaign</Link></Button>} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {["Campaign", "Creator", "Reach", "Revenue", "ROI", "Status"].map((h) => (
                        <th key={h} className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.slice(0, 6).map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3.5 text-[14px] font-semibold text-navy">{c.title}</td>
                        <td className="px-5 py-3.5 text-[14px] text-muted-foreground">{c.creator_name || "—"}</td>
                        <td className="px-5 py-3.5 text-[14px] text-muted-foreground">{formatNumber(c.reach)}</td>
                        <td className="px-5 py-3.5 text-[14px] text-muted-foreground">{formatMoney(c.revenue_attributed, brandProfile?.currency)}</td>
                        <td className="px-5 py-3.5 text-[14px] font-semibold text-navy">{typeof c.roi === "number" ? `${c.roi}%` : "—"}</td>
                        <td className="px-5 py-3.5"><StatusPill status={c.status === "completed" ? "verified" : c.status === "disputed" ? "rejected" : "pending"} label={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Product verification" action={<Link to="/products" className="text-[13px] font-semibold text-primary">Manage</Link>} bodyClassName="divide-y divide-border p-0">
            {data.products.length === 0 ? (
              <p className="px-5 py-4 text-[13px] text-muted-foreground">No products yet.</p>
            ) : (
              data.products.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-navy">{p.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{p.category || "Uncategorised"}</p>
                  </div>
                  <StatusPill status={p.verification_status} />
                </div>
              ))
            )}
          </SectionCard>

          <SectionCard title="Requests" action={<Link to="/requests" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">Inbox <ArrowUpRight className="h-3.5 w-3.5" /></Link>} bodyClassName="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-mint text-primary"><Inbox className="h-5 w-5" /></span>
              <div>
                <p className="font-heading text-[22px] font-extrabold leading-none text-navy">{data.pendingRequests}</p>
                <p className="text-[13px] text-muted-foreground">pending collaboration request{data.pendingRequests === 1 ? "" : "s"}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Creator discovery" action={<Link to="/marketplace" className="text-[13px] font-semibold text-primary">Browse</Link>} bodyClassName="space-y-3 p-4">
            {data.creators.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No creators have joined yet.</p>
            ) : (
              data.creators.map((c) => <CreatorCard key={c.id} creator={c} />)
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}