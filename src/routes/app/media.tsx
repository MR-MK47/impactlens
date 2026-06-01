import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Image as ImageIcon, Search, Download, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { generateBlogFromPhoto } from "../../lib/gemini";
import type { MediaSubmission } from "../../lib/database.types";

export const Route = createFileRoute("/app/media")({
  component: MediaLibraryPage,
});

function MediaLibraryPage() {
  const { organization, profile } = useAuth();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [generatingForId, setGeneratingForId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMedia() {
      if (!organization) return;

      const { data } = await supabase
        .from('media_submissions')
        .select('*')
        .eq('org_id', organization.id)
        .eq('status', 'approved') // Only show approved media in library
        .order('created_at', { ascending: false });

      if (data) setMedia(data as MediaSubmission[]);
      setLoading(false);
    }
    loadMedia();
  }, [organization]);

  const handleGenerateSeo = async (submission: MediaSubmission) => {
    if (!organization || !profile) return;
    setGeneratingForId(submission.id);

    try {
      const description = submission.manual_description || submission.ai_description || "";
      const seoContent = await generateBlogFromPhoto(submission.photo_url, description, organization.type);

      // Save to database
      const { data, error } = await supabase
        .from('seo_blogs')
        .insert({
          org_id: organization.id,
          submission_id: submission.id,
          created_by: profile.id,
          title: seoContent.title,
          slug: seoContent.slug,
          meta_description: seoContent.metaDescription,
          focus_keyword: seoContent.focusKeyword,
          content: seoContent.markdownContent,
          is_published: false
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to editor
      navigate({ to: `/app/seo/${data.id}` });
    } catch (err) {
      console.error(err);
      alert("Failed to generate SEO content.");
      setGeneratingForId(null);
    }
  };

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
          <h2 className="text-2xl font-display mb-1">Media Library</h2>
          <p className="text-sm text-muted-foreground">
            All approved field photos ready for broadcasts, social media, or SEO blogs.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search descriptions or tags..."
              className="w-64 h-9 pl-9 pr-4 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {media.length === 0 ? (
          <div className="col-span-full card-soft p-12 text-center">
            <div className="size-16 rounded-full bg-secondary grid place-items-center mx-auto mb-4">
              <ImageIcon className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Library is empty</h3>
            <p className="text-muted-foreground text-sm mb-6">Photos will appear here once a manager approves them.</p>
          </div>
        ) : (
          media.map((item) => (
            <div key={item.id} className="card-soft overflow-hidden group flex flex-col">
              <div className="relative aspect-square bg-secondary">
                <img 
                  src={item.photo_url} 
                  alt="Field media" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a 
                    href={item.photo_url}
                    download
                    target="_blank"
                    className="size-8 rounded-full bg-background/90 text-foreground grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    title="Download"
                  >
                    <Download className="size-4" />
                  </a>
                  <button 
                    onClick={() => handleGenerateSeo(item)}
                    disabled={generatingForId !== null}
                    className="size-8 rounded-full bg-background/90 text-foreground grid place-items-center hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                    title="Generate SEO Blog"
                  >
                    {generatingForId === item.id ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  </button>
                </div>
              </div>
              
              <div className="p-3">
                <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                  {item.manual_description || item.ai_description}
                </p>
                {item.location_tag && (
                  <div className="mt-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {item.location_tag}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
