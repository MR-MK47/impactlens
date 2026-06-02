import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Download, Plus, ReceiptText, Calendar, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth";

export const Route = createFileRoute("/app/receipts/")({
  component: ReceiptsIndex,
});

function ReceiptsIndex() {
  const { organization } = useAuth();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadReceipts() {
      if (!organization) return;

      const { data } = await supabase
        .from('receipts')
        .select(`
          *,
          donation:donations (amount, donation_date),
          donor:donors (full_name)
        `)
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false });

      if (data) setReceipts(data);
      setLoading(false);
    }
    loadReceipts();
  }, [organization]);

  const filteredReceipts = receipts.filter(r => 
    r.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
    (r.donor?.full_name && r.donor.full_name.toLowerCase().includes(search.toLowerCase()))
  );

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
          <h2 className="text-2xl font-display mb-1">Receipts & Billing</h2>
          <p className="text-sm text-muted-foreground">
            Manage tax-exempt donation receipts (80G/501c3).
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link to="/app/receipts/new" className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90">
            <Plus className="size-4" /> Generate Receipt
          </Link>
        </div>
      </div>

      <div className="card-soft overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-surface/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by receipt number or donor name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Receipt No.</th>
                <th className="px-6 py-4 font-medium">Date Issued</th>
                <th className="px-6 py-4 font-medium">Donor Name</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No receipts found.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <ReceiptText className="size-4 text-muted-foreground" />
                        {receipt.receipt_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(receipt.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {receipt.donor?.full_name || 'Unknown Donor'}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-600">
                      ₹{Number(receipt.donation?.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      {receipt.is_80g ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold uppercase tracking-wide">
                          80G Tax Exempt
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-semibold uppercase tracking-wide">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {receipt.pdf_url ? (
                        <button 
                          onClick={async () => {
                            try {
                              const res = await fetch(receipt.pdf_url);
                              const html = await res.text();
                              const blob = new Blob([html], { type: 'text/html' });
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                              setTimeout(() => URL.revokeObjectURL(url), 5000);
                            } catch (e) {
                              window.open(receipt.pdf_url, '_blank');
                            }
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors"
                        >
                          <Download className="size-3.5" /> Receipt
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Generating...</span>
                      )}
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
