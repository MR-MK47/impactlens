import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Save, Building2, Link as LinkIcon, MessageSquare, Plus, Mail } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth";

export const Route = createFileRoute("/app/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const { organization, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("volunteer");
  const [inviting, setInviting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    address: "",
    pan_number: "",
    registration_number: "",
    wa_phone_number_id: "",
    wa_access_token: "",
    wa_business_account_id: "",
  });

  useEffect(() => {
    async function loadData() {
      if (!organization) return;
      
      setFormData({
        name: organization.name || "",
        slug: organization.slug || "",
        address: organization.address || "",
        pan_number: organization.pan_number || "",
        registration_number: organization.registration_number || "",
        wa_phone_number_id: organization.wa_phone_number_id || "",
        wa_access_token: organization.wa_access_token || "",
        wa_business_account_id: organization.wa_business_account_id || "",
      });

      if (profile?.role === 'director' || profile?.role === 'manager') {
        const { data } = await supabase
          .from('team_invites')
          .select('*')
          .eq('org_id', organization.id)
          .order('created_at', { ascending: false });
        if (data) setInvites(data);
      }

      setLoading(false);
    }
    loadData();
  }, [organization, profile]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || profile?.role === 'volunteer') return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update(formData)
        .eq('id', organization.id);

      if (error) throw error;
      
      await refreshProfile();
      alert("Settings saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !inviteEmail) return;

    setInviting(true);
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('team_invites')
        .insert({
          org_id: organization.id,
          email: inviteEmail,
          role: inviteRole,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      
      setInvites([data, ...invites]);
      setInviteEmail("");
      
      // In a real app, you would send an email here using a Edge Function or third party service.
      // For now, we'll just show the link.
      alert(`Invite created! Send this link to the user:\n\n${window.location.origin}/invite/${token}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create invite.");
    } finally {
      setInviting(false);
    }
  };

  const revokeInvite = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this invite?")) return;
    try {
      await supabase.from('team_invites').delete().eq('id', id);
      setInvites(invites.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const isDirector = profile?.role === 'director' || profile?.role === 'manager';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-display mb-1">Organization Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your profile, integrations, and team.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="card-soft p-6 space-y-6">
            <h3 className="text-lg font-medium border-b border-border pb-2 flex items-center gap-2">
              <Building2 className="size-5 text-primary" /> General Profile
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Organization Name</label>
                <input
                  type="text"
                  disabled={!isDirector}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1.5 block">Trustfeed URL Slug</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">impactlens.org/</span>
                  <input
                    type="text"
                    disabled={!isDirector}
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value})}
                    className="w-full h-11 pl-[125px] pr-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Registered Address</label>
                <textarea
                  disabled={!isDirector}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full h-20 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">PAN Number (for 80G)</label>
                  <input
                    type="text"
                    disabled={!isDirector}
                    value={formData.pan_number}
                    onChange={e => setFormData({...formData, pan_number: e.target.value})}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 uppercase"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Registration / NGO Darpan ID</label>
                  <input
                    type="text"
                    disabled={!isDirector}
                    value={formData.registration_number}
                    onChange={e => setFormData({...formData, registration_number: e.target.value})}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-medium border-b border-border pb-2 flex items-center gap-2 pt-4">
              <MessageSquare className="size-5 text-primary" /> WhatsApp API Credentials
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700">
                You need a Meta Developer Account to get these credentials. Only configure this if you want to send automated WhatsApp broadcasts.
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone Number ID</label>
                <input
                  type="password"
                  disabled={!isDirector}
                  value={formData.wa_phone_number_id}
                  onChange={e => setFormData({...formData, wa_phone_number_id: e.target.value})}
                  className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 font-mono text-sm"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1.5 block">System User Access Token (Permanent)</label>
                <input
                  type="password"
                  disabled={!isDirector}
                  value={formData.wa_access_token}
                  onChange={e => setFormData({...formData, wa_access_token: e.target.value})}
                  className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">WhatsApp Business Account ID</label>
                <input
                  type="password"
                  disabled={!isDirector}
                  value={formData.wa_business_account_id}
                  onChange={e => setFormData({...formData, wa_business_account_id: e.target.value})}
                  className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 font-mono text-sm"
                />
              </div>
            </div>

            {isDirector && (
              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="space-y-6">
          {isDirector && (
            <div className="card-soft p-6 space-y-6">
              <h3 className="text-lg font-medium border-b border-border pb-2 flex items-center gap-2">
                <LinkIcon className="size-5 text-primary" /> Invite Team
              </h3>
              
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Role</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  >
                    <option value="volunteer">Volunteer (Upload Only)</option>
                    <option value="manager">Manager (Approve & Comms)</option>
                    <option value="director">Director (Full Access)</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="w-full h-10 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {inviting ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Generate Invite Link
                </button>
              </form>

              {invites.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pending Invites</h4>
                  {invites.map(invite => (
                    <div key={invite.id} className="flex flex-col gap-1 p-3 rounded border border-border bg-surface/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate" title={invite.email}>{invite.email}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary uppercase font-semibold">{invite.role}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {invite.accepted_at ? (
                          <span className="text-xs text-emerald-500 font-medium">Accepted</span>
                        ) : new Date(invite.expires_at) < new Date() ? (
                          <span className="text-xs text-red-500 font-medium">Expired</span>
                        ) : (
                          <span className="text-xs text-amber-500 font-medium">Pending</span>
                        )}
                        
                        {!invite.accepted_at && (
                          <button 
                            onClick={() => revokeInvite(invite.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
