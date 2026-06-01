import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export const Route = createFileRoute("/$orgSlug/blog/$postSlug")({
  component: TrustfeedBlogPost,
});

function TrustfeedBlogPost() {
  const { orgSlug, postSlug } = Route.useParams();
  
  const [organization, setOrganization] = useState<any>(null);
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
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

      // 2. Get blog
      const { data: post } = await supabase
        .from('seo_blogs')
        .select(`
          *,
          submission:media_submissions (photo_url),
          author:profiles!seo_blogs_created_by_fkey (full_name, avatar_url)
        `)
        .eq('org_id', org.id)
        .eq('slug', postSlug)
        .eq('is_published', true)
        .single();

      if (post) {
        setBlog(post);
        document.title = `${post.title} | ${org.name}`;
      }
      setLoading(false);
    }
    loadPost();
  }, [orgSlug, postSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization || !blog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
        <h1 className="text-2xl font-display mb-2">Post not found</h1>
        <Link to={`/${orgSlug}/blog`} className="text-primary hover:underline">Back to Blog</Link>
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

      <main className="max-w-3xl mx-auto px-6 py-12">
        <Link to={`/${orgSlug}/blog`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="size-4" /> Back to all stories
        </Link>

        <article className="prose prose-slate prose-lg max-w-none">
          <div className="mb-8">
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <time>{new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
              {blog.focus_keyword && (
                <>
                  <span>&middot;</span>
                  <span className="uppercase tracking-wider">{blog.focus_keyword}</span>
                </>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-display leading-tight mb-6">{blog.title}</h1>
            
            <div className="flex items-center gap-3 not-prose border-t border-border pt-6 mt-6">
              {blog.author?.avatar_url ? (
                <img src={blog.author.avatar_url} className="size-10 rounded-full object-cover" />
              ) : (
                <div className="size-10 rounded-full bg-secondary grid place-items-center text-sm font-medium">
                  {blog.author?.full_name?.substring(0, 2).toUpperCase() || 'CT'}
                </div>
              )}
              <div>
                <div className="text-sm font-medium">{blog.author?.full_name || 'ImpactLens User'}</div>
                <div className="text-xs text-muted-foreground">Author</div>
              </div>
            </div>
          </div>

          {blog.submission?.photo_url && (
            <figure className="mb-10">
              <img 
                src={blog.submission.photo_url} 
                alt={blog.title} 
                className="w-full aspect-[21/9] object-cover rounded-xl shadow-sm"
              />
            </figure>
          )}

          <div 
            dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br/>') }} 
            className="leading-relaxed"
          />
        </article>

        <div className="mt-16 pt-8 border-t border-border text-center">
          <h3 className="text-2xl font-display mb-3">Support Our Mission</h3>
          <p className="text-muted-foreground mb-6">If this story moved you, consider supporting {organization.name}.</p>
          <button className="h-12 px-8 rounded-lg bg-primary text-primary-foreground font-medium items-center gap-2 inline-flex hover:opacity-90 transition-opacity">
            <Heart className="size-4" /> Make a Donation
          </button>
        </div>
      </main>
    </div>
  );
}
