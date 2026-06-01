import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, CheckCircle2, Users, ReceiptText, MessageSquare,
  Search, Image as ImageIcon, BarChart3, Settings, Bell, ChevronDown,
  LogOut, Loader2
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";

const NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/approvals", label: "Approvals", icon: CheckCircle2 },
  { to: "/app/upload", label: "Upload Photo", icon: ImageIcon },
  { to: "/app/submissions", label: "My Submissions", icon: ImageIcon },
  { to: "/app/donors", label: "Donors", icon: Users },
  { to: "/app/receipts", label: "Receipts", icon: ReceiptText },
  { to: "/app/whatsapp", label: "WhatsApp", icon: MessageSquare },
  { to: "/app/seo", label: "SEO Blog", icon: Search },
  { to: "/app/media", label: "Media Library", icon: ImageIcon },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile, organization, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile || !organization) {
    return null; // Route guard will redirect
  }

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const orgInitials = organization.name.substring(0, 2).toUpperCase();
  const userInitials = profile.full_name.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-surface/60">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-border">
          {organization.logo_url ? (
            <img src={organization.logo_url} className="size-8 rounded-lg object-cover" alt="Org Logo" />
          ) : (
            <div className="size-8 rounded-lg text-primary-foreground grid place-items-center font-semibold text-xs" style={{ backgroundColor: organization.theme_color }}>
              {orgInitials}
            </div>
          )}
          <div className="leading-tight overflow-hidden">
            <div className="text-sm font-semibold truncate">{organization.name}</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              {organization.type.replace('_', ' ')} <ChevronDown className="size-3" />
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto tab-scroll">
          {NAV.map((item) => {
            const active = path === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors ${
                  active ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="group flex items-center justify-between p-2 rounded-lg hover:bg-secondary cursor-pointer">
            <div className="flex items-center gap-2 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} className="size-8 rounded-full object-cover shrink-0" alt="Avatar" />
              ) : (
                <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-xs font-semibold text-primary-foreground shrink-0">
                  {userInitials}
                </div>
              )}
              <div className="leading-tight truncate">
                <div className="text-xs font-medium truncate">{profile.full_name}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{profile.role}</div>
              </div>
            </div>
            <button onClick={handleSignOut} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 transition-all rounded hover:bg-red-500/10">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <header className="h-16 px-6 shrink-0 flex items-center justify-between border-b border-border bg-surface/50 backdrop-blur sticky top-0 z-30">
          <h1 className="text-lg font-display">{title}</h1>
          <div className="flex items-center gap-3">
            <Link to={`/${organization.slug}`} target="_blank" className="text-sm font-medium text-primary hover:underline hidden sm:block">
              View Trustfeed
            </Link>
            <button className="relative size-9 grid place-items-center rounded-lg hover:bg-secondary">
              <Bell className="size-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
