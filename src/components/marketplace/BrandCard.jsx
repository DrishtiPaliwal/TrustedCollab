import React from "react";
import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, Package } from "lucide-react";
import { Image } from "@/components/ui/image";
import { formatMoney, isSample } from "@/lib/helpers";
import SampleTag from "@/components/common/SampleTag";

/**
 * @param {{
 *   brand: {
 *     id: string | number,
 *     user_id?: string,
 *     brand_name?: string,
 *     logo?: string,
 *     address?: string,
 *     description?: string,
 *     industry?: string,
 *     preferred_creator_categories?: string[],
 *     typical_budget_min?: number,
 *     typical_budget_max?: number,
 *     currency?: string
 *   },
 *   productCount?: number,
 *   verified?: boolean
 * }} props
 */
export default function BrandCard({ brand, productCount = 0, verified = false }) {
  const initials = (brand.brand_name || "B").slice(0, 2).toUpperCase();
  return (
    <Link
      to={`/brands/${brand.id}`}
      className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        {brand.logo ? (
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
            <Image src={brand.logo} alt={brand.brand_name} fittingType="fill" className="h-full w-full" />
          </div>
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-mint font-heading text-[14px] font-bold text-primary">
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-[15px] font-bold text-navy group-hover:text-primary">{brand.brand_name}</h3>
          {isSample(brand) && <div className="mt-1"><SampleTag label="Sample" /></div>}
          <p className="flex items-center gap-1 text-[13px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{brand.address || "Location not set"}</span>
          </p>
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-tint px-2 py-0.5 text-[11px] font-semibold text-success">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {brand.description || "No brand description added yet."}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {brand.industry && (
          <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{brand.industry}</span>
        )}
        {(brand.preferred_creator_categories || []).slice(0, 2).map((c) => (
          <span key={c} className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{c}</span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Package className="h-3.5 w-3.5" /> {productCount} product{productCount === 1 ? "" : "s"}
        </p>
        <p className="text-[13px] text-muted-foreground">
          Budget{" "}
          <strong className="font-semibold text-navy">
            {brand.typical_budget_min || brand.typical_budget_max
              ? `${formatMoney(brand.typical_budget_min, brand.currency)}–${formatMoney(brand.typical_budget_max, brand.currency)}`
              : "Not disclosed"}
          </strong>
        </p>
      </div>
    </Link>
  );
}