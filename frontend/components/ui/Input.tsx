"use client";

import React from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = "text", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-zoom-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            "w-full h-10 px-3.5 rounded-zoom border bg-white text-zoom-text text-sm transition-colors",
            "border-zoom-border placeholder:text-zoom-muted",
            "focus:outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/20",
            "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
            error && "border-zoom-red focus:border-zoom-red focus:ring-zoom-red/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-zoom-red font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-zoom-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
