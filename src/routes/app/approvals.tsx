import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Check, X, Loader2, Sparkles, MessageSquare, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import type { MediaSubmission } from "../../lib/database.types";

export const Route = createFileRoute("/app/approvals")({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { organization, profile, user } = useAuth();
  const [submissions, setSubmissions] = useState<MediaSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubmissions() {
      if (!organization) return;

      const { data } = await supabase
        .from('media_submissions')
        .select(`
          *,
          uploader:profiles!media_submissions_uploaded_by_fkey(full_name, avatar_url)
        `)
        .eq('org_id', organization.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (data) setSubmissions(data as any[]);
      setLoading(false);
    }
    loadSubmissions();
  }, [organization]);

  const handleApprove = async (submission: MediaSubmission, editedDescription: string) => {
    if (!user || !organization) return;
    setProcessingId(submission.id);

    try {
      // Update submission status
      const finalDesc = editedDescription || submission.ai_description;
      const { error } = await supabase
        .from('media_submissions')
        .update({
          status: 'approved',
          is_approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          manual_description: finalDesc !== submission.ai_description ? finalDesc : null,
        })
        .eq('id', submission.id);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_log').insert({
        org_id: organization.id,
        user_id: user.id,
        action: 'Approved media submission',
      });

      // Remove from UI
      setSubmissions(s => s.filter(sub => sub.id !== submission.id));
    } catch (err) {
      console.error("Failed to approve:", err);
      alert("Failed to approve submission.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('media_submissions')
        .update({
          status: 'rejected',
          is_approved: false,
          director_notes: reason
        })
        .eq('id', id);

      if (error) throw error;
      setSubmissions(s => s.filter(sub => sub.id !== id));
    } catch (err) {
      console.error("Failed to reject:", err);
      alert("Failed to reject submission.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only directors/managers can see this page. (Handled by route guards in a real app,
  // but we also check here just in case).
  if (profile?.role === 'volunteer') {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-display mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Only managers and directors can approve submissions.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display mb-1">Approval Queue</h2>
          <p className="text-sm text-muted-foreground">
            Review field photos before they appear on your public Trustfeed.
          </p>
        </div>
        <div className="h-8 px-3 rounded-full bg-secondary text-secondary-foreground text-sm font-medium flex items-center">
          {submissions.length} pending
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="card-soft p-12 text-center">
          <div className="size-16 rounded-full bg-secondary grid place-items-center mx-auto mb-4">
            <CheckCircle2 className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">All caught up!</h3>
          <p className="text-muted-foreground text-sm">There are no pending submissions to review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((submission) => (
            <ApprovalCard 
              key={submission.id} 
              submission={submission} 
              onApprove={handleApprove}
              onReject={handleReject}
              isProcessing={processingId === submission.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApprovalCard({ 
  submission, 
  onApprove, 
  onReject, 
  isProcessing 
}: { 
  submission: MediaSubmission; 
  onApprove: (s: MediaSubmission, desc: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  isProcessing: boolean;
}) {
  const [editedDesc, setEditedDesc] = useState(submission.ai_description || "");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const uploader = (submission as any).uploader;
  const date = new Date(submission.created_at).toLocaleString('en-IN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="card-soft overflow-hidden flex flex-col md:flex-row">
      <div className="md:w-64 shrink-0 bg-secondary relative">
        <img src={submission.photo_url} alt="Field submission" className="w-full h-full object-cover aspect-square md:aspect-auto" />
      </div>
      
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {uploader?.avatar_url ? (
              <img src={uploader.avatar_url} className="size-8 rounded-full object-cover" />
            ) : (
              <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-medium">
                {uploader?.full_name?.substring(0, 2).toUpperCase() || 'V'}
              </div>
            )}
            <div>
              <div className="text-sm font-medium">{uploader?.full_name || 'Unknown Volunteer'}</div>
              <div className="text-xs text-muted-foreground">{date}</div>
            </div>
          </div>
          {submission.location_tag && (
            <div className="px-2 py-1 rounded text-[10px] font-medium bg-secondary text-secondary-foreground uppercase tracking-wider">
              {submission.location_tag}
            </div>
          )}
        </div>

        <div className="flex-1 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-medium">AI Description Draft</span>
          </div>
          <textarea
            value={editedDesc}
            onChange={(e) => setEditedDesc(e.target.value)}
            className="w-full h-24 p-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
          {submission.volunteer_notes && (
            <div className="mt-3 p-3 rounded-lg bg-secondary/50 text-sm border border-border/50">
              <span className="font-medium text-xs uppercase text-muted-foreground block mb-1">Volunteer Notes:</span>
              {submission.volunteer_notes}
            </div>
          )}
        </div>

        {showRejectForm ? (
          <div className="flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Reason for rejection (e.g., blurry photo)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border text-sm"
                autoFocus
              />
            </div>
            <button
              onClick={() => onReject(submission.id, rejectReason)}
              disabled={isProcessing || !rejectReason.trim()}
              className="h-10 px-4 rounded-lg bg-red-500 text-white font-medium text-sm hover:bg-red-600 disabled:opacity-50"
            >
              Confirm Reject
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onApprove(submission, editedDesc)}
              disabled={isProcessing}
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Approve & Publish to Trustfeed
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={isProcessing}
              className="h-10 px-4 rounded-lg border border-border text-red-500 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <X className="size-4" /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
