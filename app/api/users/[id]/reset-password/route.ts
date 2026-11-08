import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 500 }
    );
  }

  try {
    const { id } = params;
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || String(newPassword).trim().length < 4) {
      return NextResponse.json(
        { error: 'New password must be at least 4 characters long' },
        { status: 400 }
      );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(newPassword), salt);

    const { error } = await supabase
      .from('app_users')
      .update({ password: hashedPassword })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reset password';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
