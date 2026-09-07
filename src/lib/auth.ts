import { User } from '@supabase/supabase-js';
import { AuthUser, UserRole } from '@/types';
import { supabase } from './supabase';

export function mapSupabaseUser(user: User, profile?: { role?: string; full_name?: string; avatar_url?: string; username?: string }): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username: profile?.username || user.user_metadata?.username || user.user_metadata?.full_name || user.email!.split('@')[0],
    fullName: profile?.full_name || user.user_metadata?.full_name,
    role: (profile?.role as UserRole) || 'user',
    avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url,
  };
}

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return data;
}

export async function sendOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyOtpAndSetPassword(
  email: string,
  token: string,
  password: string,
  fullName?: string
) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) throw error;

  const { data: updateData, error: updateError } = await supabase.auth.updateUser({
    password,
    data: {
      username: email.split('@')[0],
      full_name: fullName || email.split('@')[0],
    },
  });
  if (updateError) throw updateError;
  return updateData.user;
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function logAuditAction(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}
