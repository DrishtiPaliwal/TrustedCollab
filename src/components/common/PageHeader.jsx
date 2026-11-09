/**
 * @param {{ eyebrow?: string, title: string, description?: string, actions?: import("react").ReactNode }} props
 */
export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="label-caption mb-1.5">{eyebrow}</p>}
        <h1 className="font-heading text-[26px] font-extrabold leading-tight tracking-tight text-navy sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}