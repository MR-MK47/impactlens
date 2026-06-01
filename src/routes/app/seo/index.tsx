import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Plus, FileText, Globe, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

export const Route = createFileRoute("/app/seo/")({
  component: SeoIndex,
});

function SeoIndex() {
  const { organization } = useAuth();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBlogs() {
      if (!organization) return;

      const { data } = await supabase
        .from('seo_blogs')
        .select(`
          *,
          submission:media_submissions (photo_url)
        `)
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false });

      if (data) setBlogs(data);
      setLoading(false);
    }
    loadBlogs();
  }, [organization]);

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
          <h2 className="text-2xl font-display mb-1">SEO Content</h2>
          <p className="text-sm text-muted-foreground">
            Generate AI-optimized blog posts from your field submissions to rank higher on Google.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link to="/app/media" className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90">
            <Sparkles className="size-4" /> Generate from Media
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.length === 0 ? (
          <div className="col-span-full card-soft p-12 text-center">
            <div className="size-16 rounded-full bg-secondary grid place-items-center mx-auto mb-4">
              <FileText className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No SEO content yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Go to your Media Library to select an approved photo and generate an SEO-optimized blog post.</p>
            <Link to="/app/media" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
              Go to Media Library
            </Link>
          </div>
        ) : (
          blogs.map((blog) => (
            <div key={blog.id} className="card-soft overflow-hidden group flex flex-col">
              {blog.submission?.photo_url && (
                <div className="relative h-48 overflow-hidden bg-secondary">
                  <img 
                    src={blog.submission.photo_url} 
                    alt={blog.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {blog.is_published && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium shadow-sm">
                        <CheckCircle2 className="size-3.5" /> Published
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-secondary rounded text-xs font-medium text-muted-foreground">
                    {blog.focus_keyword || 'No keyword'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(blog.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="font-semibold text-lg leading-tight mb-2 line-clamp-2">
                  {blog.title}
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">
                  {blog.meta_description}
                </p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs font-medium text-primary flex items-center gap-1">
                    <Search className="size-3" /> SEO Optimized
                  </span>
                  <Link 
                    to={`/app/seo/${blog.id}`}
                    className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                  >
                    Edit Post
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
