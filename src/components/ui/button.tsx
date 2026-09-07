import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50",
  secondary:
    "bg-primary-soft text-primary hover:bg-[#d7e2ef] disabled:opacity-50",
  ghost: "bg-transparent text-text hover:bg-black/5 disabled:opacity-50",
  danger: "bg-danger text-white hover:bg-[#991b1b] disabled:opacity-50",
  outline:
    "bg-white border border-border text-text hover:bg-bg disabled:opacity-50",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm min-w-[44px]",
  md: "h-11 px-4 text-sm min-w-[44px]",
  lg: "h-12 px-5 text-base min-w-[44px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-colors disabled:cursor-not-allowed",
          variantClass[variant],
          sizeClass[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
