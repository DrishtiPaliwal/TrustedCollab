import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, Users, TrendingUp } from "lucide-react";
import { Image } from "@/components/ui/image";
import { formatNumber, isSample } from "@/lib/helpers";
import SampleTag from "@/components/common/SampleTag";

/**
 * @param {{
 *   creator: {
 *     id: string | number,
 *     user_id?: string,
 *     full_name?: string,
 *     profile_photo?: string,
 *     location?: string,
 *     bio?: string,
 *     categories?: string[],
 *     total_followers?: number,
 *     average_engagement_rate?: number,
 *     years_experience?: number
 *   },
 *   verifiedCount?: number
 * }} props
 */
export default function CreatorCard({ creator, verifiedCount = 0 }) {
  const initials = (creator.full_name || "C").slice(0, 1).toUpperCase();
  const isCreatorSample = isSample(creator);

  return (
    <Link
      to={`/creators/${creator.id}`}
      className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        {creator.profile_photo ? (
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
            <Image src={creator.profile_photo} alt={creator.full_name} fittingType="fill" className="h-full w-full" />
          </div>
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-mint font-heading text-[15px] font-bold text-primary">
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-[15px] font-bold text-navy group-hover:text-primary">{creator.full_name}</h3>
          {isCreatorSample && <div className="mt-1"><SampleTag label="Sample" /></div>}
          <p className="flex items-center gap-1 text-[13px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{creator.location || "Location not set"}</span>
          </p>
        </div>
        {verifiedCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-tint px-2 py-0.5 text-[11px] font-semibold text-success">
            <ShieldCheck className="h-3 w-3" /> {verifiedCount}
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {creator.bio || "No biography added yet."}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(creator.categories || []).slice(0, 3).map((c) => (
          <span key={c} className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{c}</span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div>
          <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground"><Users className="h-3 w-3" />Followers</p>
          <p className="font-heading text-[14px] font-bold text-navy">{formatNumber(creator.total_followers || 0)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground"><TrendingUp className="h-3 w-3" />Engage</p>
          <p className="font-heading text-[14px] font-bold text-navy">{creator.average_engagement_rate ? `${creator.average_engagement_rate}%` : "—"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Experience</p>
          <p className="font-heading text-[14px] font-bold text-navy">{creator.years_experience ? `${creator.years_experience} yrs` : "—"}</p>
        </div>
      </div>
    </Link>
  );
}