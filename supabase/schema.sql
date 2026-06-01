-- ═══════════════════════════════════════════════════════════
-- ImpactLens — Complete Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════
-- 1. ORGANIZATIONS (Multi-tenant root)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'ngo' CHECK (type IN ('ngo','real_estate','construction','retail','healthcare','hospitality','other')),
  mission TEXT,
  logo_url TEXT,
  banner_url TEXT,
  website TEXT,
  contact_email TEXT,
  country TEXT DEFAULT 'IN',
  theme_color TEXT DEFAULT '#0D6E55',
  grid_layout TEXT DEFAULT 'masonry' CHECK (grid_layout IN ('masonry','2-col','3-col')),
  custom_domain TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','growth','enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','suspended','trial')),
  features JSONB DEFAULT '{"seo_blog": true, "receipts": true, "whatsapp": true}'::jsonb,
  whatsapp_connected BOOLEAN DEFAULT false,
  whatsapp_phone_number_id TEXT,
  whatsapp_business_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 2. PROFILES (extends auth.users)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('super_admin','director','manager','volunteer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','invited','deactivated')),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 3. CATEGORIES (per-org project types)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0D6E55',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 4. MEDIA SUBMISSIONS (field photos + AI descriptions)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.media_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_path TEXT NOT NULL,  -- storage path for deletion
  ai_description TEXT,
  manual_description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  location_tag TEXT,
  volunteer_notes TEXT,
  director_notes TEXT,       -- rejection reason
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 5. DONORS (CRM contacts)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT,
  country_code TEXT DEFAULT '+91',
  interest_tags TEXT[] DEFAULT '{}',
  donation_tier TEXT DEFAULT 'standard' CHECK (donation_tier IN ('standard','silver','gold','platinum')),
  total_donated NUMERIC(12,2) DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','lapsed','inactive')),
  notes TEXT,
  whatsapp_contact_id TEXT,  -- synced WACRM contact
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 6. DONATIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  campaign TEXT,
  payment_method TEXT DEFAULT 'upi' CHECK (payment_method IN ('cash','upi','bank_transfer','cheque','online')),
  donation_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 7. RECEIPTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  donation_id UUID REFERENCES public.donations(id) ON DELETE SET NULL,
  receipt_number TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  campaign TEXT,
  payment_method TEXT,
  donation_date DATE,
  notes TEXT,
  pdf_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  sent_via TEXT CHECK (sent_via IN ('whatsapp','email','download','print')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 8. BLOG POSTS (AI-generated SEO content)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  body TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  focus_keywords TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','scheduled')),
  is_ai_generated BOOLEAN DEFAULT false,
  views INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, slug)
);

-- ═══════════════════════════════════════════════════════════
-- 9. WHATSAPP BROADCASTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.whatsapp_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES public.profiles(id),
  audience_type TEXT NOT NULL CHECK (audience_type IN ('all','by_tag','by_tier','custom')),
  audience_filter JSONB DEFAULT '{}'::jsonb,
  message_template TEXT NOT NULL,
  attachment_url TEXT,
  recipient_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','failed')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 10. TEAM INVITES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('director','manager','volunteer')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES public.profiles(id),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 11. ACTIVITY LOG
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════

