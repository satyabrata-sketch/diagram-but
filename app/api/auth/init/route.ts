import { NextResponse } from 'next/server';
import { ensureAdminExists } from '@/lib/admin-init';

export async function POST() {
  const result = await ensureAdminExists();
  return NextResponse.json(result);
}

export async function GET() {
  const result = await ensureAdminExists();
  return NextResponse.json(result);
}
