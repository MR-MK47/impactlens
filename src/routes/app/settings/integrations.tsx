import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CheckCircle2, Link as LinkIcon, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/app/settings/integrations")({ component: IntegrationsSettings });

function SettingsLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <AppShell title="Settings">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {[
              { path: "/app/settings", label: "Organization" },
              { path: "/app/settings/team", label: "Team Management" },
              { path: "/app/settings/integrations", label: "Integrations" },
              { path: "/app/settings/billing", label: "Billing & Plans" },
            ].map(item => {
              const isActive = currentPath === item.path || (item.path !== "/app/settings" && currentPath.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AppShell>
  );
}

const INTEGRATIONS = [
  {
    name: "Razorpay",
    desc: "Sync donations automatically and track payment status.",
    status: "connected",
    icon: "₹",
    color: "bg-blue-500",
  },
  {
    name: "WACRM",
    desc: "Send WhatsApp broadcasts and track donor engagement.",
    status: "connected",
    icon: "W",
    color: "bg-[#25D366]",
  },
  {
    name: "Stripe",
    desc: "Accept international payments and subscriptions.",
    status: "disconnected",
    icon: "S",
    color: "bg-indigo-500",
  },
  {
    name: "Mailchimp",
    desc: "Sync your donor list for email marketing campaigns.",
    status: "disconnected",
    icon: "M",
    color: "bg-yellow-400 text-black",
  },
];

function IntegrationsSettings() {
  return (
    <SettingsLayout>
      <div className="space-y-8">
        <div>
          <h2 className="font-display text-2xl mb-1">Integrations</h2>
          <p className="text-muted-foreground text-sm">Connect your favorite tools to ImpactLens.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {INTEGRATIONS.map((app) => (
            <div key={app.name} className="card-soft p-5 border border-border bg-surface flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className={`size-12 rounded-xl grid place-items-center font-display text-xl font-bold text-white shadow-sm ${app.color}`}>
                  {app.icon}
                </div>
                {app.status === "connected" ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-md">
                    <CheckCircle2 className="size-3.5" /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                    <AlertCircle className="size-3.5" /> Not Connected
                  </span>
                )}
              </div>
              
              <h3 className="font-semibold mb-1">{app.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">{app.desc}</p>
              
              <div>
                {app.status === "connected" ? (
                  <button className="w-full h-9 rounded-lg border border-border font-medium text-sm hover:bg-secondary transition-colors text-muted-foreground">
                    Configure
                  </button>
                ) : (
                  <button className="w-full h-9 rounded-lg bg-foreground text-background font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    <LinkIcon className="size-3.5" /> Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SettingsLayout>
  );
}
