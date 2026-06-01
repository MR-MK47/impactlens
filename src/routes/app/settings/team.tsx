import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { UserPlus, Mail, Shield, User, MoreVertical, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/app/settings/team")({ component: TeamSettings });

const TEAM = [
  { name: "Arjun Sharma", email: "arjun@createtogether.org", role: "Director", initials: "AS" },
  { name: "Rashmi Joshi", email: "rashmi@createtogether.org", role: "Manager", initials: "RJ" },
  { name: "Vikram Singh", email: "vikram.volunteer@gmail.com", role: "Volunteer", initials: "VS" },
];

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

function TeamSettings() {
  return (
    <SettingsLayout>
      <div className="space-y-8">
        <div>
          <h2 className="font-display text-2xl mb-1">Team Management</h2>
          <p className="text-muted-foreground text-sm">Manage who has access to your organization's dashboard.</p>
        </div>

        {/* Invite Form */}
        <div className="card-soft p-6 bg-surface border border-border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="size-4" /> Invite Team Member
          </h3>
          <form className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs font-medium mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm" placeholder="colleague@example.com" />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-xs font-medium mb-1.5 block">Role</label>
              <select className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm">
                <option value="director">Director (All Access)</option>
                <option value="manager">Manager (Can manage donors)</option>
                <option value="volunteer">Volunteer (Upload only)</option>
              </select>
            </div>
            <button type="button" className="w-full sm:w-auto h-10 px-6 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
              Send Invite
            </button>
          </form>
        </div>

        {/* Team List */}
        <div className="card-soft overflow-hidden">
          <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
            <h3 className="font-semibold text-sm">Active Members</h3>
            <span className="text-xs text-muted-foreground">3 / 5 seats used</span>
          </div>
          <div className="divide-y divide-border bg-background">
            {TEAM.map((member, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-secondary text-secondary-foreground font-medium text-sm grid place-items-center">
                    {member.initials}
                  </div>
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {member.name}
                      {member.role === "Director" && <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">Owner</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-surface border border-border px-2.5 py-1 rounded-md">
                    {member.role === "Director" ? <ShieldAlert className="size-3 text-red-500" /> : member.role === "Manager" ? <Shield className="size-3 text-blue-500" /> : <User className="size-3" />}
                    {member.role}
                  </div>
                  <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors">
                    <MoreVertical className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
