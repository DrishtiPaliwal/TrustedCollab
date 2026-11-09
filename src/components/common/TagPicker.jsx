/**
 * @typedef {Object} TagPickerProps
 * @property {string[]} options
 * @property {string[]} [value]
 * @property {(nextValue: string[]) => void} onChange
 * @property {string} [className]
 */

import { cn } from "@/lib/utils";

/**
 * @param {TagPickerProps} props
 */
export default function TagPicker({ options, value = [], onChange, className = "" }) {
  /** @type {string[]} */
  const selected = Array.isArray(value) ? value : [];

  /**
   * @param {string} opt
   */
  const toggle = (opt) => {
    if (selected.includes(opt)) onChange(selected.filter((v) => v !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "min-h-[36px] rounded-full border px-3 text-[13px] font-medium transition-colors",
              active
                ? "border-primary bg-mint text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-navy"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}