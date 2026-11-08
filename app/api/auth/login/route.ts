import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ensureAdminExists } from '@/lib/admin-init';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();

    // Ensure admin user exists if table is empty
    const initResult = await ensureAdminExists();
    if (!initResult.success && initResult.error && initResult.error.includes("Table 'app_users' not found")) {
      return NextResponse.json(
        { error: initResult.error },
        { status: 500 }
      );
    }

    // Fetch user from app_users
    const { data: user, error } = await supabase
      .from('app_users')
      .select('id, username, password, full_name, role, is_active')
      .eq('username', cleanUsername)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'This account has been deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }

    // Verify password with bcrypt
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(String(password), user.password);
    } catch {
      // In case password was saved without hash initially
      isMatch = String(password) === user.password;
    }

    // Direct fallback if hash compare failed
    if (!isMatch && String(password) === user.password) {
      isMatch = true;
      // Upgrade plain password to bcrypt hash in background
      try {
        const upgradedHash = await bcrypt.hash(String(password), 10);
        await supabase.from('app_users').update({ password: upgradedHash }).eq('id', user.id);
      } catch {
        // Ignore background upgrade failure
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
