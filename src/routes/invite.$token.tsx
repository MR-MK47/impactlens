import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Camera, Mail, Lock, Eye, EyeOff, User, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { signUp, signInWithGoogle, user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteData, setInviteData] = useState<any>(null);
  
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      // Fetch invite details
      const { data, error } = await supabase
        .from('team_invites')
        .select('*, organization:organizations(name, logo_url)')
        .eq('token', token)
        .single();

      if (error || !data) {
        setError("This invite link is invalid or has expired.");
        setLoading(false);
        return;
      }

      if (data.accepted_at) {
        setError("This invite has already been accepted.");
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError("This invite has expired.");
        setLoading(false);
        return;
      }

      setInviteData(data);
      setLoading(false);
    }
    
    if (token) {
      loadInvite();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Sign up the user
    const { error: err, user: newUser } = await signUp(inviteData.email, password, {
      full_name: fullName,
      role: inviteData.role,
    });
    
    if (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }

    // Give the trigger a moment to run
    setTimeout(async () => {
      // 1. Update profile with org_id
      await supabase
        .from('profiles')
        .update({ org_id: inviteData.org_id, role: inviteData.role })
        .eq('id', newUser!.id);

      // 2. Mark invite accepted
      await supabase
        .from('team_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', inviteData.id);

      await refreshProfile();
      navigate({ to: "/app/dashboard" });
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative px-4">
      <div className="card-soft p-8 w-full max-w-md relative z-10">
        
        {error ? (
          <div className="text-center">
            <div className="size-12 rounded-full bg-red-500/10 text-red-500 grid place-items-center mx-auto mb-4">
              <Lock className="size-6" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Invalid Invite</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80"
            >
              Go to Homepage
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-3 mb-6">
              {inviteData.organization?.logo_url ? (
                <img src={inviteData.organization.logo_url} className="size-10 rounded object-cover" />
              ) : (
                <div className="size-10 rounded bg-primary text-primary-foreground grid place-items-center">
                  <Camera className="size-5" />
                </div>
              )}
            </div>

            <h1 className="font-display text-2xl text-center mb-2">
              Join {inviteData.organization?.name}
            </h1>
            <p className="text-center text-sm text-muted-foreground mb-8">
              You've been invited as a {inviteData.role}. Set a password to accept.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={inviteData.email}
                    disabled
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-secondary/50 text-muted-foreground text-sm cursor-not-allowed"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full h-11 pl-10 pr-10 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
              >
                {submitting ? "Joining…" : "Accept Invite"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
