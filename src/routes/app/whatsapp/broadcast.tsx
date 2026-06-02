import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Send, Users, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth";
import { sendWhatsAppTemplate, isWhatsAppConfigured } from "../../../lib/wacrm";
import type { Donor, MediaSubmission } from "../../../lib/database.types";

export const Route = createFileRoute("/app/whatsapp/broadcast")({
  component: BroadcastPage,
});

function BroadcastPage() {
  const { organization, user } = useAuth();
  const navigate = useNavigate();
  
  const [donors, setDonors] = useState<Donor[]>([]);
  const [submissions, setSubmissions] = useState<MediaSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDonors, setSelectedDonors] = useState<Set<string>>(new Set());
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!organization) return;

      // Only get donors with phone numbers
      const { data: dData } = await supabase
        .from('donors')
        .select('*')
        .eq('org_id', organization.id)
        .not('phone', 'is', null);

      if (dData) setDonors(dData as Donor[]);

      // Get approved submissions
      const { data: sData } = await supabase
        .from('media_submissions')
        .select('*')
        .eq('org_id', organization.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);

      if (sData) setSubmissions(sData as MediaSubmission[]);
      
      setLoading(false);
    }
    loadData();
  }, [organization]);

  const toggleDonor = (id: string) => {
    const next = new Set(selectedDonors);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDonors(next);
  };

  const selectAll = () => {
    setSelectedDonors(new Set(donors.map(d => d.id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !user) return;
    
    // Ensure API is configured
    if (!isWhatsAppConfigured()) {
      alert("WhatsApp API is not configured in your environment variables (.env).");
      return;
    }

    setSending(true);
    
    try {
      const selectedSub = submissions.find(s => s.id === selectedSubmissionId);
      const imageUrl = selectedSub?.photo_url;
      const messageBody = customMessage || selectedSub?.manual_description || selectedSub?.ai_description;

      const targetDonors = donors.filter(d => selectedDonors.has(d.id));

      // Send to all selected donors
      const promises = targetDonors.map(donor => 
        sendWhatsAppTemplate({
          to: donor.phone!,
          templateName: 'impact_update', // You would create this template in Meta Business Manager
          mediaUrl: imageUrl,
          variables: {
            donor_name: donor.full_name.split(' ')[0],
            update_text: messageBody || '',
            org_name: organization.name
          }
        })
      );

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      // Log broadcast to DB
      await supabase.from('whatsapp_broadcasts').insert({
        org_id: organization.id,
        sent_by: user.id,
        submission_id: selectedSubmissionId || null,
        audience_type: 'all',
        message_template: 'impact_update',
        message_body: messageBody,
        recipient_count: targetDonors.length,
        status: successCount > 0 ? 'sent' : 'failed',
      });

      // Log activity
      await supabase.from('activity_log').insert({
        org_id: organization.id,
        user_id: user.id,
        action: `Sent WhatsApp broadcast to ${targetDonors.length} donors`,
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to send broadcast.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto pt-10">
        <div className="card-soft p-12 text-center">
          <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-500 grid place-items-center mx-auto mb-6">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-2xl font-display mb-2">Broadcast Sent!</h2>
          <p className="text-muted-foreground mb-8">
            Your impact update has been sent to {selectedDonors.size} donors via WhatsApp.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate({ to: "/app/whatsapp" })}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Back to Broadcasts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate({ to: "/app/whatsapp" })}
          className="size-10 rounded-full border border-border grid place-items-center hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h2 className="text-2xl font-display mb-1">New Broadcast</h2>
          <p className="text-sm text-muted-foreground">Send a WhatsApp message with an approved field photo.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form id="broadcast-form" onSubmit={handleSubmit} className="card-soft p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-border pb-2 flex items-center gap-2">
                <ImageIcon className="size-5 text-primary" />
                Select Media Attachment
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {submissions.length === 0 ? (
                  <div className="sm:col-span-2 p-4 border border-border rounded-lg text-sm text-muted-foreground text-center bg-secondary/50">
                    No approved photos available.
                  </div>
                ) : (
                  submissions.map(sub => (
                    <label 
                      key={sub.id}
                      className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                        selectedSubmissionId === sub.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="submission" 
                        className="sr-only"
                        checked={selectedSubmissionId === sub.id}
                        onChange={() => {
                          setSelectedSubmissionId(sub.id);
                          setCustomMessage(sub.manual_description || sub.ai_description || "");
                        }}
                      />
                      <div className="aspect-video relative">
                        <img src={sub.photo_url} className="w-full h-full object-cover" alt="Submission" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {selectedSubmissionId === sub.id && (
                          <div className="absolute top-2 right-2 size-6 rounded-full bg-primary text-primary-foreground grid place-items-center">
                            <CheckCircle2 className="size-4" />
                          </div>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-border pb-2">Message Content</h3>
              
              <div>
                <label className="text-sm font-medium mb-1.5 block">Custom Message</label>
                <textarea
                  required
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  className="w-full h-32 p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm leading-relaxed"
                  placeholder="Select a photo above to use its description, or write a custom update here..."
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  This text will be inserted into your WhatsApp Template. Make sure your WhatsApp Business Account has an approved template named <code>impact_update</code>.
                </p>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card-soft flex flex-col h-[500px]">
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface/50">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="size-4" /> Recipients
              </h3>
              <div className="text-sm font-medium text-primary">
                {selectedDonors.size} selected
              </div>
            </div>
            
            <div className="p-2 border-b border-border">
              <button 
                type="button"
                onClick={selectAll}
                className="w-full h-8 rounded bg-secondary text-secondary-foreground text-xs font-medium hover:opacity-80"
              >
                Select All ({donors.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {donors.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No donors with phone numbers found.
                </div>
              ) : (
                donors.map(donor => (
                  <label 
                    key={donor.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-secondary cursor-pointer"
                  >
                    <input 
                      type="checkbox"
                      checked={selectedDonors.has(donor.id)}
                      onChange={() => toggleDonor(donor.id)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{donor.full_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{donor.phone}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            form="broadcast-form"
            type="submit"
            disabled={sending || selectedDonors.size === 0 || !customMessage}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
            {sending ? "Sending..." : `Send to ${selectedDonors.size} Donors`}
          </button>
        </div>
      </div>
    </div>
  );
}
