/**
 * @typedef {Object} StatTileProps
 * @property {string} label
 * @property {string | number} value
 * @property {string} [hint]
 * @property {number} [progress]
 * @property {import("react").ComponentType<{ className?: string; strokeWidth?: number }>} [icon]
 * @property {"default" | "success" | "warning"} [tone]
 */

import { Progress } from "@/components/ui/progress";

/**
 * @param {StatTileProps} props
 */
export default function StatTile({ label, value, hint, progress, icon: Icon, tone = "default" }) {
  const toneRing = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-primary";

  return (
    <div className="card-flat p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="label-caption">{label}</p>
        {Icon && <Icon className={`h-4 w-4 ${toneRing}`} strokeWidth={2} />}
      </div>
      <p className="mt-2 font-heading text-[26px] font-extrabold leading-none tracking-tight text-navy">{value}</p>
      {typeof progress === "number" && (
        <Progress value={progress} className="mt-3 h-1.5 bg-muted [&>div]:bg-primary" />
      )}
      {hint && <p className="mt-2 text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  );
}