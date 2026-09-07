import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface StateBlockProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  loading?: boolean;
  variant?: "empty" | "loading" | "error" | "warning";
  className?: string;
}

export function StateBlock({
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  loading,
  variant = "empty",
  className,
}: StateBlockProps) {
  const Icon =
    variant === "loading"
      ? Loader2
      : variant === "error"
        ? AlertCircle
        : variant === "warning"
          ? AlertCircle
          : Inbox;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border bg-white px-6 py-12 text-center",
        className
      )}
      role="status"
    >
      <Icon
        className={cn(
          "mb-3 h-10 w-10",
          variant === "loading" && "animate-spin text-primary",
          variant === "error" && "text-danger",
          variant === "warning" && "text-warning",
          variant === "empty" && "text-text-muted"
        )}
      />
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-text-muted">{description}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction ? (
          <Button onClick={onAction} loading={loading}>
            {variant === "error" || variant === "warning" ? (
              <RefreshCw className="h-4 w-4" />
            ) : null}
            {actionLabel}
          </Button>
        ) : null}
        {secondaryLabel && onSecondary ? (
          <Button variant="outline" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
