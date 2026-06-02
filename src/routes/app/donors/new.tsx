import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, User, Mail, Phone, MapPin, Building, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth";

export const Route = createFileRoute("/app/donors/new")({
  component: NewDonorPage,
});

function NewDonorPage() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    pan: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('donors')
        .insert({
          org_id: organization.id,
          full_name: formData.fullName,
          email: formData.email || null,
          phone: formData.phone || null,
          pan_number: formData.pan || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          pincode: formData.pincode || null,
          status: 'active',
          donation_tier: 'standard',
          total_donated: 0
        })
        .select()
        .single();

      if (error) throw error;
      
      // Log activity
      await supabase.from('activity_log').insert({
        org_id: organization.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: `Added new donor: ${formData.fullName}`,
      });

      navigate({ to: "/app/donors" });
    } catch (err) {
      console.error(err);
      alert("Failed to create donor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate({ to: "/app/donors" })}
          className="size-10 rounded-full border border-border grid place-items-center hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h2 className="text-2xl font-display mb-1">New Donor</h2>
          <p className="text-sm text-muted-foreground">Add a new donor to your CRM.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-soft p-6 space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b border-border pb-2">Basic Information</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone Number (WhatsApp)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="+91..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b border-border pb-2">Compliance & Tax</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">PAN Number</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.pan}
                  onChange={e => setFormData({...formData, pan: e.target.value.toUpperCase()})}
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-background uppercase focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Required for 80G tax exemption receipts.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b border-border pb-2">Address</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Street Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <textarea
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full h-20 pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="123 Main St..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={e => setFormData({...formData, state: e.target.value})}
                  className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">PIN Code</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={e => setFormData({...formData, pincode: e.target.value})}
                  className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/app/donors" })}
            className="px-6 h-11 rounded-lg border border-border font-medium hover:bg-secondary transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.fullName}
            className="px-6 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm flex items-center gap-2"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? "Saving..." : "Save Donor"}
          </button>
        </div>
      </form>
    </div>
  );
}
