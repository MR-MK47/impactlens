import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Building2, Upload, MessageSquare, Paintbrush, Users, ArrowRight, Check, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { fileToBase64 } from "../lib/gemini";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingFlow,
});

function OnboardingFlow() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Org Data
  const [orgType, setOrgType] = useState("ngo");
  const [orgName, setOrgName] = useState("");
  const [website, setWebsite] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  
  // Customization
  const [themeColor, setThemeColor] = useState("#0D6E55");
  const [gridLayout, setGridLayout] = useState("masonry");

  // Integrations
  const [waConnected, setWaConnected] = useState(false);

  // Team
  const [invites, setInvites] = useState([{ email: "", role: "manager" }]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
    } else if (profile?.org_id) {
      // If already has org, go to dashboard
      navigate({ to: "/app/dashboard" });
    }
  }, [user, profile, navigate]);

  const handleNext = async () => {
    setError("");
    
    if (step === 1 && !orgType) {
      setError("Please select an organization type.");
      return;
    }
    
    if (step === 2 && !orgName) {
      setError("Organization name is required.");
      return;
    }

    if (step === 5) {
      await finishOnboarding();
      return;
    }

    setStep(s => s + 1);
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      // 1. Create Organization
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      let logoUrl = null;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${slug}-logo-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('org-assets')
          .upload(fileName, logoFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('org-assets')
          .getPublicUrl(fileName);
          
        logoUrl = publicUrl;
      }

      // Insert org
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: slug,
          type: orgType,
          website: website || null,
          logo_url: logoUrl,
          theme_color: themeColor,
          grid_layout: gridLayout,
          whatsapp_connected: waConnected
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Update user profile with org_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ org_id: orgData.id })
        .eq('id', user!.id);

      if (profileError) throw profileError;

      // 3. Send Team Invites (if any valid ones)
      const validInvites = invites.filter(i => i.email.includes('@'));
      if (validInvites.length > 0) {
        const { error: inviteError } = await supabase
          .from('team_invites')
          .insert(
            validInvites.map(i => ({
              org_id: orgData.id,
              email: i.email,
              role: i.role,
              invited_by: user!.id
            }))
          );
        if (inviteError) console.error("Failed to send invites:", inviteError);
      }

      // 4. Create default categories
      await supabase.from('categories').insert([
        { org_id: orgData.id, name: 'General', color: themeColor, sort_order: 1 }
      ]);

      // Refresh auth context to pull org_id
      await refreshProfile();
      
      // Redirect
      navigate({ to: "/app/dashboard" });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create organization.");
      setLoading(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-16 border-b border-border flex items-center px-6">
        <div className="text-sm font-semibold tracking-tight flex items-center gap-2">
          <div className="size-6 rounded bg-primary text-primary-foreground grid place-items-center text-[10px]">IL</div>
          ImpactLens Setup
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left side - content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-lg">
            
            {/* Progress */}
            <div className="flex items-center gap-2 mb-10">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
              ))}
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Step 1 */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h1 className="text-3xl font-display mb-2">Welcome! What are you building?</h1>
                <p className="text-muted-foreground mb-8">We'll customize ImpactLens for your specific workflow.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'ngo', icon: Building2, label: 'NGO / Non-Profit' },
                    { id: 'real_estate', icon: Building2, label: 'Real Estate' },
                    { id: 'construction', icon: Building2, label: 'Construction' },
                    { id: 'other', icon: Building2, label: 'Other Business' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setOrgType(t.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${orgType === t.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50 hover:bg-secondary'}`}
                    >
                      <t.icon className={`size-6 mb-3 ${orgType === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="font-medium">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h1 className="text-3xl font-display mb-2">Organization Details</h1>
                <p className="text-muted-foreground mb-8">Let's get your basics set up.</p>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Organization Name *</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Green Earth Foundation"
                      className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Website URL (Optional)</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Logo (Optional)</label>
                    <div className="flex items-center gap-4">
                      <div className="size-16 rounded-lg border border-dashed border-border bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Upload className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={handleLogoSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="h-9 px-4 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 inline-flex items-center cursor-pointer transition-colors"
                        >
                          Choose Image
                        </label>
                        <div className="text-xs text-muted-foreground mt-1.5">Square JPG/PNG, max 2MB</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="size-12 rounded-xl bg-[#25D366]/10 text-[#25D366] grid place-items-center mb-6">
                  <MessageSquare className="size-6" />
                </div>
                <h1 className="text-3xl font-display mb-2">Connect WhatsApp</h1>
                <p className="text-muted-foreground mb-8">
                  ImpactLens integrates directly with the Meta WhatsApp Cloud API to send receipts and impact updates.
                </p>
                
                <div className="card-soft p-5 border-primary/20 bg-primary/5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-primary/20 p-1">
                      <Check className="size-3 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Configured via .env</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        WhatsApp integration relies on your <code>.env</code> file credentials. If you've set them up, we'll use them automatically.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="wa-check"
                    checked={waConnected}
                    onChange={(e) => setWaConnected(e.target.checked)}
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="wa-check" className="text-sm">
                    Yes, enable WhatsApp features in the dashboard
                  </label>
                </div>
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h1 className="text-3xl font-display mb-2">Style your Trustfeed</h1>
                <p className="text-muted-foreground mb-8">Customize your public impact wall.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Brand Color</label>
                    <div className="flex gap-3">
                      {["#0D6E55", "#F59E0B", "#2563EB", "#E11D48", "#7C3AED", "#000000"].map(c => (
                        <button
                          key={c}
                          onClick={() => setThemeColor(c)}
                          className={`size-10 rounded-full border-2 transition-transform ${themeColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-3 block">Grid Layout</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setGridLayout('masonry')}
                        className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center gap-2 ${gridLayout === 'masonry' ? 'border-primary bg-primary/5 text-primary' : 'border-border'}`}
                      >
                        <div className="w-full h-16 bg-secondary rounded flex gap-1 p-1">
                          <div className="flex-1 bg-border rounded" />
                          <div className="flex-1 bg-border/50 rounded h-10" />
                          <div className="flex-1 bg-border rounded h-12" />
                        </div>
                        Masonry
                      </button>
                      <button
                        onClick={() => setGridLayout('3-col')}
                        className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center gap-2 ${gridLayout === '3-col' ? 'border-primary bg-primary/5 text-primary' : 'border-border'}`}
                      >
                        <div className="w-full h-16 bg-secondary rounded flex gap-1 p-1">
                          <div className="flex-1 bg-border rounded" />
                          <div className="flex-1 bg-border rounded" />
                          <div className="flex-1 bg-border rounded" />
                        </div>
                        Grid (3 cols)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5 */}
            {step === 5 && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h1 className="text-3xl font-display mb-2">Invite your team</h1>
                <p className="text-muted-foreground mb-8">Add managers or volunteers to help capture impact.</p>
                
                <div className="space-y-4">
                  {invites.map((invite, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="email"
                        placeholder="colleague@example.com"
                        value={invite.email}
                        onChange={(e) => {
                          const newInvites = [...invites];
                          newInvites[idx].email = e.target.value;
                          setInvites(newInvites);
                        }}
                        className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <select
                        value={invite.role}
                        onChange={(e) => {
                          const newInvites = [...invites];
                          newInvites[idx].role = e.target.value;
                          setInvites(newInvites);
                        }}
                        className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
                      >
                        <option value="manager">Manager</option>
                        <option value="volunteer">Volunteer</option>
                      </select>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => setInvites([...invites, { email: "", role: "volunteer" }])}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    + Add another
                  </button>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="mt-10 flex items-center justify-between pt-6 border-t border-border">
              {step > 1 ? (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Back
                </button>
              ) : <div />}
              
              <button
                onClick={handleNext}
                disabled={loading}
                className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-medium text-sm inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {step === 5 ? "Finish Setup" : "Continue"}
                {step !== 5 && <ArrowRight className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right side - preview */}
        <div className="hidden lg:block flex-1 bg-surface border-l border-border relative">
          <div className="absolute inset-0 p-12 flex flex-col items-center justify-center">
            
            {/* Dynamic Preview Card */}
            <div className="w-full max-w-sm card-soft p-6 shadow-xl relative overflow-hidden transition-all duration-500">
              <div className="absolute top-0 inset-x-0 h-1.5 transition-colors duration-500" style={{ backgroundColor: themeColor }} />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded overflow-hidden bg-secondary grid place-items-center">
                  {logoPreview ? (
                    <img src={logoPreview} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">{orgName || "Organization Name"}</div>
                  <div className="text-xs text-muted-foreground">{website || "www.website.org"}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-4 w-3/4 bg-secondary rounded" />
                <div className="h-4 w-1/2 bg-secondary rounded" />
                <div className="h-24 w-full bg-secondary rounded mt-4" />
              </div>
            </div>

            <p className="mt-8 text-sm text-muted-foreground text-center max-w-xs">
              This is how your organization will appear on Trustfeed and receipts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
