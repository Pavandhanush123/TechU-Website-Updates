import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * App-wide toast notifications, styled as proper cards (padded, rounded,
 * shadowed, with a colored status icon) rather than a thin text bar.
 * Defaults — top-right placement, close button — live here so call sites
 * just use `toast.success(...)` / `toast.error(...)` and get the card look.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      closeButton
      duration={4500}
      gap={12}
      toastOptions={{
        classNames: {
          toast:
            "group toast w-full items-start gap-3 rounded-2xl border p-4 group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-[0_18px_45px_-20px_rgba(0,0,0,0.45)] [&>[data-icon]]:mt-0.5 [&>[data-icon]]:size-5 [&>[data-icon]]:shrink-0",
          title: "text-sm font-semibold leading-snug",
          description: "group-[.toast]:text-muted-foreground mt-0.5 text-xs",
          actionButton:
            "group-[.toast]:rounded-lg group-[.toast]:bg-brand-orange group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:rounded-lg group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:border-border group-[.toast]:bg-white group-[.toast]:text-foreground",
          success: "[&>[data-icon]]:text-emerald-600",
          error: "[&>[data-icon]]:text-red-600",
          warning: "[&>[data-icon]]:text-amber-600",
          info: "[&>[data-icon]]:text-brand-purple",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
