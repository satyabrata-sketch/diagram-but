import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 500 }
    );
  }

  try {
    const { data: users, error } = await supabase
      .from('app_users')
      .select('id, username, full_name, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch users';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { username, password, full_name, role } = body;

    if (!username || !password || !full_name) {
      return NextResponse.json(
        { error: 'Username, password, and full name are required' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();
    const validRole = role === 'admin' ? 'admin' : 'user';

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('app_users')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    // Insert user into app_users
    const { data: newUser, error: insertError } = await supabase
      .from('app_users')
      .insert([
        {
          username: cleanUsername,
          password: hashedPassword,
          full_name: String(full_name).trim(),
          role: validRole,
          is_active: true,
        },
      ])
      .select('id, username, full_name, role, is_active, created_at')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Also sync to profiles table
    if (newUser) {
      await supabase.from('profiles').upsert([
        {
          id: newUser.id,
          username: cleanUsername,
          full_name: String(full_name).trim(),
          role: validRole,
        },
      ]);
    }

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
