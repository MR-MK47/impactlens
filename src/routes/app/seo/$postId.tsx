import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Save, Globe, Image as ImageIcon, Sparkles, Clock, Calendar } from "lucide-react";

export const Route = createFileRoute("/app/seo/$postId")({ component: BlogPostEditor });

function BlogPostEditor() {
  const { postId } = Route.useParams();

  return (
    <AppShell title="Edit Blog Post">
      <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-6 shrink-0">
          <Link to="/app/seo" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" /> Back to SEO Manager
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 mr-2">
              <Clock className="size-3.5" /> Saved 2m ago
            </span>
            <button className="h-10 px-4 rounded-lg border border-border bg-surface font-medium text-sm flex items-center gap-2 hover:bg-secondary transition-colors">
              <Save className="size-4" /> Save Draft
            </button>
            <button className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Globe className="size-4" /> Publish Now
            </button>
          </div>
        </div>

        <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-8 min-h-0">
          {/* Main Editor Area */}
          <div className="card-soft overflow-hidden flex flex-col bg-surface">
            {/* Title Input */}
            <div className="p-8 pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-xs font-medium text-accent-foreground bg-accent/10 px-2.5 py-1 rounded-full w-fit mb-4">
                <Sparkles className="size-3" /> Drafted by ImpactLens AI
              </div>
              <input 
                type="text" 
                className="w-full text-4xl font-display font-bold bg-transparent outline-none placeholder:text-muted-foreground/50" 
                defaultValue="5 Lessons from Our Wardha Vision Camp"
                placeholder="Post Title..."
              />
            </div>
            
            {/* Rich Text Area */}
            <div className="flex-1 overflow-y-auto p-8 pt-6 prose prose-stone max-w-none prose-headings:font-display prose-p:text-lg prose-p:leading-relaxed outline-none" contentEditable suppressContentEditableWarning>
              <p>
                What we learned after screening 156 villagers and distributing reading glasses in the heart of Maharashtra. The numbers tell one story, but the faces tell another.
              </p>
              <p>
                When our volunteer team arrived in Wardha last week, the line was already forming. For many in this rural community, access to basic optometry is limited by distance and cost. Our goal was simple: screen as many individuals as possible and provide reading glasses on the spot for those suffering from age-related presbyopia.
              </p>
              <h3>1. Immediate impact is visible</h3>
              <p>
                There is a specific moment when someone puts on reading glasses for the first time in years. They look down at their hands, they look at a piece of text, and their posture completely changes. We captured several of these moments.
              </p>
              <p>
                Out of the 156 villagers tested, 47 received reading glasses directly from our inventory. Another 12 individuals presented with advanced cataracts and were referred to our partner hospital in Nagpur for subsidized surgery.
              </p>
            </div>
          </div>

          {/* Right Sidebar: SEO & Metadata */}
          <aside className="space-y-6 overflow-y-auto pr-2 pb-6">
            {/* Featured Image */}
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Featured Image</label>
              <div className="aspect-video rounded-xl border-2 border-dashed border-border bg-surface flex flex-col items-center justify-center text-muted-foreground hover:bg-secondary transition-colors cursor-pointer group overflow-hidden">
                <img src="https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&q=80&w=400" alt="Featured" className="w-full h-full object-cover" />
                {/* <ImageIcon className="size-6 mb-2 group-hover:scale-110 transition-transform" /> */}
                {/* <span className="text-sm font-medium">Select Image</span> */}
              </div>
            </div>

            {/* Post Settings */}
            <div className="space-y-4">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground block border-b border-border pb-2">Post Settings</label>
              
              <div>
                <label className="text-xs font-medium mb-1.5 block">Category</label>
                <select className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-sm">
                  <option>Healthcare</option>
                  <option>Education</option>
                  <option>Food</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Post Slug</label>
                <input type="text" className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-sm" defaultValue="wardha-vision-camp-lessons" />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Publish Date</label>
                <div className="relative">
                  <Calendar className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="date" className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-sm" defaultValue="2026-06-01" />
                </div>
              </div>
            </div>

            {/* SEO Metadata */}
            <div className="space-y-4">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground block border-b border-border pb-2">SEO Metadata</label>
              
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium">Meta Title</label>
                  <span className="text-[10px] text-muted-foreground">37 / 60</span>
                </div>
                <input type="text" className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-sm" defaultValue="5 Lessons from Our Wardha Vision Camp" />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium">Meta Description</label>
                  <span className="text-[10px] text-muted-foreground">148 / 160</span>
                </div>
                <textarea rows={4} className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-sm resize-none" defaultValue="What we learned after screening 156 villagers and distributing reading glasses in the heart of Maharashtra. The numbers tell one story, the faces another." />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Focus Keywords</label>
                <div className="p-2 rounded-lg border border-border bg-surface min-h-10 flex flex-wrap gap-1.5 focus-within:ring-1 focus-within:ring-primary">
                  <span className="text-xs bg-secondary text-foreground px-2 py-1 rounded flex items-center gap-1">wardha vision camp <button className="hover:text-red-500">&times;</button></span>
                  <span className="text-xs bg-secondary text-foreground px-2 py-1 rounded flex items-center gap-1">free reading glasses <button className="hover:text-red-500">&times;</button></span>
                  <input type="text" className="flex-1 min-w-[60px] bg-transparent outline-none text-sm px-1" placeholder="Add..." />
                </div>
              </div>
            </div>
            
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
