"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Video,
  FileVideo,
  Sparkles,
  Layers,
  Edit3,
  FileText,
  Film,
  Palette,
  FileCode,
  FileSpreadsheet,
  Presentation,
  CheckSquare,
  ExternalLink,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useToast } from "../ui/Toast";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  isExternal?: boolean;
  isFunctional?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const { showToast } = useToast();

  const primaryItems: NavItem[] = [
    { label: "Home", href: "/", icon: Home, isFunctional: true },
  ];

  const productItems: NavItem[] = [
    { label: "Meetings", href: "/meetings", icon: Video, isFunctional: true },
    { label: "Recordings", href: "/recordings", icon: FileVideo },
    { label: "Summaries", href: "/summaries", icon: Sparkles },
    { label: "Hub", href: "/hub", icon: Layers, badge: "New", isExternal: true },
    { label: "Whiteboards", href: "/whiteboards", icon: Edit3, isExternal: true },
    { label: "Notes", href: "/notes", icon: FileText },
    { label: "Clips", href: "/settings?tab=clips", icon: Film, isFunctional: true },
    { label: "Canvas", href: "/settings?tab=canvas", icon: Palette, isFunctional: true },
    { label: "Paper", href: "/settings?tab=paper", icon: FileCode, isFunctional: true },
    { label: "Sheets", href: "/settings?tab=sheets", icon: FileSpreadsheet, isFunctional: true },
    { label: "Slides", href: "/settings?tab=slides", icon: Presentation, isFunctional: true },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
  ];

  const handleNonFunctionalClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    showToast(`${label} is coming soon in the next release.`, "info");
  };

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-zoom-border min-h-[calc(100vh-3.5rem)] hidden md:flex flex-col py-3 select-none">
        <div className="px-3 mb-2">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-zoom text-sm font-semibold transition-colors",
                  isActive
                    ? "text-zoom-blue bg-blue-50/70"
                    : "text-zoom-text hover:bg-gray-50 hover:text-zoom-blue"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-zoom-blue" : "text-zoom-muted")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="px-5 py-2">
          <p className="text-[11px] font-bold text-zoom-muted tracking-wider uppercase">
            My Products
          </p>
        </div>

        <div className="px-3 space-y-0.5 overflow-y-auto flex-1">
          {productItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === "/meetings" && pathname.startsWith("/meetings"));

            if (item.isFunctional) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-zoom text-sm transition-colors",
                    isActive
                      ? "text-zoom-blue font-bold bg-blue-50/70"
                      : "text-zoom-text font-medium hover:bg-gray-50 hover:text-zoom-blue"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4", isActive ? "text-zoom-blue" : "text-zoom-muted")} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                onClick={(e) => handleNonFunctionalClick(e, item.label)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-zoom text-sm font-medium text-zoom-text hover:bg-gray-50 hover:text-zoom-blue transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-zoom-muted" />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="text-[10px] bg-blue-100 text-zoom-blue font-semibold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.isExternal && (
                    <ExternalLink className="w-3 h-3 text-zoom-muted" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-zoom-border h-14 flex items-center justify-around z-40 px-2">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center gap-1 text-[11px] font-medium",
            pathname === "/" ? "text-zoom-blue" : "text-zoom-muted"
          )}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link
          href="/meetings"
          className={cn(
            "flex flex-col items-center gap-1 text-[11px] font-medium",
            pathname.startsWith("/meetings") ? "text-zoom-blue" : "text-zoom-muted"
          )}
        >
          <Video className="w-5 h-5" />
          <span>Meetings</span>
        </Link>
        <button
          onClick={() => showToast("Team Chat coming soon", "info")}
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-zoom-muted"
        >
          <Sparkles className="w-5 h-5" />
          <span>AI Summaries</span>
        </button>
        <button
          onClick={() => showToast("Whiteboards coming soon", "info")}
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-zoom-muted"
        >
          <Edit3 className="w-5 h-5" />
          <span>Whiteboards</span>
        </button>
      </nav>
    </>
  );
}
