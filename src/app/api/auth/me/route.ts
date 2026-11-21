import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findOne({ username: session.username }).select('-password');

  return NextResponse.json({
    authenticated: true,
    user: user || { username: session.username, role: session.role },
  });
}
