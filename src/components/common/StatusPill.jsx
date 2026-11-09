/**
 * @typedef {{
 *   status?: string;
 *   label?: string;
 *   className?: string;
 * }} StatusPillProps
 */

import { CheckCircle2, Clock, AlertTriangle, MinusCircle, RefreshCw } from "lucide-react";

/** @type {Record<string, { label: string; cls: string; Icon: any }>} */
const MAP = {
  verified: { label: "Verified", cls: "bg-success-tint text-success border-success/25", Icon: CheckCircle2 },
  pending: { label: "Pending", cls: "bg-warning-tint text-warning border-warning/25", Icon: Clock },
  under_review: { label: "Under review", cls: "bg-warning-tint text-warning border-warning/25", Icon: Clock },
  rejected: { label: "Rejected", cls: "bg-danger-tint text-danger border-danger/25", Icon: AlertTriangle },
  flagged: { label: "Flagged", cls: "bg-danger-tint text-danger border-danger/25", Icon: AlertTriangle },
  expired: { label: "Expired", cls: "bg-muted text-muted-foreground border-border", Icon: MinusCircle },
  requires_renewal: { label: "Renewal needed", cls: "bg-warning-tint text-warning border-warning/25", Icon: RefreshCw },
  not_submitted: { label: "Not submitted", cls: "bg-muted/60 text-muted-foreground border-dashed border-border", Icon: MinusCircle },
};

/**
 * @param {StatusPillProps} props
 */
export default function StatusPill({ status = "not_submitted", label, className = "" }) {
  const conf = MAP[status] || MAP.not_submitted;
  const Icon = conf.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium whitespace-nowrap ${conf.cls} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {label || conf.label}
    </span>
  );
}