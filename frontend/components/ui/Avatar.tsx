"use client";

import React from "react";
import { cn, getInitials, getAvatarColor } from "../../lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  isOnline?: boolean;
  bgColor?: string;
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
  isOnline,
  bgColor,
}: AvatarProps) {
  const sizeMap = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-2xl font-bold",
  };

  const badgeSizeMap = {
    xs: "w-1.5 h-1.5 bottom-0 right-0",
    sm: "w-2 h-2 bottom-0 right-0",
    md: "w-2.5 h-2.5 bottom-0 right-0",
    lg: "w-3 h-3 bottom-0.5 right-0.5",
    xl: "w-4 h-4 bottom-1 right-1",
  };

  const initials = getInitials(name);
  const colorClass = bgColor || getAvatarColor(name);

  return (
    <div className={cn("relative inline-block select-none", className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            "rounded-full object-cover",
            sizeMap[size]
          )}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-bold text-white shadow-sm",
            colorClass,
            sizeMap[size]
          )}
        >
          {initials}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute rounded-full border-2 border-white",
            isOnline ? "bg-green-500" : "bg-gray-400",
            badgeSizeMap[size]
          )}
        />
      )}
    </div>
  );
}