-- Get the current user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Auto-generate org slug from name
CREATE OR REPLACE FUNCTION public.slugify(text TEXT)
RETURNS TEXT AS $$
  SELECT lower(regexp_replace(regexp_replace(trim(text), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
$$ LANGUAGE SQL IMMUTABLE;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'volunteer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update donor total_donated
CREATE OR REPLACE FUNCTION public.update_donor_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.donors
  SET total_donated = (
    SELECT COALESCE(SUM(amount), 0) FROM public.donations WHERE donor_id = NEW.donor_id
  ),
  updated_at = now()
  WHERE id = NEW.donor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER set_updated_at_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_media_submissions BEFORE UPDATE ON public.media_submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_donors BEFORE UPDATE ON public.donors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_blog_posts BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-update donor total on donation insert
CREATE TRIGGER on_donation_inserted
  AFTER INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_donor_total();

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ── Organizations ──
CREATE POLICY "Public can read active orgs by slug" ON public.organizations
  FOR SELECT USING (status = 'active');
CREATE POLICY "Members can update their org" ON public.organizations
  FOR UPDATE USING (id = public.get_user_org_id() AND public.get_user_role() IN ('director','super_admin'));
CREATE POLICY "Directors can insert orgs" ON public.organizations
  FOR INSERT WITH CHECK (true);  -- controlled by app logic during signup

-- ── Profiles ──
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can read org members" ON public.profiles
  FOR SELECT USING (org_id = public.get_user_org_id());
CREATE POLICY "Super admins can read all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role() = 'super_admin');
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Directors can update org members" ON public.profiles
  FOR UPDATE USING (org_id = public.get_user_org_id() AND public.get_user_role() IN ('director','super_admin'));
CREATE POLICY "New users can insert profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ── Categories ──
CREATE POLICY "Members can read categories" ON public.categories
  FOR SELECT USING (org_id = public.get_user_org_id());
CREATE POLICY "Directors can manage categories" ON public.categories
  FOR ALL USING (org_id = public.get_user_org_id() AND public.get_user_role() IN ('director','manager','super_admin'));

-- ── Media Submissions ──
CREATE POLICY "Volunteers see own submissions" ON public.media_submissions
  FOR SELECT USING (uploaded_by = auth.uid());
CREATE POLICY "Managers/Directors see all org submissions" ON public.media_submissions
  FOR SELECT USING (org_id = public.get_user_org_id() AND public.get_user_role() IN ('director','manager','super_admin'));
CREATE POLICY "Public can see approved submissions" ON public.media_submissions
  FOR SELECT USING (is_approved = true);
CREATE POLICY "Authenticated users can upload" ON public.media_submissions
  FOR INSERT WITH CHECK (org_id = public.get_user_org_id() AND uploaded_by = auth.uid());
CREATE POLICY "Directors can update submissions" ON public.media_submissions
  FOR UPDATE USING (org_id = public.get_user_org_id() AND public.get_user_role() IN ('director','manager','super_admin'));

-- ── Donors ──
CREATE POLICY "Members can read donors" ON public.donors
  FOR SELECT USING (org_id = public.get_user_org_id() AND public.get_user_role() IN ('director','manager','super_admin'));
CREATE POLICY "Directors can manage donors" ON public.donors
  FOR ALL USING (org_id = public.get_user_org_id() AND public.get_user_role() IN ('director','manager','super_admin'));

-- ── Donations ──
CREATE POLICY "Members can read donations" ON public.donations
  FOR SELECT USING (org_id = public.get_user_org_id());
CREATE POLICY "Directors can manage donations" ON public.donations
  FOR ALL USING (org_id = public.get_user_org_id() AND public.get_user_role() IN ('director','manager','super_admin'));

-- ── Receipts ──
CREATE POLICY "Members can read receipts" ON public.receipts
  FOR SELECT USING (org_id = public.get_user_org_id());
CREATE POLICY "Directors can manage receipts" ON public.receipts
  FOR ALL USING (org_id = public.get_user_org_id() AND public.get_user_role() IN ('director','manager','super_admin'));

-- ── Blog Posts ──
CREATE POLICY "Public can read published posts" ON public.blog_posts
  FOR SELECT USING (status = 'published');
CREATE POLICY "Members can read all org posts" ON public.blog_posts
  FOR SELECT USING (org_id = public.get_user_org_id());
CREATE POLICY "Directors can manage posts" ON public.blog_posts
  FOR ALL USING (org_id = public.get_user_org_id() AND public.get_user_role() IN ('director','manager','super_admin'));

-- ── Broadcasts ──
CREATE POLICY "Members can read broadcasts" ON public.whatsapp_broadcasts
  FOR SELECT USING (org_id = public.get_user_org_id());
CREATE POLICY "Directors can manage broadcasts" ON public.whatsapp_broadcasts
  FOR ALL USING (org_id = public.get_user_org_id() AND public.get_user_role() IN ('director','manager','super_admin'));

-- ── Team Invites ──
CREATE POLICY "Directors can manage invites" ON public.team_invites
  FOR ALL USING (org_id = public.get_user_org_id() AND public.get_user_role() IN ('director','super_admin'));
CREATE POLICY "Anyone can read invite by token" ON public.team_invites
  FOR SELECT USING (true);  -- token checked in app logic

-- ── Activity Log ──
CREATE POLICY "Members can read org activity" ON public.activity_log
  FOR SELECT USING (org_id = public.get_user_org_id());
CREATE POLICY "System can insert activity" ON public.activity_log
  FOR INSERT WITH CHECK (org_id = public.get_user_org_id());
CREATE POLICY "Super admins can read all activity" ON public.activity_log
  FOR SELECT USING (public.get_user_role() = 'super_admin');

-- ═══════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('org-assets', 'org-assets', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload org assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'org-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view org assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'org-assets');
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view receipts" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════
CREATE INDEX idx_profiles_org ON public.profiles(org_id);
CREATE INDEX idx_media_org_status ON public.media_submissions(org_id, status);
CREATE INDEX idx_media_approved ON public.media_submissions(org_id, is_approved) WHERE is_approved = true;
CREATE INDEX idx_donors_org ON public.donors(org_id);
CREATE INDEX idx_donations_org ON public.donations(org_id);
CREATE INDEX idx_donations_donor ON public.donations(donor_id);
CREATE INDEX idx_receipts_org ON public.receipts(org_id);
CREATE INDEX idx_blog_posts_org_status ON public.blog_posts(org_id, status);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(org_id, slug);
CREATE INDEX idx_activity_org ON public.activity_log(org_id, created_at DESC);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_team_invites_token ON public.team_invites(token);

-- ═══════════════════════════════════════════════════════════
-- SEED DATA: Default categories for NGO type
-- ═══════════════════════════════════════════════════════════
-- These are inserted per-org during onboarding.
-- Example categories stored here for reference:
-- Education, Food Distribution, Healthcare, Environment, 
-- Women Empowerment, Child Welfare, Disaster Relief, Other
