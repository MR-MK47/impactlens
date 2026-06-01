import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Building2, Search, ArrowUpRight } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export const Route = createFileRoute("/admin/organizations/")({
  component: AdminOrganizationsList,
});

function AdminOrganizationsList() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadOrgs() {
      // Need to bypass RLS here or ensure the profile is a super_admin and RLS allows it
      // For this demo, assuming the RLS policy on organizations allows super_admins to select all
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          users:profiles(count)
        `)
        .order('created_at', { ascending: false });

      if (data) setOrganizations(data);
      setLoading(false);
    }
    loadOrgs();
  }, []);

  const filtered = organizations.filter(org => 
    org.name.toLowerCase().includes(search.toLowerCase()) || 
    org.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display mb-1 text-white">Organizations</h2>
          <p className="text-sm text-slate-400">
            Manage all NGOs and foundations on ImpactLens.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by organization name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-900/60">
              <tr>
                <th className="px-6 py-4 font-medium">Organization</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No organizations found.
                  </td>
                </tr>
              ) : (
                filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {org.logo_url ? (
                          <img src={org.logo_url} className="size-8 rounded-lg object-cover" />
                        ) : (
                          <div className="size-8 rounded-lg bg-accent/20 text-accent grid place-items-center text-xs font-semibold">
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white">{org.name}</div>
                          <div className="text-xs text-slate-500">/{org.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 capitalize">
                      {org.type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          to={`/${org.slug}`}
                          target="_blank"
                          className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="View Trustfeed"
                        >
                          <ArrowUpRight className="size-4" />
                        </Link>
                        <Link 
                          to={`/admin/organizations/${org.id}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
