import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import {
  ShieldCheck, LayoutDashboard, Compass, UserRound, Building2, Package, Share2,
  FolderKanban, FileCheck2, Inbox, Settings, AlertTriangle, LogOut, Search, Bell, FileText,
} from "lucide-react";

const CREATOR_NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/marketplace", label: "Marketplace", icon: Compass },
  { to: "/campaigns", label: "Collaborations", icon: FolderKanban },
  { to: "/requests", label: "Requests", icon: Inbox },
  { to: "/profile", label: "My profile", icon: UserRound },
  { to: "/social", label: "Social accounts", icon: Share2 },
  { to: "/verification", label: "Verification", icon: FileCheck2 },
  { to: "/documents", label: "Documents", icon: FileText },
];

const BRAND_NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/marketplace", label: "Marketplace", icon: Compass },
  { to: "/campaigns", label: "Campaigns", icon: FolderKanban },
  { to: "/requests", label: "Requests", icon: Inbox },
  { to: "/company", label: "Company profile", icon: Building2 },
  { to: "/products", label: "Products", icon: Package },
  { to: "/verification", label: "Verification", icon: FileCheck2 },
  { to: "/documents", label: "Documents", icon: FileText },
];

const ADMIN_NAV = [
  { to: "/", label: "Platform overview", icon: LayoutDashboard, end: true },
  { to: "/admin/verifications", label: "Verification queue", icon: FileCheck2 },
  { to: "/admin/disputes", label: "Disputes & reports", icon: AlertTriangle },
  { to: "/marketplace", label: "Directory", icon: Compass },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function useNavFor(user) {
  if (user?.role === "admin") return ADMIN_NAV;
  if (user?.account_type === "brand") return BRAND_NAV;
  return CREATOR_NAV;
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
        <ShieldCheck className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span className="font-heading text-[17px] font-extrabold tracking-tight text-navy">CreatorTrust</span>
    </Link>
  );
}

export default function AppShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const nav = useNavFor(user);

  const roleLabel = user?.role === "admin" ? "Administrator" : user?.account_type === "brand" ? "Brand" : "Creator";
  const displayName = user?.full_name || user?.email || "Your account";

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/marketplace?q=${encodeURIComponent(query.trim())}` : "/marketplace");
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="label-caption px-3 pb-2">{roleLabel} workspace</p>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center gap-3 rounded-md px-3 text-[14px] font-medium transition-colors ${
                  isActive
                    ? "bg-mint text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-navy"
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint font-heading text-[13px] font-bold text-primary">
              {(user?.full_name || user?.email || "C").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-navy">{displayName}</p>
              <p className="truncate text-[12px] text-muted-foreground">{roleLabel}</p>
            </div>
            <button
              onClick={() => base44.auth.logout("/login")}
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-navy"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/requests")}
            className="grid h-10 w-10 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label="Requests"
          >
            <Bell className="h-5 w-5" />
          </button>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-mint font-heading text-[13px] font-bold text-primary">
            {(user?.full_name || user?.email || "C").slice(0, 1).toUpperCase()}
          </span>
        </div>
      </header>

      <div className="lg:pl-[264px]">
        {/* Desktop topbar */}
        <div className="sticky top-0 z-20 hidden h-16 items-center justify-between gap-6 border-b border-border bg-background/95 px-8 backdrop-blur lg:flex">
          <form onSubmit={submitSearch} className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, niche or handle"
              className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-[14px] text-navy placeholder:text-muted-foreground/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </form>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
              {roleLabel}
            </span>
            <Link
              to="/settings"
              className="grid h-10 w-10 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-navy"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <main className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background lg:hidden">
        {nav.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" strokeWidth={2} />
            <span className="truncate">{item.label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}