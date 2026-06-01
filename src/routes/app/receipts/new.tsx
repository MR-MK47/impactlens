import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, IndianRupee, CreditCard, Building2, Wallet } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth";
import type { Donor } from "../../../lib/database.types";
import { renderReceiptToPDF } from "../../../lib/receipt-renderer";

export const Route = createFileRoute("/app/receipts/new")({
  component: NewReceiptPage,
});

function NewReceiptPage() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const searchParams = Route.useSearch<{ donor_id?: string }>();
  
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    donorId: searchParams.donor_id || "",
    amount: "",
    paymentMethod: "bank_transfer",
    is80G: false,
    notes: "",
  });

  useEffect(() => {
    async function loadDonors() {
      if (!organization) return;
      const { data } = await supabase
        .from('donors')
        .select('*')
        .eq('org_id', organization.id)
        .order('full_name', { ascending: true });
        
      if (data) setDonors(data as Donor[]);
      setLoading(false);
    }
    loadDonors();
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    
    setSubmitting(true);
    try {
      const selectedDonor = donors.find(d => d.id === formData.donorId);
      if (!selectedDonor) throw new Error("Donor not found");

      // 1. Create Donation Record
      const { data: donation, error: donationError } = await supabase
        .from('donations')
        .insert({
          org_id: organization.id,
          donor_id: selectedDonor.id,
          amount: parseFloat(formData.amount),
          currency: 'INR',
          payment_method: formData.paymentMethod,
          status: 'completed',
          donation_date: new Date().toISOString()
        })
        .select()
        .single();

      if (donationError) throw donationError;

      // 2. Generate Receipt Number (Simple logic: ORG-YYYY-XXXX)
      const year = new Date().getFullYear();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const receiptNumber = `${organization.name.substring(0,3).toUpperCase()}-${year}-${randomNum}`;

      // 3. Generate PDF 
      const pdfBlob = await renderReceiptToPDF({
        organization: {
          name: organization.name,
          address: organization.address || '',
          panNumber: organization.pan_number || '',
          registrationNumber: organization.registration_number || '',
          logoUrl: organization.logo_url || undefined,
        },
        donor: {
          name: selectedDonor.full_name,
          address: selectedDonor.address || '',
          panNumber: selectedDonor.pan_number || undefined,
        },
        receiptNumber,
        date: new Date().toISOString(),
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        is80G: formData.is80G,
      });

      // 4. Upload PDF to Storage
      const fileName = `${organization.id}/${receiptNumber}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, pdfBlob, { contentType: 'application/pdf' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // 5. Save Receipt Record
      const { error: receiptError } = await supabase
        .from('receipts')
        .insert({
          org_id: organization.id,
          donation_id: donation.id,
          receipt_number: receiptNumber,
          is_80g: formData.is80G,
          pdf_url: publicUrl,
        });

      if (receiptError) throw receiptError;

      // 6. Update Donor Total
      await supabase.rpc('increment_donor_total', {
        d_id: selectedDonor.id,
        amount_to_add: parseFloat(formData.amount)
      });

      // Log activity
      await supabase.from('activity_log').insert({
        org_id: organization.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: `Generated receipt ${receiptNumber} for ₹${formData.amount}`,
      });

      navigate({ to: "/app/receipts" });
    } catch (err) {
      console.error(err);
      alert("Failed to generate receipt.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDonor = donors.find(d => d.id === formData.donorId);
  const canIssue80G = selectedDonor?.pan_number && organization?.pan_number;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate({ to: "/app/receipts" })}
          className="size-10 rounded-full border border-border grid place-items-center hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h2 className="text-2xl font-display mb-1">Generate Receipt</h2>
          <p className="text-sm text-muted-foreground">Log a donation and generate a compliant PDF receipt.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-soft p-6 space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b border-border pb-2">Donation Details</h3>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <div className="flex justify-between items-end mb-1.5">
                <label className="text-sm font-medium block">Select Donor *</label>
                <Link to="/app/donors/new" className="text-xs text-primary font-medium hover:underline">
                  + Add New Donor
                </Link>
              </div>
              <select
                required
                value={formData.donorId}
                onChange={e => setFormData({...formData, donorId: e.target.value})}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="" disabled>Choose a donor...</option>
                {donors.map(d => (
                  <option key={d.id} value={d.id}>{d.full_name} ({d.email || d.phone || 'No contact info'})</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Donation Amount (INR) *</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full h-11 pl-10 pr-4 text-lg font-semibold rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Payment Method *</label>
              <div className="grid grid-cols-3 gap-3">
                <label className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${formData.paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary'}`}>
                  <input type="radio" name="method" value="bank_transfer" className="sr-only" onChange={e => setFormData({...formData, paymentMethod: e.target.value})} checked={formData.paymentMethod === 'bank_transfer'} />
                  <Building2 className="size-5 mb-2" />
                  <span className="text-xs font-medium">Bank Transfer</span>
                </label>
                <label className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${formData.paymentMethod === 'credit_card' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary'}`}>
                  <input type="radio" name="method" value="credit_card" className="sr-only" onChange={e => setFormData({...formData, paymentMethod: e.target.value})} checked={formData.paymentMethod === 'credit_card'} />
                  <CreditCard className="size-5 mb-2" />
                  <span className="text-xs font-medium">Card / Online</span>
                </label>
                <label className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${formData.paymentMethod === 'cash' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary'}`}>
                  <input type="radio" name="method" value="cash" className="sr-only" onChange={e => setFormData({...formData, paymentMethod: e.target.value})} checked={formData.paymentMethod === 'cash'} />
                  <Wallet className="size-5 mb-2" />
                  <span className="text-xs font-medium">Cash</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b border-border pb-2">Tax Exemption</h3>
          
          <label className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${formData.is80G ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'}`}>
            <input 
              type="checkbox" 
              className="mt-1"
              checked={formData.is80G}
              onChange={e => setFormData({...formData, is80G: e.target.checked})}
              disabled={!canIssue80G}
            />
            <div>
              <div className="font-medium">Issue 80G Tax Exemption Receipt</div>
              <div className="text-sm text-muted-foreground mt-1">
                Generates a formal 80G receipt allowing the donor to claim tax deductions.
              </div>
              {!canIssue80G && formData.donorId && (
                <div className="mt-2 text-xs font-medium text-amber-600 bg-amber-500/10 p-2 rounded">
                  Cannot issue 80G. Either the donor's PAN or your organization's PAN is missing.
                </div>
              )}
            </div>
          </label>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-8">
          <button
            type="button"
            onClick={() => navigate({ to: "/app/receipts" })}
            className="px-6 h-11 rounded-lg border border-border font-medium hover:bg-secondary transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.amount || !formData.donorId || (formData.is80G && !canIssue80G)}
            className="px-6 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm flex items-center gap-2"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? "Generating PDF..." : "Generate Receipt"}
          </button>
        </div>
      </form>
    </div>
  );
}
