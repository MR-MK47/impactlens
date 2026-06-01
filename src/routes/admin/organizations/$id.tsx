import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Save, Users, Settings, Database } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export const Route = createFileRoute("/admin/organizations/$id")({
  component: AdminOrganizationDetails,
});

function AdminOrganizationDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  
  const [organization, setOrganization] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadOrg() {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (org) setOrganization(org);

      const { data: orgUsers } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', id);

      if (orgUsers) setUsers(orgUsers);

      const [donors, submissions, receipts] = await Promise.all([
        supabase.from('donors').select('*', { count: 'exact', head: true }).eq('org_id', id),
        supabase.from('media_submissions').select('*', { count: 'exact', head: true }).eq('org_id', id),
        supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('org_id', id),
      ]);

      setStats({
        donors: donors.count || 0,
        submissions: submissions.count || 0,
        receipts: receipts.count || 0,
      });

      setLoading(false);
    }
    loadOrg();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: organization.name,
          slug: organization.slug,
          type: organization.type,
          theme_color: organization.theme_color,
        })
        .eq('id', id);

      if (error) throw error;
      alert("Organization updated successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!organization) return <div className="text-slate-100">Organization not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/admin/organizations"
            className="size-10 rounded-full border border-slate-800 grid place-items-center hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-display mb-1">Manage Organization</h2>
            <div className="text-sm text-slate-500">ID: {organization.id}</div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-6 rounded-lg bg-accent text-slate-900 text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-medium border-b border-slate-800 pb-2 flex items-center gap-2">
              <Settings className="size-5 text-slate-400" /> Core Settings
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-slate-300">Name</label>
                <input
                  type="text"
                  value={organization.name}
                  onChange={e => setOrganization({...organization, name: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border border-slate-800 bg-slate-950 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-slate-300">Slug</label>
                <input
                  type="text"
                  value={organization.slug}
                  onChange={e => setOrganization({...organization, slug: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border border-slate-800 bg-slate-950 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-slate-300">Type</label>
                <select
                  value={organization.type}
                  onChange={e => setOrganization({...organization, type: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border border-slate-800 bg-slate-950 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent"
                >
                  <option value="ngo">NGO</option>
                  <option value="foundation">Foundation</option>
                  <option value="trust">Trust</option>
                  <option value="social_enterprise">Social Enterprise</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-slate-300">Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={organization.theme_color || '#0D6E55'}
                    onChange={e => setOrganization({...organization, theme_color: e.target.value})}
                    className="size-10 p-1 rounded border border-slate-800 bg-slate-950 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={organization.theme_color || '#0D6E55'}
                    onChange={e => setOrganization({...organization, theme_color: e.target.value})}
                    className="flex-1 h-10 px-3 rounded-lg border border-slate-800 bg-slate-950 text-sm uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
            <h3 className="text-lg font-medium border-b border-slate-800 pb-2 flex items-center gap-2 mb-4">
              <Users className="size-5 text-slate-400" /> Team Members
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-medium">{u.full_name}</td>
                      <td className="px-4 py-3 text-slate-400">{u.email}</td>
                      <td className="px-4 py-3 capitalize">{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-medium border-b border-slate-800 pb-2 flex items-center gap-2">
              <Database className="size-5 text-slate-400" /> Usage Stats
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm font-medium text-slate-400">Team Members</span>
                <span className="font-semibold text-white">{users.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm font-medium text-slate-400">Donors</span>
                <span className="font-semibold text-white">{stats.donors}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm font-medium text-slate-400">Media Submissions</span>
                <span className="font-semibold text-white">{stats.submissions}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm font-medium text-slate-400">Receipts Generated</span>
                <span className="font-semibold text-white">{stats.receipts}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
