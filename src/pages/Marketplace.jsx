import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";
import CreatorCard from "@/components/marketplace/CreatorCard";
import BrandCard from "@/components/marketplace/BrandCard";
import { Image } from "@/components/ui/image";
import { BadgeCheck, Loader2, Store, Compass, Package } from "lucide-react";
import { formatMoney, isSample, toItems } from "@/lib/helpers";
import SampleTag from "@/components/common/SampleTag";
import { CREATOR_CATEGORIES, INDUSTRIES, LOCATIONS, evidenceLevelLabel } from "@/lib/constants";
import StatusPill from "@/components/common/StatusPill";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ALL = "all";

export default function Marketplace() {
  const { user } = useAuth();
  const isBrand = user?.account_type === "brand";
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(isBrand ? "creators" : "brands");
  const [filters, setFilters] = useState(/** @type {{ q?: string, sort?: string, category?: string, location?: string, budget?: string, experience?: string, followers?: string, engagement?: string }} */ ({
    q: searchParams.get("q") || "", sort: "recommended", category: ALL, location: ALL,
    budget: ALL, experience: ALL, followers: ALL, engagement: ALL,
  }));
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState(/** @type {any[]} */ ([]));
  const [brands, setBrands] = useState(/** @type {any[]} */ ([]));
  const [products, setProducts] = useState(/** @type {any[]} */ ([]));
  const [brandProductCounts, setBrandProductCounts] = useState(/** @type {Record<string, number>} */ ({}));
  const [brandVerified, setBrandVerified] = useState(/** @type {Record<string, number>} */ ({}));
  const [creatorVerified, setCreatorVerified] = useState(/** @type {Record<string, number>} */ ({}));

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setFilters((f) => ({ ...f, q }));
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [verifications, allProducts] = await Promise.all([
          base44.entities.VerificationRecord.filter({ status: "verified" }, { limit: 300 }),
          base44.entities.Product.filter({}, { limit: 200 }),
        ]);
        if (!active) return;
        const counts = /** @type {Record<string, number>} */ ({});
        toItems(allProducts).forEach((p) => { counts[p.user_id] = (counts[p.user_id] || 0) + 1; });
        setBrandProductCounts(counts);
        const vmap = /** @type {Record<string, number>} */ ({});
        toItems(verifications).forEach((v) => { vmap[v.subject_user_id] = (vmap[v.subject_user_id] || 0) + 1; });
        setCreatorVerified(vmap);
        setBrandVerified(vmap);

        if (tab === "creators") {
          const query = {};
          if (filters.category !== ALL) query.categories = filters.category;
          if (filters.location !== ALL) query.location = filters.location;
          if (filters.followers !== ALL) query.total_followers = { $gte: Number(filters.followers) };
          if (filters.engagement !== ALL) query.average_engagement_rate = { $gte: Number(filters.engagement) };
          const sort = filters.sort === "followers" ? "-total_followers"
            : filters.sort === "engagement" ? "-average_engagement_rate"
            : filters.sort === "experience" ? "-years_experience"
            : "-created_date";
          const res = await base44.entities.CreatorProfile.filter(query, { sort, limit: 48 });
          if (active) setCreators(toItems(res));
        } else if (tab === "brands") {
          const query = {};
          if (filters.category !== ALL) query.industry = filters.category;
          if (filters.budget !== ALL) query.typical_budget_max = { $gte: Number(filters.budget) };
          if (filters.experience !== ALL) query.years_in_operation = { $gte: Number(filters.experience) };
          const sort = filters.sort === "budget" ? "-typical_budget_max" : "-created_date";
          const res = await base44.entities.BrandProfile.filter(query, { sort, limit: 48 });
          if (active) setBrands(toItems(res));
        } else {
          const query = filters.category !== ALL ? { category: filters.category } : {};
          const res = await base44.entities.Product.filter(query, { sort: "-created_date", limit: 48 });
          if (active) setProducts(toItems(res));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [tab, filters.category, filters.location, filters.budget, filters.experience, filters.followers, filters.engagement, filters.sort]);

  const q = (filters.q || "").toLowerCase().trim();

  const visibleCreators = useMemo(() => creators.filter((c) => !q ||
    [c.full_name, c.bio, c.location, ...(c.niches || []), ...(c.categories || []), ...(c.skills || [])]
      .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))), [creators, q]);

  const visibleBrands = useMemo(() => brands.filter((b) => !q ||
    [b.brand_name, b.company_name, b.industry, b.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))), [brands, q]);

  const visibleProducts = useMemo(() => products.filter((p) => !q ||
    [p.name, p.brand_name, p.category, p.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))), [products, q]);

  const options = {
    categories: tab === "creators" ? CREATOR_CATEGORIES : tab === "brands" ? INDUSTRIES : CREATOR_CATEGORIES,
    locations: LOCATIONS,
  };

  const resultCount = tab === "creators" ? visibleCreators.length : tab === "brands" ? visibleBrands.length : visibleProducts.length;

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title={isBrand ? "Discover creators" : "Discover brands"}
        description={isBrand
          ? "Filter by niche, audience, engagement and experience. Verification badges come only from reviewed evidence."
          : "Explore brands and their products before you pitch. Every claim shows its evidence level."}
      />

      {!isBrand && (
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setFilters((f) => ({ ...f, category: ALL })); }} className="mb-4">
          <TabsList className="h-11 bg-muted p-1">
            <TabsTrigger value="brands" className="min-h-[36px] px-4 text-[13px] data-[state=active]:bg-background data-[state=active]:text-navy">
              <Compass className="mr-1.5 h-4 w-4" /> Brands
            </TabsTrigger>
            <TabsTrigger value="products" className="min-h-[36px] px-4 text-[13px] data-[state=active]:bg-background data-[state=active]:text-navy">
              <Package className="mr-1.5 h-4 w-4" /> Products
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <MarketplaceFilters mode={isBrand ? "brand" : "creator"} filters={filters} setFilters={setFilters} options={options} resultCount={resultCount} />

      <div className="mt-4">
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : tab === "creators" ? (
          visibleCreators.length === 0 ? (
            <EmptyState icon={Compass} title="No creators match those filters" description="Try widening the audience size or clearing a filter." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCreators.map((c) => <CreatorCard key={c.id} creator={c} verifiedCount={creatorVerified[c.user_id] || 0} />)}
            </div>
          )
        ) : tab === "brands" ? (
          visibleBrands.length === 0 ? (
            <EmptyState icon={Store} title="No brands match those filters" description="Try a different industry or clear the budget filter." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleBrands.map((b) => (
                <BrandCard key={b.id} brand={b} productCount={brandProductCounts[b.user_id] || 0} verified={Boolean(brandVerified[b.user_id])} />
              ))}
            </div>
          )
        ) : visibleProducts.length === 0 ? (
          <EmptyState icon={Package} title="No products found" description="No brand has published a product in this category yet." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((p) => (
              <Link key={p.id} to={`/brands/${p.brand_profile_id}`} className="group card-flat overflow-hidden transition-colors hover:border-primary/40">
                <div className="aspect-[16/9] w-full bg-muted">
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt={p.name} fittingType="fill" className="h-full w-full" />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground"><Package className="h-7 w-7" /></div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-[15px] font-bold text-navy group-hover:text-primary">{p.name}</h3>
                      <p className="truncate text-[13px] text-muted-foreground">{p.brand_name}</p>
                      {isSample(p) && <div className="mt-1"><SampleTag label="Sample" /></div>}
                    </div>
                    <StatusPill status={p.verification_status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-[13px] text-muted-foreground">{p.category || "Uncategorised"}</span>
                    <span className="text-[13px] font-semibold text-navy">{formatMoney(p.retail_price, p.currency)}</span>
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-[12px] text-muted-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" /> {evidenceLevelLabel(p.evidence_level)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}