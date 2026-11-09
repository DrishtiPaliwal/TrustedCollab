/**
 * @typedef {Object} SectionCardProps
 * @property {React.ReactNode} [title]
 * @property {React.ReactNode} [action]
 * @property {React.ReactNode} [description]
 * @property {React.ReactNode} children
 * @property {string} [className]
 * @property {string} [bodyClassName]
 */

/**
 * @param {SectionCardProps} props
 */
export default function SectionCard({
  title,
  action,
  description,
  children,
  className = "",
  bodyClassName = "",
}) {
  return (
    <section className={`card-flat overflow-hidden ${className}`}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            {title && <h3 className="text-[15px] font-bold tracking-tight text-navy">{title}</h3>}
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName || "p-5"}>{children}</div>
    </section>
  );
}