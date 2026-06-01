import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Mail, Phone, MapPin, Building, Loader2, ReceiptText, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth";
import type { Donor } from "../../../lib/database.types";

export const Route = createFileRoute("/app/donors/$id")({
  component: DonorDetailsPage,
});

function DonorDetailsPage() {
  const { id } = Route.useParams();
  const { organization } = useAuth();
  const navigate = useNavigate();
  
  const [donor, setDonor] = useState<Donor | null>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDonor() {
      if (!organization) return;

      const { data: dData, error } = await supabase
        .from('donors')
        .select('*')
        .eq('id', id)
        .eq('org_id', organization.id)
        .single();

      if (error || !dData) {
        navigate({ to: "/app/donors" });
        return;
      }
      setDonor(dData as Donor);

      const { data: donData } = await supabase
        .from('donations')
        .select('*')
        .eq('donor_id', id)
        .order('donation_date', { ascending: false });

      if (donData) setDonations(donData);

      setLoading(false);
    }
    loadDonor();
  }, [id, organization]);

  if (loading || !donor) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = donor.full_name.substring(0, 2).toUpperCase();

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'platinum': return 'bg-slate-800 text-slate-100';
      case 'gold': return 'bg-amber-100 text-amber-800';
      case 'silver': return 'bg-slate-200 text-slate-800';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate({ to: "/app/donors" })}
            className="size-10 rounded-full border border-border grid place-items-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h2 className="text-2xl font-display mb-1">Donor Profile</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/app/receipts/new?donor_id=${donor.id}`} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90">
            <ReceiptText className="size-4" /> Log Donation
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card-soft p-6 text-center">
            <div className="size-20 rounded-full bg-primary/10 text-primary grid place-items-center text-xl font-display mx-auto mb-4">
              {initials}
            </div>
            <h3 className="text-xl font-semibold mb-1">{donor.full_name}</h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${getTierColor(donor.donation_tier)}`}>
                {donor.donation_tier}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold uppercase tracking-wide">
                {donor.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
              <div className="p-3 bg-secondary/50 rounded-lg text-left">
                <div className="text-xs text-muted-foreground mb-1">Total Donated</div>
                <div className="font-semibold text-lg text-emerald-600">₹{Number(donor.total_donated).toLocaleString('en-IN')}</div>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg text-left">
                <div className="text-xs text-muted-foreground mb-1">Donations</div>
                <div className="font-semibold text-lg">{donations.length}</div>
              </div>
            </div>
          </div>

          <div className="card-soft p-6 space-y-4">
            <h4 className="font-medium flex items-center gap-2 border-b border-border pb-2">
              <Building className="size-4 text-muted-foreground" /> Contact Info
            </h4>
            {donor.email && (
              <div className="flex items-start gap-3">
                <Mail className="size-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm font-medium">{donor.email}</div>
                </div>
              </div>
            )}
            {donor.phone && (
              <div className="flex items-start gap-3">
                <Phone className="size-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="text-sm font-medium">{donor.phone}</div>
                </div>
              </div>
            )}
            {donor.pan_number && (
              <div className="flex items-start gap-3">
                <Building className="size-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">PAN Number</div>
                  <div className="text-sm font-medium uppercase">{donor.pan_number}</div>
                </div>
              </div>
            )}
            {donor.address && (
              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Address</div>
                  <div className="text-sm font-medium">{donor.address}</div>
                  <div className="text-sm font-medium">{[donor.city, donor.state, donor.pincode].filter(Boolean).join(', ')}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card-soft overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="size-4" /> Donation History
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Method</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {donations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        No donations recorded yet.
                      </td>
                    </tr>
                  ) : (
                    donations.map((donation) => (
                      <tr key={donation.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="size-3.5 text-muted-foreground" />
                            {new Date(donation.donation_date).toLocaleDateString('en-IN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-emerald-600">
                          ₹{Number(donation.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 capitalize">
                          {donation.payment_method.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                            donation.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {donation.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
