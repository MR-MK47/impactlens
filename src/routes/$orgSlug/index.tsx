import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Share2, Camera, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export const Route = createFileRoute("/$orgSlug/")({
  component: Trustfeed,
});

function Trustfeed() {
  const { orgSlug } = Route.useParams();
  
  const [organization, setOrganization] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [active, setActive] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrustfeed() {
      // 1. Get org by slug
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single();

      if (orgError || !org) {
        setLoading(false);
        return;
      }
      setOrganization(org);

      // 2. Get approved media submissions
      const { data: submissions } = await supabase
        .from('media_submissions')
        .select('*')
        .eq('org_id', org.id)
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      if (submissions) {
        setPosts(submissions);
        
        // Extract unique location tags or categories (using location_tag as a proxy for category here for demo)
        const cats = new Set<string>();
        submissions.forEach(s => {
          if (s.location_tag) cats.add(s.location_tag);
        });
        setCategories(["All", ...Array.from(cats)]);
      }

      setLoading(false);
    }

    loadTrustfeed();
  }, [orgSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
        <div className="size-16 rounded-full bg-secondary grid place-items-center mb-4">
          <Heart className="size-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-display mb-2">Organization not found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find an organization with the URL "{orgSlug}".</p>
        <Link to="/" className="text-primary hover:underline font-medium">Return Home</Link>
      </div>
    );
  }

  const filtered = active === "All" ? posts : posts.filter((p) => p.location_tag === active);

  return (
    <div className="bg-background min-h-screen">
      {/* Org header */}
      <header className="relative h-[320px] overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundColor: organization.theme_color || '#0D6E55' }} />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-6xl mx-auto px-6 h-full flex flex-col justify-end pb-8 text-white">
          <div className="flex items-end gap-6">
            {organization.logo_url ? (
              <img src={organization.logo_url} className="size-24 rounded-2xl bg-white object-cover ring-4 ring-white/30" alt="Logo" />
            ) : (
              <div className="size-24 rounded-2xl bg-white text-primary grid place-items-center ring-4 ring-white/30 text-3xl font-display">
                {organization.name.substring(0,2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 pb-1">
              <h1 className="font-display text-4xl md:text-5xl drop-shadow-sm">{organization.name}</h1>
              {organization.address && (
                <p className="mt-2 text-white/90 text-sm md:text-base max-w-2xl drop-shadow-sm">
                  {organization.address}
                </p>
              )}
            </div>
            <button className="hidden md:inline-flex h-11 px-5 rounded-lg bg-white text-black font-semibold items-center gap-2 hover:bg-white/90 transition-colors">
              <Heart className="size-4 text-rose-500" /> Donate
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-20">
        <div className="max-w-6xl mx-auto px-6 flex gap-6">
          <Link to={`/${orgSlug}`} className="h-14 flex items-center border-b-2 border-primary font-medium text-foreground">
            Impact Feed
          </Link>
          <Link to={`/${orgSlug}/blog`} className="h-14 flex items-center border-b-2 border-transparent text-muted-foreground hover:text-foreground">
            Blog
          </Link>
        </div>
      </div>

      {/* Filters */}
      {categories.length > 1 && (
        <div className="max-w-6xl mx-auto px-6 mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`h-9 px-4 rounded-full text-sm border transition-all ${
                active === c ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-foreground/70 hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Masonry */}
      <div className="max-w-6xl mx-auto px-6 mt-8 pb-20 columns-1 md:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
        {filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            No impact photos shared yet.
          </div>
        ) : (
          filtered.map((p, i) => (
            <article key={p.id} className="break-inside-avoid mb-5 card-soft overflow-hidden hover:-translate-y-1 transition-transform animate-rise" style={{animationDelay: `${i*60}ms`}}>
              <div className="relative">
                <img src={p.photo_url} alt="Impact" className="w-full object-cover" />
              </div>
              <div className="p-4 bg-background">
                <div className="flex items-center justify-between gap-3 mb-3">
                  {p.location_tag ? (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.location_tag}</span>
                  ) : <span />}
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(p.approved_at || p.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  {p.manual_description || p.ai_description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Camera className="size-3.5" /> AI-verified
                  </div>
                  <button className="size-8 rounded-md hover:bg-secondary grid place-items-center text-muted-foreground">
                    <Share2 className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <footer className="border-t border-border py-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors">
          <span className="size-1.5 rounded-full bg-primary" /> Powered by ImpactLens
        </Link>
      </footer>
    </div>
  );
}
