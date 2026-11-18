import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Initiates Google OAuth Sign-In via Supabase Auth
 */
export const signInWithGoogle = async () => {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    });
    if (error) throw error;
    return data;
  }

  // Fallback: Return simulated Google session for frictionless local preview
  return {
    user: {
      id: 'google_user_demo_1',
      email: 'family.member@gmail.com',
      user_metadata: {
        full_name: 'Family Member',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=FamilyMember',
      },
    },
  };
};

export const signOut = async () => {
  if (supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('gharvault_token');
  localStorage.removeItem('gharvault_user');
};
