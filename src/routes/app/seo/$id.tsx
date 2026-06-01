import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Save, Globe, Eye, Code } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth";

export const Route = createFileRoute("/app/seo/$id")({
  component: SeoEditorPage,
});

function SeoEditorPage() {
  const { id } = Route.useParams();
  const { organization } = useAuth();
  const navigate = useNavigate();
  
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  const [formData, setFormData] = useState({
    title: "",
    meta_description: "",
    content: "",
    focus_keyword: "",
    slug: "",
    is_published: false
  });

  useEffect(() => {
    async function loadBlog() {
      if (!organization) return;

      const { data, error } = await supabase
        .from('seo_blogs')
        .select(`
          *,
          submission:media_submissions (photo_url)
        `)
        .eq('id', id)
        .eq('org_id', organization.id)
        .single();

      if (error || !data) {
        navigate({ to: "/app/seo" });
        return;
      }
      
      setBlog(data);
      setFormData({
        title: data.title || "",
        meta_description: data.meta_description || "",
        content: data.content || "",
        focus_keyword: data.focus_keyword || "",
        slug: data.slug || "",
        is_published: data.is_published || false
      });
      setLoading(false);
    }
    loadBlog();
  }, [id, organization]);

  const handleSave = async () => {
    if (!organization) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('seo_blogs')
        .update({
          title: formData.title,
          meta_description: formData.meta_description,
          content: formData.content,
          focus_keyword: formData.focus_keyword,
          slug: formData.slug,
          is_published: formData.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // If toggling publish state
      if (formData.is_published !== blog.is_published) {
        await supabase.from('activity_log').insert({
          org_id: organization.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: `${formData.is_published ? 'Published' : 'Unpublished'} blog post: ${formData.title}`,
        });
      }

      setBlog({ ...blog, ...formData });
      alert("Saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !blog) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate({ to: "/app/seo" })}
            className="size-10 rounded-full border border-border grid place-items-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h2 className="text-2xl font-display mb-1">Edit SEO Post</h2>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span className={`size-2 rounded-full ${formData.is_published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {formData.is_published ? 'Published' : 'Draft'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="rounded text-primary focus:ring-primary"
            />
            Publish to Trustfeed
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-soft overflow-hidden">
            <div className="border-b border-border flex">
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTab === 'edit' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
              >
                <Code className="size-4" /> Edit Markdown
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTab === 'preview' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
              >
                <Eye className="size-4" /> Preview
              </button>
            </div>

            {activeTab === 'edit' ? (
              <div className="p-0">
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full h-[600px] p-6 bg-background text-sm font-mono border-none focus:ring-0 resize-none leading-relaxed"
                  placeholder="# Blog Content..."
                />
              </div>
            ) : (
              <div className="p-8 prose prose-sm max-w-none">
                {blog.submission?.photo_url && (
                  <img src={blog.submission.photo_url} alt="Cover" className="w-full aspect-video object-cover rounded-xl mb-8" />
                )}
                <h1>{formData.title || 'Untitled Post'}</h1>
                <div dangerouslySetInnerHTML={{ __html: formData.content.replace(/\n/g, '<br/>') }} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-soft p-5 space-y-4">
            <h3 className="font-semibold border-b border-border pb-2 flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" /> SEO Metadata
            </h3>
            
            <div>
              <label className="text-xs font-medium mb-1.5 block">Page Title (H1)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">URL Slug</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/blog/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full h-10 pl-12 pr-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">Focus Keyword</label>
              <input
                type="text"
                value={formData.focus_keyword}
                onChange={(e) => setFormData({ ...formData, focus_keyword: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">Meta Description</label>
              <textarea
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                className="w-full h-24 p-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
              <div className="text-[10px] text-right mt-1 text-muted-foreground">
                {formData.meta_description.length} / 160 characters
              </div>
            </div>
          </div>

          <div className="card-soft p-5 bg-secondary/50">
            <h3 className="font-semibold text-sm mb-3">Google Preview</h3>
            <div className="bg-background p-4 rounded-lg border border-border">
              <div className="text-[11px] text-muted-foreground mb-1">
                {organization?.slug}.impactlens.org/blog/{formData.slug || 'your-post-url'}
              </div>
              <div className="text-[15px] text-[#1a0dab] font-medium leading-tight mb-1 truncate hover:underline cursor-pointer">
                {formData.title || 'Untitled Post'} - {organization?.name}
              </div>
              <div className="text-[13px] text-[#4d5156] line-clamp-2 leading-snug">
                {formData.meta_description || 'Provide a meta description to see how it looks in search results.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
