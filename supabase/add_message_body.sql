-- Add message_body to whatsapp_broadcasts to store custom message content
ALTER TABLE public.whatsapp_broadcasts 
  ADD COLUMN IF NOT EXISTS message_body TEXT;
