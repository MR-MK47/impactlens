import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Building2, Users, MessageSquare, HardDrive, MoreHorizontal, Camera } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: SuperAdmin });

const ORGS = [
  { n: "Create Together Foundation", t: "NGO", p: "Growth", u: 8, s: "Active" },
  { n: "Akshara Schools Trust", t: "NGO", p: "Free", u: 2, s: "Active" },
  { n: "Prerana Realty", t: "Real Estate", p: "Enterprise", u: 24, s: "Active" },
  { n: "BuildRight Constructions", t: "Construction", p: "Growth", u: 14, s: "Active" },
  { n: "Roots Organic Retail", t: "Retail", p: "Growth", u: 6, s: "Active" },
  { n: "Hope Welfare Society", t: "NGO", p: "Growth", u: 5, s: "Suspended" },
  { n: "Anandam Foundation", t: "NGO", p: "Free", u: 1, s: "Trial" },
];

function SuperAdmin() {
  return (
    <div className="min-h-[calc(100vh-3rem)] bg-slate-950 text-slate-100">
      <header className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-accent grid place-items-center text-slate-900"><Camera className="size-4" /></div>
          <span className="font-semibold">ImpactLens <span className="text-accent">Admin</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input placeholder="Search orgs, users…" className="h-9 pl-9 pr-3 rounded-lg bg-slate-900 border border-slate-800 text-sm w-64 outline-none focus:border-accent" />
          </div>
          <div className="size-9 rounded-full bg-accent grid place-items-center text-slate-900 text-xs font-bold">RA</div>
        </div>
      </header>

      <main className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* KPI bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { l: "Organizations", n: "47", i: Building2 },
            { l: "Users", n: "2,134", i: Users },
            { l: "WA Messages", n: "18,490", i: MessageSquare },
            { l: "Storage", n: "94.2 GB", i: HardDrive },
          ].map((k) => (
            <div key={k.l} className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex items-center gap-4">
              <div className="size-11 rounded-lg bg-accent/20 text-accent grid place-items-center">
                <k.i className="size-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">{k.l}</div>
                <div className="font-display text-3xl text-white mt-0.5">{k.n}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">Organizations</h2>
          <button className="h-10 px-4 rounded-lg bg-accent text-slate-900 font-semibold text-sm inline-flex items-center gap-2">
            <Plus className="size-4" /> New Org
          </button>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-900/60">
              <tr>
                {["Org Name", "Type", "Plan", "Users", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ORGS.map((o, i) => (
                <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-white">{o.n}</td>
                  <td className="px-5 py-3 text-slate-400">{o.t}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      o.p === "Enterprise" ? "bg-accent/20 text-accent" :
                      o.p === "Growth" ? "bg-emerald-500/20 text-emerald-400" :
                      "bg-slate-700 text-slate-300"
                    }`}>{o.p}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-300">{o.u}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      o.s === "Active" ? "bg-emerald-500/15 text-emerald-400" :
                      o.s === "Suspended" ? "bg-rose-500/15 text-rose-400" :
                      "bg-amber-500/15 text-amber-400"
                    }`}>
                      <span className="size-1.5 rounded-full bg-current" /> {o.s}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button className="h-8 px-3 rounded-md text-xs border border-slate-700 hover:bg-slate-800">View</button>
                      <button className="h-8 px-3 rounded-md text-xs border border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                        {o.s === "Suspended" ? "Restore" : "Suspend"}
                      </button>
                      <button className="size-8 grid place-items-center rounded-md hover:bg-slate-800 text-slate-400">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
