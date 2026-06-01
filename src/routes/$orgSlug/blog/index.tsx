import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Loader2, FileText, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export const Route = createFileRoute("/$orgSlug/blog/")({
  component: TrustfeedBlogIndex,
});

function TrustfeedBlogIndex() {
  const { orgSlug } = Route.useParams();
  
  const [organization, setOrganization] = useState<any>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBlogs() {
      // 1. Get org
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single();

      if (!org) {
        setLoading(false);
        return;
      }
      setOrganization(org);

      // 2. Get published blogs
      const { data: publishedBlogs } = await supabase
        .from('seo_blogs')
        .select(`
          *,
          submission:media_submissions (photo_url)
        `)
        .eq('org_id', org.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (publishedBlogs) {
        setBlogs(publishedBlogs);
      }
      setLoading(false);
    }
    loadBlogs();
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
        <h1 className="text-2xl font-display mb-2">Organization not found</h1>
        <Link to="/" className="text-primary hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={`/${orgSlug}`} className="flex items-center gap-2 font-display text-lg font-semibold hover:opacity-80">
            {organization.logo_url ? (
              <img src={organization.logo_url} className="size-8 rounded object-cover" />
            ) : (
              <div className="size-8 rounded bg-primary text-primary-foreground grid place-items-center text-xs">
                {organization.name.substring(0,2).toUpperCase()}
              </div>
            )}
            {organization.name}
          </Link>
          <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium items-center gap-2 flex hover:opacity-90 transition-opacity">
            <Heart className="size-3.5" /> Donate
          </button>
        </div>
      </header>

      <div className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-20">
        <div className="max-w-4xl mx-auto px-6 flex gap-6">
          <Link to={`/${orgSlug}`} className="h-14 flex items-center border-b-2 border-transparent text-muted-foreground hover:text-foreground">
            Impact Feed
          </Link>
          <Link to={`/${orgSlug}/blog`} className="h-14 flex items-center border-b-2 border-primary font-medium text-foreground">
            Blog
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-display mb-4">Stories of Impact</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Read deeper stories about our work on the ground and the lives being transformed.
          </p>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
            <FileText className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No blog posts have been published yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {blogs.map((blog) => (
              <Link key={blog.id} to={`/${orgSlug}/blog/${blog.slug}`} className="group flex flex-col">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary mb-4">
                  {blog.submission?.photo_url && (
                    <img src={blog.submission.photo_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <time>{new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                  {blog.focus_keyword && (
                    <>
                      <span>&middot;</span>
                      <span className="uppercase tracking-wider">{blog.focus_keyword}</span>
                    </>
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {blog.title}
                </h2>
                <p className="text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {blog.meta_description}
                </p>
                <div className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read Story <ChevronRight className="size-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
