import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, Users, CheckCircle2, MessageSquare, IndianRupee, Loader2, ImageIcon, ReceiptText, Search } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    donors: 0,
    pendingSubmissions: 0,
    broadcastsSent: 0,
    totalDonations: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      if (!organization) return;
      
      const orgId = organization.id;

      // 1. Fetch Donors Count
      const { count: donorsCount } = await supabase
        .from('donors')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);

      // 2. Fetch Pending Submissions
      const { count: pendingCount } = await supabase
        .from('media_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'pending');

      // 3. Fetch Broadcasts Sent
      const { count: broadcastsCount } = await supabase
        .from('whatsapp_broadcasts')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'sent');

      // 4. Fetch Total Donations
      const { data: donations } = await supabase
        .from('donations')
        .select('amount, donation_date')
        .eq('org_id', orgId);

      let total = 0;
      const monthlyTotals: Record<string, number> = {};
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1); // Set to 1st to prevent month rollover on 31st
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        monthlyTotals[monthName] = 0;
      }

      if (donations) {
        donations.forEach(d => {
          total += Number(d.amount);
          const date = new Date(d.donation_date);
          const monthName = date.toLocaleString('default', { month: 'short' });
          if (monthlyTotals[monthName] !== undefined) {
            monthlyTotals[monthName] += Number(d.amount);
          }
        });
      }

      setMetrics({
        donors: donorsCount || 0,
        pendingSubmissions: pendingCount || 0,
        broadcastsSent: broadcastsCount || 0,
        totalDonations: total,
      });

      setChartData(Object.entries(monthlyTotals).map(([name, total]) => ({ name, total })));
      setLoading(false);
    }

    loadDashboard();
  }, [organization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Donors", value: metrics.donors.toString(), icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Raised", value: `₹${metrics.totalDonations.toLocaleString('en-IN')}`, icon: IndianRupee, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Pending Approvals", value: metrics.pendingSubmissions.toString(), icon: CheckCircle2, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Updates Sent", value: metrics.broadcastsSent.toString(), icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display">Welcome back</h2>
        <div suppressHydrationWarning className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card-soft p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={`size-10 rounded-lg ${kpi.bg} ${kpi.color} grid place-items-center`}>
                <kpi.icon className="size-5" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
                <ArrowUpRight className="size-3" />
                <span>Active</span>
              </div>
            </div>
            <div className="text-3xl font-display tracking-tight">{kpi.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-soft p-6">
          <h3 className="font-semibold mb-6">Donation Volume (Last 6 Months)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Donations']}
                />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-soft p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold">Quick Actions</h3>
          </div>
          <div className="p-2 space-y-1">
            <a href="/app/upload" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-sm font-medium transition-colors">
              <div className="size-8 rounded bg-primary/10 text-primary grid place-items-center"><ImageIcon className="size-4" /></div>
              Upload Field Photo
            </a>
            <a href="/app/receipts/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-sm font-medium transition-colors">
              <div className="size-8 rounded bg-primary/10 text-primary grid place-items-center"><ReceiptText className="size-4" /></div>
              Generate Receipt
            </a>
            <a href="/app/whatsapp/broadcast" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-sm font-medium transition-colors">
              <div className="size-8 rounded bg-primary/10 text-primary grid place-items-center"><MessageSquare className="size-4" /></div>
              Send WhatsApp Update
            </a>
            <a href={`/${organization?.slug}`} target="_blank" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-sm font-medium transition-colors">
              <div className="size-8 rounded bg-primary/10 text-primary grid place-items-center"><Search className="size-4" /></div>
              View Public Trustfeed
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
