import { GMAIL_HOST_SUFFIX, sanitizeGmailLocalTyping } from "@/lib/gmail-local-part";
import { cn } from "@/lib/utils";

export const gmailLocalPartHint = `Enter only the part before ${GMAIL_HOST_SUFFIX}.`;

/** Single canonical visual for the Gmail control — do not override with custom heights/radius in callers. */
const rowClassName =
  "flex min-h-9 w-full min-w-0 max-w-full items-stretch overflow-hidden rounded-md border bg-background text-sm shadow-sm transition-[color,box-shadow] focus-within:border-brand-purple focus-within:ring-2 focus-within:ring-brand-purple/20";

type RowProps = {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  disabled?: boolean;
  "aria-describedby"?: string;
};

/**
 * Inner row only (local part + `@gmail.com`). Prefer `GmailLocalPartField` in forms.
 */
export function GmailLocalPartInputRow({
  id,
  value,
  onValueChange,
  onBlur,
  error,
  disabled,
  "aria-describedby": ariaDescribedBy,
}: RowProps) {
  return (
    <div
      className={cn(
        rowClassName,
        error
          ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
          : "border-input",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <input
        id={id}
        type="text"
        name={id}
        disabled={disabled}
        value={value}
        onChange={(e) => onValueChange(sanitizeGmailLocalTyping(e.target.value))}
        onBlur={onBlur}
        maxLength={64}
        autoComplete="username"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="yourname"
        aria-label={`Gmail address local part, followed by ${GMAIL_HOST_SUFFIX}`}
        aria-describedby={ariaDescribedBy}
        className="h-full min-h-9 min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <div
        className="flex shrink-0 select-none items-center border-l border-border bg-muted px-2.5 sm:px-3"
        aria-hidden="true"
      >
        <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-foreground sm:text-sm">
          {GMAIL_HOST_SUFFIX}
        </span>
      </div>
    </div>
  );
}

type FieldProps = {
  id: string;
  /** Defaults to "Gmail address" everywhere for consistency. */
  label?: string;
  required?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  /** Inline validation message; also drives error border on the row. */
  error?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Full Gmail field: label + canonical row + hint + error.
 * Use this for every lead form so styling stays identical (welcome popup, apply, demo, brochure, contact).
 */
export function GmailLocalPartField({
  id,
  label = "Gmail address",
  required,
  value,
  onValueChange,
  onBlur,
  error,
  disabled,
  className,
}: FieldProps) {
  const hintId = `${id}-gmail-hint`;
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required ? (
          <>
            {" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </>
        ) : null}
      </label>
      <GmailLocalPartInputRow
        id={id}
        value={value}
        onValueChange={onValueChange}
        onBlur={onBlur}
        error={!!error}
        disabled={disabled}
        aria-describedby={hintId}
      />
      <p id={hintId} className="text-[11px] leading-snug text-muted-foreground">
        {gmailLocalPartHint}
      </p>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
