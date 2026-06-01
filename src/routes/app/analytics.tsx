import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Loader2, TrendingUp, Users, ReceiptText, MessageSquare, IndianRupee } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

export const Route = createFileRoute("/app/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalRaised: 0,
    totalReceipts: 0,
    totalBroadcasts: 0,
  });
  const [donationTrend, setDonationTrend] = useState<any[]>([]);

  useEffect(() => {
    async function loadAnalytics() {
      if (!organization) return;
      const orgId = organization.id;

      // Parallel data fetching for performance
      const [
        donorsResult,
        receiptsResult,
        broadcastsResult,
        donationsResult
      ] = await Promise.all([
        supabase.from('donors').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('whatsapp_broadcasts').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('donations').select('amount, donation_date').eq('org_id', orgId)
      ]);

      let totalRaised = 0;
      const monthlyData: Record<string, number> = {};
      
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyData[monthKey] = 0;
      }

      if (donationsResult.data) {
        donationsResult.data.forEach(d => {
          totalRaised += Number(d.amount);
          const date = new Date(d.donation_date);
          const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
          if (monthlyData[monthKey] !== undefined) {
            monthlyData[monthKey] += Number(d.amount);
          }
        });
      }

      setStats({
        totalDonors: donorsResult.count || 0,
        totalReceipts: receiptsResult.count || 0,
        totalBroadcasts: broadcastsResult.count || 0,
        totalRaised
      });

      setDonationTrend(Object.entries(monthlyData).map(([name, amount]) => ({ name, amount })));
      setLoading(false);
    }
    loadAnalytics();
  }, [organization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Raised", value: `₹${stats.totalRaised.toLocaleString('en-IN')}`, icon: IndianRupee, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Total Donors", value: stats.totalDonors.toString(), icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Receipts Issued", value: stats.totalReceipts.toString(), icon: ReceiptText, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Updates Sent", value: stats.totalBroadcasts.toString(), icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display mb-1">Analytics</h2>
          <p className="text-sm text-muted-foreground">Monitor your fundraising and impact metrics.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card-soft p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={`size-10 rounded-lg ${kpi.bg} ${kpi.color} grid place-items-center`}>
                <kpi.icon className="size-5" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
                <TrendingUp className="size-3" />
                <span>Active</span>
              </div>
            </div>
            <div className="text-3xl font-display tracking-tight">{kpi.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-soft p-6">
          <h3 className="font-semibold mb-6">Donation Trend (Last 12 Months)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donationTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `₹${v/1000}k`} />
                <RechartsTooltip
                  cursor={{ fill: "#f1f5f9", strokeWidth: 1, strokeDasharray: "3 3" }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Donations']}
                />
                <Line type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-soft p-6">
          <h3 className="font-semibold mb-6">Donor Acquisition (Placeholder)</h3>
          <div className="h-[300px] w-full flex items-center justify-center border-2 border-dashed border-border rounded-xl bg-secondary/50">
            <p className="text-sm text-muted-foreground text-center px-6">
              More advanced cohort analytics will appear here as you collect more donor data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
