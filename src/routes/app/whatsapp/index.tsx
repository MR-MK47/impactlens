import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MessageSquare, Plus, Users, Loader2, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

export const Route = createFileRoute("/app/whatsapp/")({
  component: WhatsappIndex,
});

function WhatsappIndex() {
  const { organization } = useAuth();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBroadcasts() {
      if (!organization) return;

      const { data } = await supabase
        .from('whatsapp_broadcasts')
        .select(`
          *,
          sender:profiles!whatsapp_broadcasts_sent_by_fkey(full_name),
          submission:media_submissions(photo_url, location_tag)
        `)
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false });

      if (data) setBroadcasts(data);
      setLoading(false);
    }
    loadBroadcasts();
  }, [organization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const isConfigured = organization?.wa_phone_number_id && organization?.wa_access_token;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display mb-1">WhatsApp Broadcasts</h2>
          <p className="text-sm text-muted-foreground">
            Send direct impact updates to your donors via WhatsApp.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <Link to="/app/whatsapp/broadcast" className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90">
              <Plus className="size-4" /> New Broadcast
            </Link>
          ) : (
            <Link to="/app/settings" className="h-9 px-4 rounded-lg border border-border bg-background text-sm font-medium flex items-center gap-2 hover:bg-secondary text-amber-600">
              Configure WhatsApp API First
            </Link>
          )}
        </div>
      </div>

      {!isConfigured && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-700 flex items-start gap-3">
          <MessageSquare className="size-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">WhatsApp Not Configured</h3>
            <p className="text-sm mt-1 mb-3 opacity-90">
              To send broadcasts, you need to configure your Meta WhatsApp Cloud API credentials in the organization settings.
            </p>
            <Link to="/app/settings" className="text-sm font-medium underline">
              Go to Settings &rarr;
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {broadcasts.length === 0 ? (
          <div className="col-span-full card-soft p-12 text-center">
            <div className="size-16 rounded-full bg-secondary grid place-items-center mx-auto mb-4">
              <MessageSquare className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No broadcasts sent</h3>
            <p className="text-muted-foreground text-sm mb-6">Send your first WhatsApp update to donors with a field photo.</p>
            {isConfigured && (
              <Link to="/app/whatsapp/broadcast" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
                Create Broadcast
              </Link>
            )}
          </div>
        ) : (
          broadcasts.map((broadcast) => (
            <div key={broadcast.id} className="card-soft overflow-hidden flex flex-col">
              {broadcast.submission?.photo_url && (
                <div className="relative h-40 bg-secondary">
                  <img 
                    src={broadcast.submission.photo_url} 
                    className="w-full h-full object-cover opacity-80"
                    alt="Broadcast attachment"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="text-sm font-medium line-clamp-1">{broadcast.message_template}</div>
                  </div>
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    broadcast.status === 'sent' ? 'bg-emerald-500/10 text-emerald-600' : 
                    broadcast.status === 'failed' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {broadcast.status === 'sent' ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                    <span className="capitalize">{broadcast.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="size-3" /> {broadcast.recipient_count} recipients
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Message Content</div>
                  <p className="text-sm text-foreground bg-secondary/50 p-3 rounded-lg border border-border/50 line-clamp-3">
                    {broadcast.message_body || "Template message used."}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Sent by {broadcast.sender?.full_name || 'System'}</span>
                  <span>{new Date(broadcast.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
