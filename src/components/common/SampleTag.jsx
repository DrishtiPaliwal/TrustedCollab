import React from "react";

export default function SampleTag({ label = "Sample data" }) {
  return (
    <span className="inline-flex items-center rounded border border-dashed border-border bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}