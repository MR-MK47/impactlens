import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Users, Search, Filter, Download, Plus, Mail, MessageCircle, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth";
import type { Donor } from "../../../lib/database.types";

export const Route = createFileRoute("/app/donors/")({
  component: DonorsIndex,
});

function DonorsIndex() {
  const { organization } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadDonors() {
      if (!organization) return;

      const { data } = await supabase
        .from('donors')
        .select('*')
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false });

      if (data) setDonors(data as Donor[]);
      setLoading(false);
    }
    loadDonors();
  }, [organization]);

  const filteredDonors = donors.filter(d => 
    d.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.email && d.email.toLowerCase().includes(search.toLowerCase())) ||
    (d.phone && d.phone.includes(search))
  );

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'platinum': return 'bg-slate-800 text-slate-100';
      case 'gold': return 'bg-amber-100 text-amber-800';
      case 'silver': return 'bg-slate-200 text-slate-800';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display mb-1">Donors</h2>
          <p className="text-sm text-muted-foreground">
            Manage your donor relationships and history.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 rounded-lg border border-border bg-background text-sm font-medium flex items-center gap-2 hover:bg-secondary">
            <Download className="size-4" /> Export CSV
          </button>
          <Link to="/app/donors/new" className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90">
            <Plus className="size-4" /> Add Donor
          </Link>
        </div>
      </div>

      <div className="card-soft overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-surface/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-medium flex items-center gap-2 hover:bg-secondary">
            <Filter className="size-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Donor Name</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status / Tier</th>
                <th className="px-6 py-4 font-medium text-right">Total Donated</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDonors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No donors found.
                  </td>
                </tr>
              ) : (
                filteredDonors.map((donor) => (
                  <tr key={donor.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{donor.full_name}</div>
                      {donor.city && <div className="text-xs text-muted-foreground mt-0.5">{donor.city}</div>}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      {donor.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Mail className="size-3" /> {donor.email}
                        </div>
                      )}
                      {donor.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <MessageCircle className="size-3" /> {donor.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${donor.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${getTierColor(donor.donation_tier)}`}>
                          {donor.donation_tier}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ₹{Number(donor.total_donated).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/app/donors/${donor.id}`}
                        className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
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
