import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Camera, Upload as UploadIcon, X, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { fileToBase64, analyzeFieldPhoto } from "../../lib/gemini";

export const Route = createFileRoute("/app/upload")({
  component: UploadPage,
});

function UploadPage() {
  const { user, profile, organization } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("General Impact");
  const [notes, setNotes] = useState("");
  
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);

      // Auto-generate AI description
      setAiGenerating(true);
      try {
        const { base64, mimeType } = await fileToBase64(selectedFile);
        const description = await analyzeFieldPhoto(base64, mimeType, category, organization?.type);
        setAiDescription(description);
      } catch (err) {
        console.error("AI Generation failed:", err);
        setAiDescription("Unable to generate description. Please write manually.");
      } finally {
        setAiGenerating(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user || !organization) return;

    setSubmitting(true);
    try {
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      // 2. Save to database
      const { error: dbError } = await supabase
        .from('media_submissions')
        .insert({
          org_id: organization.id,
          uploaded_by: user.id,
          photo_url: publicUrl,
          photo_path: fileName,
          ai_description: aiDescription,
          manual_description: null, // Director can edit later
          location_tag: location,
          volunteer_notes: notes,
          status: 'pending',
          is_approved: false
        });

      if (dbError) throw dbError;

      // Log activity
      await supabase.from('activity_log').insert({
        org_id: organization.id,
        user_id: user.id,
        action: 'Uploaded new field photo',
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to upload photo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto pt-10">
        <div className="card-soft p-12 text-center">
          <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-500 grid place-items-center mx-auto mb-6">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-2xl font-display mb-2">Upload Successful!</h2>
          <p className="text-muted-foreground mb-8">
            Your field photo has been submitted for approval. Once approved, it will appear on the public Trustfeed.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
                setAiDescription("");
                setNotes("");
                setLocation("");
                setSuccess(false);
              }}
              className="px-6 py-2.5 rounded-lg border border-border font-medium hover:bg-secondary transition-colors"
            >
              Upload Another
            </button>
            <button
              onClick={() => navigate({ to: "/app/submissions" })}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              View My Submissions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-display mb-2">Submit Field Photo</h2>
        <p className="text-muted-foreground">Capture your impact. Our AI will help describe it.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[4/5] rounded-xl border-2 border-dashed border-border bg-surface/50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-secondary hover:border-primary/50 transition-colors"
            >
              <div className="size-14 rounded-full bg-primary/10 text-primary grid place-items-center">
                <Camera className="size-6" />
              </div>
              <div className="text-center">
                <div className="font-medium">Click to upload photo</div>
                <div className="text-sm text-muted-foreground mt-1">JPG, PNG up to 10MB</div>
              </div>
            </div>
          ) : (
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden group">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setAiDescription("");
                  }}
                  className="px-4 py-2 rounded-lg bg-background text-foreground font-medium text-sm flex items-center gap-2"
                >
                  <X className="size-4" /> Remove Photo
                </button>
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div>
          <form onSubmit={handleSubmit} className="card-soft p-6 space-y-6 sticky top-24">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option>General Impact</option>
                <option>Education</option>
                <option>Healthcare</option>
                <option>Food Distribution</option>
                <option>Environment</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">AI Description</label>
                {aiGenerating && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" /> Analyzing image...
                  </span>
                )}
              </div>
              <div className="relative">
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder={aiGenerating ? "AI is looking at your photo..." : "Description of the impact..."}
                  className="w-full h-28 p-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  readOnly={aiGenerating}
                />
                <div className="absolute top-3 right-3 size-6 rounded bg-primary/10 text-primary grid place-items-center">
                  <Sparkles className="size-3.5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                You can edit this description, or let the director refine it during approval.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Location (Optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai South Campus"
                  className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Internal Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes for the director?"
                className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={!file || submitting || aiGenerating}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="size-4 animate-spin" /> Submitting...</>
              ) : (
                <><UploadIcon className="size-4" /> Submit for Approval</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
