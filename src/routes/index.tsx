import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Camera, Sparkles, ShieldCheck, Megaphone, ArrowRight, Heart,
  MessageSquare, Search, ReceiptText, Building2, HardHat, ShoppingBag,
  Check, Twitter, Linkedin, Instagram,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ImpactLens — One photo. A verified story for every donor." },
      { name: "description", content: "Turn field media into donor trust, WhatsApp receipts, and Google rankings — automatically." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="bg-background">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
            <Camera className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">ImpactLens</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-foreground/70">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#business">For Businesses</a>
        </div>
        <Link to="/onboarding" className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
          Get Started Free
        </Link>
      </nav>

      {/* Hero */}
      <section className="grain relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-medium mb-6">
              <Sparkles className="size-3.5" /> Impact Transparency Engine
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.02] text-foreground">
              One Photo from the Field. <em className="text-primary not-italic">A Verified Story</em> for Every Donor.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              ImpactLens turns field media into donor trust, WhatsApp receipts, and Google rankings — automatically.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/onboarding" className="h-12 px-6 rounded-lg bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 hover:opacity-90">
                Start for Free <ArrowRight className="size-4" />
              </Link>
              <Link to="/trustfeed" className="h-12 px-6 rounded-lg border border-foreground/15 font-medium inline-flex items-center hover:bg-secondary">
                See Demo
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex -space-x-2">
                {["#0D6E55","#F59E0B","#0ea5e9","#fb7185"].map((c) => (
                  <div key={c} className="size-7 rounded-full ring-2 ring-background" style={{background:c}} />
                ))}
              </div>
              Trusted by 47 organizations across India
            </div>
          </div>

          {/* Pipeline animated diagram */}
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent blur-3xl -z-10" />
            <div className="card-soft p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Live Pipeline</div>
              <div className="space-y-3">
                {[
                  { icon: Camera, label: "Upload", desc: "Volunteer captures field photo", color: "bg-primary/10 text-primary" },
                  { icon: Sparkles, label: "AI Process", desc: "Auto-describes & categorizes", color: "bg-accent/15 text-accent-foreground" },
                  { icon: ShieldCheck, label: "Approve", desc: "Director reviews in one tap", color: "bg-primary/10 text-primary" },
                  { icon: Megaphone, label: "Amplify", desc: "Trustfeed, WhatsApp, SEO blog", color: "bg-accent/15 text-accent-foreground" },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/40 animate-rise" style={{ animationDelay: `${i * 120}ms` }}>
                    <div className={`size-10 rounded-lg grid place-items-center ${s.color}`}>
                      <s.icon className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground">Step {i + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <h2 className="font-display text-4xl md:text-5xl max-w-2xl">Everything a small team needs. Nothing they don't.</h2>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Heart, title: "Trustfeed", desc: "Public impact wall with verified field photos. Share one link, prove everything." },
            { icon: MessageSquare, title: "WhatsApp CRM", desc: "Segment donors, send receipts, broadcast updates — all from one inbox." },
            { icon: Search, title: "AI SEO", desc: "Weekly blog posts auto-generated from your impact data. Rank without writing." },
            { icon: ReceiptText, title: "Receipt Engine", desc: "80G-ready receipts in seconds. PDF, WhatsApp, or print — your choice." },
          ].map((f) => (
            <div key={f.title} className="card-soft p-6 hover:-translate-y-1 transition-transform">
              <div className="size-11 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
                <f.icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business expansion */}
      <section id="business" className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="card-soft p-10 bg-gradient-to-br from-primary/[0.04] to-accent/[0.06] text-center">
          <h2 className="font-display text-4xl">Built for NGOs. <em className="text-primary not-italic">Scales to Any Business.</em></h2>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Heart, label: "NGO" },
              { icon: Building2, label: "Real Estate" },
              { icon: HardHat, label: "Construction" },
              { icon: ShoppingBag, label: "Retail" },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-3 p-4">
                <div className="size-14 rounded-2xl bg-surface border border-border grid place-items-center text-primary">
                  <b.icon className="size-6" />
                </div>
                <div className="text-sm font-medium">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl">Honest pricing for honest work.</h2>
          <p className="mt-3 text-muted-foreground">No setup fees. Cancel anytime.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {[
            { name: "Free", price: "₹0", desc: "Get started with the basics", features: ["Up to 50 uploads/mo", "Public Trustfeed", "Basic receipts", "1 user"] },
            { name: "Growth", price: "₹2,999", per: "/mo", desc: "Everything for a thriving NGO", features: ["Unlimited uploads", "WhatsApp broadcasts", "AI SEO blog", "Donor CRM", "5 users"], highlight: true },
            { name: "Enterprise", price: "Custom", desc: "For multi-program organizations", features: ["Custom workflows", "API access", "Dedicated success manager", "Unlimited users", "SSO + audit logs"] },
          ].map((p) => (
            <div
              key={p.name}
              className={`card-soft p-7 ${p.highlight ? "ring-2 ring-primary scale-[1.02] relative" : ""}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[11px] font-semibold">
                  MOST POPULAR
                </div>
              )}
              <div className="text-sm font-semibold text-primary">{p.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-5xl">{p.price}</span>
                {p.per && <span className="text-muted-foreground text-sm">{p.per}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <div className="my-6 h-px bg-border" />
              <ul className="space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="size-4 text-primary mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button className={`mt-7 w-full h-11 rounded-lg font-medium text-sm ${p.highlight ? "bg-primary text-primary-foreground" : "border border-foreground/15 hover:bg-secondary"}`}>
                {p.name === "Enterprise" ? "Talk to sales" : "Get started"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center"><Camera className="size-4"/></div>
              <span className="font-semibold">ImpactLens</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">The transparency engine for purpose-driven organizations.</p>
            <div className="mt-5 flex gap-3">
              {[Twitter, Linkedin, Instagram].map((I, i) => (
                <a key={i} href="#" className="size-9 rounded-lg border border-border grid place-items-center text-foreground/70 hover:bg-secondary"><I className="size-4" /></a>
              ))}
            </div>
          </div>
          {[
            { title: "Product", links: ["Features", "Pricing", "Trustfeed", "Receipts"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            { title: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
          ].map((g) => (
            <div key={g.title}>
              <div className="text-sm font-semibold mb-3">{g.title}</div>
              <ul className="space-y-2 text-sm text-muted-foreground">{g.links.map((l) => <li key={l}><a href="#">{l}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          Powered by ImpactLens · © 2026
        </div>
      </footer>
    </div>
  );
}
