import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Clock, XCircle, Search, Filter, Camera } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import type { MediaSubmission } from "../../lib/database.types";

export const Route = createFileRoute("/app/submissions")({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<MediaSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    async function loadMySubmissions() {
      if (!user) return;

      let query = supabase
        .from('media_submissions')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      if (data) setSubmissions(data as any[]);
      setLoading(false);
    }

    loadMySubmissions();
  }, [user, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'approved') return <CheckCircle2 className="size-4 text-emerald-500" />;
    if (status === 'rejected') return <XCircle className="size-4 text-red-500" />;
    return <Clock className="size-4 text-amber-500" />;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'approved') {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium"><CheckCircle2 className="size-3.5" /> Approved</span>;
    }
    if (status === 'rejected') {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-medium"><XCircle className="size-3.5" /> Rejected</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium"><Clock className="size-3.5" /> Pending Review</span>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display mb-1">My Submissions</h2>
          <p className="text-sm text-muted-foreground">
            Track the status of your uploaded field photos.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search descriptions..."
              className="w-64 h-9 pl-9 pr-4 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="card-soft p-12 text-center">
          <div className="size-16 rounded-full bg-secondary grid place-items-center mx-auto mb-4">
            <Camera className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No submissions yet</h3>
          <p className="text-muted-foreground text-sm mb-6">You haven't uploaded any field photos matching this filter.</p>
          <a href="/app/upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
            Upload a Photo
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {submissions.map((sub) => (
            <div key={sub.id} className="card-soft overflow-hidden group flex flex-col">
              <div className="relative aspect-video overflow-hidden bg-secondary">
                <img 
                  src={sub.photo_url} 
                  alt="Submission" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={sub.status} />
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                  <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                  {sub.location_tag && <span className="px-2 py-1 bg-secondary rounded uppercase tracking-wider text-[10px]">{sub.location_tag}</span>}
                </div>
                
                <p className="text-sm leading-relaxed mb-4 flex-1">
                  {sub.status === 'approved' && sub.manual_description 
                    ? sub.manual_description 
                    : sub.ai_description || 'No description provided.'}
                </p>

                {sub.status === 'rejected' && sub.director_notes && (
                  <div className="mt-auto p-3 rounded bg-red-500/5 border border-red-500/10 text-xs">
                    <span className="font-semibold text-red-600 block mb-1">Director's Note:</span>
                    <span className="text-red-600/80">{sub.director_notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
