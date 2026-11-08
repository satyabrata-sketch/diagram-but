import { supabase, isSupabaseConfigured } from './supabase';
import bcrypt from 'bcryptjs';

export const DEFAULT_ADMIN = {
  username: '7008952166',
  password: 'Satya@050496',
  full_name: 'Satya',
  role: 'admin' as const,
};

export async function ensureAdminExists() {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    // Check if any users exist in app_users
    const { data: existingUsers, error: countError } = await supabase
      .from('app_users')
      .select('id, username')
      .limit(1);

    if (countError) {
      if (countError.message.includes('Could not find the table') || countError.code === 'PGRST205') {
        return {
          success: false,
          error: "Table 'app_users' not found in your Supabase database. Please run the SQL script in supabase/schema.sql in your Supabase SQL Editor.",
        };
      }
      return { success: false, error: countError.message };
    }

    // If at least one user exists, no need to auto-create
    if (existingUsers && existingUsers.length > 0) {
      return { success: true, message: 'Users already exist' };
    }

    // Auto-create initial admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, salt);

    const { data: newUser, error: insertUserError } = await supabase
      .from('app_users')
      .insert([
        {
          username: DEFAULT_ADMIN.username,
          password: hashedPassword,
          full_name: DEFAULT_ADMIN.full_name,
          role: DEFAULT_ADMIN.role,
          is_active: true,
        },
      ])
      .select('id, username, full_name, role')
      .single();

    if (insertUserError) {
      return { success: false, error: insertUserError.message };
    }

    // Also insert into profiles table if profiles exists
    if (newUser) {
      try {
        await supabase.from('profiles').insert([
          {
            id: newUser.id,
            username: DEFAULT_ADMIN.username,
            full_name: DEFAULT_ADMIN.full_name,
            role: DEFAULT_ADMIN.role,
          },
        ]);
      } catch {
        // Non-fatal if profiles sync fails
      }
    }

    return { success: true, created: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during admin initialization';
    return { success: false, error: message };
  }
}
