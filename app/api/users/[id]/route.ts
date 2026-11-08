import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 500 }
    );
  }

  try {
    const { id } = params;
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (typeof body.is_active === 'boolean') {
      updateData.is_active = body.is_active;
    }

    if (body.role && (body.role === 'admin' || body.role === 'user')) {
      updateData.role = body.role;
    }

    if (body.full_name) {
      updateData.full_name = String(body.full_name).trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    const { data: updatedUser, error } = await supabase
      .from('app_users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, full_name, role, is_active, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync profiles if role or full_name changed
    if (updateData.role || updateData.full_name) {
      const profileUpdate: Record<string, unknown> = {};
      if (updateData.role) profileUpdate.role = updateData.role;
      if (updateData.full_name) profileUpdate.full_name = updateData.full_name;
      await supabase.from('profiles').update(profileUpdate).eq('id', id);
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 500 }
    );
  }

  try {
    const { id } = params;

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('app_users')
      .select('id, username, role')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete from profiles and app_users
    await supabase.from('profiles').delete().eq('id', id);
    const { error: deleteError } = await supabase.from('app_users').delete().eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
