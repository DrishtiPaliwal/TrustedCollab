export default function EmptyState(
  /**
   * @type {{
   *   icon?: import("react").ComponentType<{ className?: string }>,
   *   title?: import("react").ReactNode,
   *   description?: import("react").ReactNode,
   *   action?: import("react").ReactNode,
   * }}
   */
  { icon: Icon, title, description, action }
) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      {Icon && (
        <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-mint text-primary">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <h3 className="text-[15px] font-bold text-navy">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}