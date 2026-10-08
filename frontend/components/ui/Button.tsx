"use client";

import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "orange" | "danger" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoom-blue focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none rounded-zoom";

    const variantStyles = {
      primary: "bg-zoom-blue text-white hover:bg-zoom-blue-hover active:bg-blue-800 shadow-sm",
      orange: "bg-zoom-orange text-white hover:bg-zoom-orange-hover active:bg-orange-700 shadow-sm",
      danger: "bg-zoom-red text-white hover:bg-zoom-red-hover active:bg-red-800 shadow-sm",
      secondary: "bg-gray-100 text-zoom-text hover:bg-gray-200 active:bg-gray-300",
      outline: "border border-zoom-border bg-transparent text-zoom-text hover:bg-gray-50 active:bg-gray-100",
      ghost: "text-zoom-text hover:bg-black/5 active:bg-black/10",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
      icon: "h-10 w-10 p-2",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
