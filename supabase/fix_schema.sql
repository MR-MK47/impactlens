-- Fix schema discrepancies

-- 1. Rename blog_posts to seo_blogs if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_posts') THEN
    ALTER TABLE public.blog_posts RENAME TO seo_blogs;
  END IF;
END $$;

-- 2. Add missing columns to seo_blogs
ALTER TABLE public.seo_blogs 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES public.media_submissions(id) ON DELETE SET NULL;

-- 3. Add missing columns to whatsapp_broadcasts
ALTER TABLE public.whatsapp_broadcasts
  ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES public.media_submissions(id) ON DELETE SET NULL;

-- 4. Update RLS policies for seo_blogs
-- Drop old blog_posts policies if they came over in rename
DROP POLICY IF EXISTS "Public can read published posts" ON public.seo_blogs;
DROP POLICY IF EXISTS "Members can read all org posts" ON public.seo_blogs;
DROP POLICY IF EXISTS "Directors can manage posts" ON public.seo_blogs;

-- Create new policies
CREATE POLICY "Public can read published posts" ON public.seo_blogs
  FOR SELECT USING (status = 'published');
CREATE POLICY "Members can read all org posts" ON public.seo_blogs
  FOR SELECT USING (org_id = public.get_user_org_id());
CREATE POLICY "Directors can manage posts" ON public.seo_blogs
  FOR ALL USING (org_id = public.get_user_org_id() AND public.get_user_role() IN ('director','manager','super_admin'));
