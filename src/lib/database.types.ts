// ═══════════════════════════════════════════════════════════
// ImpactLens — Database TypeScript Types
// Manually written to match supabase/schema.sql
// ═══════════════════════════════════════════════════════════

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrgType = 'ngo' | 'real_estate' | 'construction' | 'retail' | 'healthcare' | 'hospitality' | 'other';
export type PlanType = 'free' | 'growth' | 'enterprise';
export type OrgStatus = 'active' | 'suspended' | 'trial';
export type UserRole = 'super_admin' | 'director' | 'manager' | 'volunteer';
export type UserStatus = 'active' | 'invited' | 'deactivated';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type DonorTier = 'standard' | 'silver' | 'gold' | 'platinum';
export type DonorStatus = 'active' | 'lapsed' | 'inactive';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'online';
export type ReceiptStatus = 'pending' | 'sent' | 'failed';
export type PostStatus = 'draft' | 'published' | 'scheduled';
export type BroadcastStatus = 'queued' | 'sending' | 'sent' | 'failed';
export type BroadcastAudience = 'all' | 'by_tag' | 'by_tier' | 'custom';
export type GridLayout = 'masonry' | '2-col' | '3-col';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrgType;
  mission: string | null;
  logo_url: string | null;
  banner_url: string | null;
  website: string | null;
  contact_email: string | null;
  country: string;
  theme_color: string;
  grid_layout: GridLayout;
  custom_domain: string | null;
  plan: PlanType;
  status: OrgStatus;
  features: Json;
  whatsapp_connected: boolean;
  whatsapp_phone_number_id: string | null;
  whatsapp_business_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  org_id: string | null;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  org_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface MediaSubmission {
  id: string;
  org_id: string;
  uploaded_by: string;
  photo_url: string;
  photo_path: string;
  ai_description: string | null;
  manual_description: string | null;
  category_id: string | null;
  location_tag: string | null;
  volunteer_notes: string | null;
  director_notes: string | null;
  status: SubmissionStatus;
  is_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
  uploader?: Profile;
}

export interface Donor {
  id: string;
  org_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  country_code: string;
  interest_tags: string[];
  donation_tier: DonorTier;
  total_donated: number;
  last_contact_at: string | null;
  status: DonorStatus;
  notes: string | null;
  whatsapp_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  org_id: string;
  donor_id: string;
  amount: number;
  campaign: string | null;
  payment_method: PaymentMethod;
  donation_date: string;
  notes: string | null;
  created_at: string;
  // Joined
  donor?: Donor;
}

export interface Receipt {
  id: string;
  org_id: string;
  donor_id: string;
  donation_id: string | null;
  receipt_number: string;
  amount: number;
  campaign: string | null;
  payment_method: string | null;
  donation_date: string | null;
  notes: string | null;
  pdf_url: string | null;
  status: ReceiptStatus;
  sent_via: string | null;
  sent_at: string | null;
  created_at: string;
  // Joined
  donor?: Donor;
}

export interface BlogPost {
  id: string;
  org_id: string;
  created_by: string | null;
  submission_id: string | null;
  title: string;
  slug: string;
  body: string | null;
  excerpt: string | null;
  featured_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  focus_keywords: string[];
  status: PostStatus;
  is_ai_generated: boolean;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppBroadcast {
  id: string;
  org_id: string;
  sent_by: string | null;
  submission_id: string | null;
  audience_type: BroadcastAudience;
  audience_filter: Json;
  message_template: string;
  attachment_url: string | null;
  recipient_count: number;
  delivered_count: number;
  read_count: number;
  status: BroadcastStatus;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface TeamInvite {
  id: string;
  org_id: string;
  email: string;
  role: UserRole;
  token: string;
  invited_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
  // Joined
  organization?: Organization;
}

export interface ActivityLog {
  id: string;
  org_id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Json;
  created_at: string;
  // Joined
  user?: Profile;
}

// Supabase Database type for the client generic
export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization> & Pick<Organization, 'name' | 'slug'>; Update: Partial<Organization> };
      profiles: { Row: Profile; Insert: Partial<Profile> & Pick<Profile, 'id' | 'full_name'>; Update: Partial<Profile> };
      categories: { Row: Category; Insert: Partial<Category> & Pick<Category, 'org_id' | 'name'>; Update: Partial<Category> };
      media_submissions: { Row: MediaSubmission; Insert: Partial<MediaSubmission> & Pick<MediaSubmission, 'org_id' | 'uploaded_by' | 'photo_url' | 'photo_path'>; Update: Partial<MediaSubmission> };
      donors: { Row: Donor; Insert: Partial<Donor> & Pick<Donor, 'org_id' | 'full_name'>; Update: Partial<Donor> };
      donations: { Row: Donation; Insert: Partial<Donation> & Pick<Donation, 'org_id' | 'donor_id' | 'amount'>; Update: Partial<Donation> };
      receipts: { Row: Receipt; Insert: Partial<Receipt> & Pick<Receipt, 'org_id' | 'donor_id' | 'receipt_number' | 'amount'>; Update: Partial<Receipt> };
      seo_blogs: { Row: BlogPost; Insert: Partial<BlogPost> & Pick<BlogPost, 'org_id' | 'title' | 'slug'>; Update: Partial<BlogPost> };
      whatsapp_broadcasts: { Row: WhatsAppBroadcast; Insert: Partial<WhatsAppBroadcast> & Pick<WhatsAppBroadcast, 'org_id' | 'audience_type' | 'message_template'>; Update: Partial<WhatsAppBroadcast> };
      team_invites: { Row: TeamInvite; Insert: Partial<TeamInvite> & Pick<TeamInvite, 'org_id' | 'email'>; Update: Partial<TeamInvite> };
      activity_log: { Row: ActivityLog; Insert: Partial<ActivityLog> & Pick<ActivityLog, 'org_id' | 'action'>; Update: Partial<ActivityLog> };
    };
    Functions: {
      get_user_org_id: { Args: Record<string, never>; Returns: string };
      get_user_role: { Args: Record<string, never>; Returns: string };
      slugify: { Args: { text: string }; Returns: string };
    };
  };
}
