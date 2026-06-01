import { redirect } from '@tanstack/react-router';
import { supabase } from './supabase';
import type { UserRole } from './database.types';

/**
 * Route guard: require authenticated user. Use in route beforeLoad.
 */
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : undefined;
    throw redirect({ to: '/login', search: { redirect: currentPath } });
  }
  return session;
}

/**
 * Route guard: require specific role(s). Use in route beforeLoad.
 */
export async function requireRole(...roles: UserRole[]) {
  const session = await requireAuth();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || !roles.includes(profile.role as UserRole)) {
    throw redirect({ to: '/app/dashboard' });
  }
  return profile;
}

/**
 * Route guard: require user to belong to an organization.
 */
export async function requireOrg() {
  const session = await requireAuth();
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', session.user.id)
    .single();

  if (!profile?.org_id) {
    throw redirect({ to: '/onboarding' });
  }
  return { orgId: profile.org_id, role: profile.role as UserRole };
}

/**
 * Route guard: require super admin role.
 */
export async function requireSuperAdmin() {
  return requireRole('super_admin');
}

/**
 * Route guard: redirect authenticated users away from auth pages.
 */
export async function redirectIfAuthed() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'super_admin') {
      throw redirect({ to: '/admin' });
    }
    if (profile?.org_id) {
      throw redirect({ to: '/app/dashboard' });
    }
    throw redirect({ to: '/onboarding' });
  }
}
